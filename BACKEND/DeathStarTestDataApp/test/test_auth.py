from .utils import *
from ..routers.auth import get_db, authenticate_user, create_access_token, SECRET_KEY, ALGORITHM, get_current_user
from jose import jwt
from datetime import timedelta
import pytest
from fastapi import HTTPException

app.dependency_overrides[get_db] = override_get_db

def test_authenticate_user(test_user):
    db = TestingSessionLocal()

    authenticated_user = authenticate_user(test_user.username, 'testpassword', db)
    assert authenticated_user is not None
    assert authenticated_user.username == test_user.username

    non_existent_user = authenticate_user('WrongUserName', 'testpassword', db)
    assert non_existent_user is False

    wrong_password_user = authenticate_user(test_user.username, 'wrongpassword', db)
    assert wrong_password_user is False


def test_create_access_token():
    username = 'testuser'
    user_id = 1
    role = 'user'
    expires_delta = timedelta(days=1)

    token = create_access_token(username, user_id, role, expires_delta)

    decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM],
                               options={'verify_signature': False})

    assert decoded_token['sub'] == username
    assert decoded_token['id'] == user_id
    assert decoded_token['role'] == role


@pytest.mark.asyncio
async def test_get_current_user_valid_token():
    encode = {'sub': 'testuser', 'id': 1, 'role': 'admin'}
    token = jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

    user = await get_current_user(token=token)
    assert user == {'username': 'testuser', 'id': 1, 'user_role': 'admin'}


@pytest.mark.asyncio
async def test_get_current_user_missing_payload():
    encode = {'role': 'user'}
    token = jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(token=token)

    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == 'Could not validate user.'


def test_login_rate_limited_after_five_attempts(test_user):
    # 5/minute on /auth/token - the first 5 requests are each judged on their
    # own merits (wrong password -> 401 every time); the 6th is blocked by
    # the limiter itself before authentication even runs.
    for _ in range(5):
        response = client.post('/auth/token', data={
            'username': test_user.username, 'password': 'wrongpassword',
        })
        assert response.status_code == 401

    response = client.post('/auth/token', data={
        'username': test_user.username, 'password': 'wrongpassword',
    })
    assert response.status_code == 429


def test_generate_api_key_rate_limited_after_five_attempts(test_user):
    app.dependency_overrides[get_current_user] = lambda: {
        'username': test_user.username, 'id': test_user.id, 'user_role': test_user.role,
    }
    try:
        for _ in range(5):
            response = client.post('/auth/api-key')
            assert response.status_code == 200

        response = client.post('/auth/api-key')
        assert response.status_code == 429
    finally:
        # Restore, don't delete - other test modules set this override once
        # at import time (not per-test), so deleting it would leave it
        # missing for every test that runs after this one in the suite.
        app.dependency_overrides[get_current_user] = override_get_current_user
