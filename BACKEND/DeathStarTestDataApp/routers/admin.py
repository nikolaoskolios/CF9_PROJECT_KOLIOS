from typing import Annotated, List
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from starlette import status
from ..models import TestResults, Users, SUBSYSTEM_TEST_FIELDS, compute_overall_test_rate
from ..database import SessionLocal
from .auth import get_current_user, bcrypt_context, ensure_username_and_email_available, CreateUserRequest
from .test_results import TestResultRequest, TestResultResponse
from .users import UserResponse

router = APIRouter(
    prefix='/admin',
    tags=['admin']
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


@router.get("/test-results", status_code=status.HTTP_200_OK, response_model=List[TestResultResponse])
async def read_all(user: user_dependency, db: db_dependency):
    if user is None or user.get('user_role') != 'admin':
        raise HTTPException(status_code=401, detail='Authentication Failed')
    return db.query(TestResults).order_by(TestResults.id.desc()).all()


@router.put("/test-results/{test_result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_test_result(user: user_dependency, db: db_dependency,
                             test_result_request: TestResultRequest,
                             test_result_id: int = Path(gt=0)):
    if user is None or user.get('user_role') != 'admin':
        raise HTTPException(status_code=401, detail='Authentication Failed')

    test_result_model = db.query(TestResults).filter(TestResults.id == test_result_id).first()
    if test_result_model is None:
        raise HTTPException(status_code=404, detail='Test result not found.')

    for field, value in test_result_request.model_dump().items():
        setattr(test_result_model, field, value)

    test_result_model.overall_test_rate = compute_overall_test_rate(
        getattr(test_result_model, field) for field in SUBSYSTEM_TEST_FIELDS
    )

    db.add(test_result_model)
    db.commit()


@router.delete("/test-results/{test_result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_result(user: user_dependency, db: db_dependency, test_result_id: int = Path(gt=0)):
    if user is None or user.get('user_role') != 'admin':
        raise HTTPException(status_code=401, detail='Authentication Failed')
    test_result_model = db.query(TestResults).filter(TestResults.id == test_result_id).first()
    if test_result_model is None:
        raise HTTPException(status_code=404, detail='Test result not found.')
    db.query(TestResults).filter(TestResults.id == test_result_id).delete()
    db.commit()


@router.get("/user", status_code=status.HTTP_200_OK, response_model=List[UserResponse])
async def read_all_users(user: user_dependency, db: db_dependency):
    if user is None or user.get('user_role') != 'admin':
        raise HTTPException(status_code=401, detail='Authentication Failed')
    return db.query(Users).all()


@router.post("/user", status_code=status.HTTP_201_CREATED)
async def create_user(user: user_dependency, db: db_dependency,
                      create_user_request: CreateUserRequest):
    if user is None or user.get('user_role') != 'admin':
        raise HTTPException(status_code=401, detail='Authentication Failed')

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


@router.delete("/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user: user_dependency, db: db_dependency, user_id: int = Path(gt=0)):
    if user is None or user.get('user_role') != 'admin':
        raise HTTPException(status_code=401, detail='Authentication Failed')

    user_model = db.query(Users).filter(Users.id == user_id).first()
    if user_model is None:
        raise HTTPException(status_code=404, detail='User not found.')

    if user_model.id == user.get('id'):
        raise HTTPException(status_code=400, detail='You cannot delete your own account.')

    db.query(Users).filter(Users.id == user_id).delete()
    db.commit()
