from fastapi import APIRouter, HTTPException, Depends, Header
from auth.schemas import RegisterRequest, LoginRequest, UserResponse
from auth.service import (
    hash_password, verify_password, create_jwt, decode_jwt, new_user_id, now_iso
)
from memory.service import save_user_auth, get_user_by_email, get_vibe_profile

router = APIRouter(prefix="/api/auth")

async def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_jwt(token)
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/register")
async def register(req: RegisterRequest):
    existing = await get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user_id = new_user_id()
    record = {
        "user_id": user_id,
        "email": req.email,
        "password_hash": hash_password(req.password),
        "created_at": now_iso(),
    }
    await save_user_auth(req.email, record)
    token = create_jwt(user_id, req.email)
    return {"token": token, "user": {"id": user_id, "email": req.email, "has_vibe": False}}

@router.post("/login")
async def login(req: LoginRequest):
    record = await get_user_by_email(req.email)
    if not record or not verify_password(req.password, record["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    has_vibe = await get_vibe_profile(record["user_id"]) is not None
    token = create_jwt(record["user_id"], req.email)
    return {
        "token": token,
        "user": {"id": record["user_id"], "email": req.email, "has_vibe": has_vibe},
    }

@router.get("/me", response_model=UserResponse)
async def me(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_jwt(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload["sub"]
    email = payload.get("email", "")
    has_vibe = await get_vibe_profile(user_id) is not None
    return UserResponse(id=user_id, email=email, has_vibe=has_vibe)
