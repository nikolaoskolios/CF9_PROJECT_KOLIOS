import hashlib
import os
import secrets
from datetime import timedelta, datetime, timezone
from pathlib import Path
from typing import Annotated, Optional
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status
from ..database import SessionLocal
from ..models import Users
from ..rate_limit import limiter
from passlib.context import CryptContext
from fastapi.security import APIKeyHeader, OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter(
    prefix='/auth',
    tags=['auth']
)

# Explicit path (rather than relying on cwd) so this loads the same way
# whether the app is started from BACKEND/ or tests are run from elsewhere.
load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')

SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = 'HS256'

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')
oauth2_bearer_optional = OAuth2PasswordBearer(tokenUrl='auth/token', auto_error=False)
api_key_header = APIKeyHeader(name='X-API-Key', auto_error=False)


class CreateUserRequest(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str
    role: str
    phone_number: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ApiKeyResponse(BaseModel):
    api_key: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


def ensure_username_and_email_available(db, username: str, email: str):
    if db.query(Users).filter(Users.username == username).first() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail='Username is already taken.')
    if db.query(Users).filter(Users.email == email).first() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail='Email is already registered.')


def authenticate_user(username: str, password: str, db):
    user = db.query(Users).filter(Users.username == username).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    return user


def create_access_token(username: str, user_id: int, role: str, expires_delta: timedelta):
    encode = {'sub': username, 'id': user_id, 'role': role}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def hash_api_key(raw_key: str) -> str:
    # A random, high-entropy token doesn't need a slow password hash like
    # bcrypt (that's for low-entropy human passwords) - SHA-256 is standard
    # practice for API keys (same approach GitHub/Stripe use).
    return hashlib.sha256(raw_key.encode()).hexdigest()


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        user_role: str = payload.get('role')
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail='Could not validate user.')
        return {'username': username, 'id': user_id, 'user_role': user_role}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='Could not validate user.')


async def get_current_user_or_api_key(
        db: db_dependency,
        token: Annotated[Optional[str], Depends(oauth2_bearer_optional)] = None,
        api_key: Annotated[Optional[str], Depends(api_key_header)] = None):
    if token is not None:
        return await get_current_user(token)

    if api_key is not None:
        user = db.query(Users).filter(Users.api_key_hash == hash_api_key(api_key)).first()
        if user is not None:
            return {'username': user.username, 'id': user.id, 'user_role': user.role}

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                        detail='Could not validate credentials.')


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency,
                      create_user_request: CreateUserRequest):
    ensure_username_and_email_available(db, create_user_request.username, create_user_request.email)

    create_user_model = Users(
        email=create_user_request.email,
        username=create_user_request.username,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        role=create_user_request.role,
        hashed_password=bcrypt_context.hash(create_user_request.password),
        is_active=True,
        phone_number=create_user_request.phone_number
    )

    db.add(create_user_model)
    db.commit()


@router.post("/token", response_model=Token)
@limiter.limit("15/minute")
async def login_for_access_token(request: Request,
                                 form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: db_dependency):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='Could not validate user.')
    token = create_access_token(user.username, user.id, user.role, timedelta(minutes=20))

    return {'access_token': token, 'token_type': 'bearer'}


@router.post("/api-key", response_model=ApiKeyResponse)
@limiter.limit("15/minute")
async def generate_api_key(request: Request, db: db_dependency,
                           user: Annotated[dict, Depends(get_current_user)]):
    """Generate a new long-lived API key for the logged-in user, replacing
    any previous one. The plaintext key is only ever returned here - only
    its hash is stored, so save it somewhere safe."""
    raw_key = secrets.token_urlsafe(32)

    user_model = db.query(Users).filter(Users.id == user.get('id')).first()
    user_model.api_key_hash = hash_api_key(raw_key)
    db.commit()

    return {'api_key': raw_key}
