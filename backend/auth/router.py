import aiosqlite
from fastapi import APIRouter, HTTPException, Depends, Header
from auth.schemas import RegisterRequest, LoginRequest, UserResponse
from auth.service import (
    hash_password, verify_password, create_jwt, decode_jwt, new_user_id, now_iso
)
from config import SQLITE_PATH

router = APIRouter(prefix="/api/auth")

async def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        return decode_jwt(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/register")
async def register(req: RegisterRequest):
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        existing = await db.execute("SELECT id FROM users WHERE email = ?", (req.email,))
        if await existing.fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")
        user_id = new_user_id()
        await db.execute(
            "INSERT INTO users (id, email, password_hash, has_vibe, created_at) VALUES (?, ?, ?, 0, ?)",
            (user_id, req.email, hash_password(req.password), now_iso()),
        )
        await db.commit()
    token = create_jwt(user_id)
    return {"token": token, "user": {"id": user_id, "email": req.email, "has_vibe": False}}

@router.post("/login")
async def login(req: LoginRequest):
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM users WHERE email = ?", (req.email,))
        user = await cursor.fetchone()
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_jwt(user["id"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "has_vibe": bool(user["has_vibe"])},
    }

@router.get("/me", response_model=UserResponse)
async def me(user_id: str = Depends(get_current_user_id)):
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = await cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=user["id"], email=user["email"], has_vibe=bool(user["has_vibe"]))
