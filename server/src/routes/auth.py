from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import bcrypt
from src.db import get_pool
from src.middleware.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


class SignupBody(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "procurement_officer"


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(body: SignupBody):
    if body.role not in ("admin", "procurement_officer", "manager", "vendor"):
        raise HTTPException(400, "Invalid role")
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchval("SELECT id FROM users WHERE email=$1", body.email)
        if existing:
            raise HTTPException(400, "Email already registered")
        user_id = await conn.fetchval(
            "INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) RETURNING id",
            body.email, hash_password(body.password), body.name, body.role
        )
    token = create_access_token({"sub": str(user_id), "email": body.email, "role": body.role, "name": body.name})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
async def login(body: LoginBody):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE email=$1", body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    if not user["is_active"]:
        raise HTTPException(403, "Account disabled")
    token = create_access_token({"sub": str(user["id"]), "email": user["email"], "role": user["role"], "name": user["name"]})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user
