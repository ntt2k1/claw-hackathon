from auth.service import (
    hash_password, verify_password, create_jwt, decode_jwt, new_user_id
)
from jose import JWTError
import pytest

def test_hash_and_verify_password():
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed) is True
    assert verify_password("wrong", hashed) is False

def test_create_and_decode_jwt():
    user_id = new_user_id()
    token = create_jwt(user_id)
    decoded = decode_jwt(token)
    assert decoded == user_id

def test_decode_invalid_jwt_raises():
    with pytest.raises(JWTError):
        decode_jwt("not.a.valid.token")

def test_new_user_id_is_uuid():
    uid = new_user_id()
    assert len(uid) == 36
    assert uid.count("-") == 4
