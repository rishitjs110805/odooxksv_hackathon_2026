from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
import secrets
import os
import smtplib
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
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


class ProfileBody(BaseModel):
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class ForgotPasswordBody(BaseModel):
    email: EmailStr


class ResetPasswordBody(BaseModel):
    token: str
    new_password: str


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
    print(f"[LOGIN] Attempt for email: '{body.email}'")
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE email=$1", body.email)
    if not user:
        print(f"[LOGIN] No user found with email: '{body.email}'")
        raise HTTPException(401, "Invalid credentials")
    pwd_ok = verify_password(body.password, user["password_hash"])
    print(f"[LOGIN] User found: id={user['id']}, password check: {pwd_ok}")
    if not pwd_ok:
        raise HTTPException(401, "Invalid credentials")
    if not user["is_active"]:
        raise HTTPException(403, "Account disabled")
    token = create_access_token({"sub": str(user["id"]), "email": user["email"], "role": user["role"], "name": user["name"]})
    return {"access_token": token, "token_type": "bearer"}



@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, created_at, is_active FROM users WHERE id=$1",
            int(user["sub"])
        )
    if not row:
        raise HTTPException(404, "User not found")
    return {**user, "id": row["id"], "created_at": str(row["created_at"]), "is_active": row["is_active"]}


@router.put("/profile")
async def update_profile(body: ProfileBody, user: dict = Depends(get_current_user)):
    if not body.name and not body.new_password:
        raise HTTPException(400, "Nothing to update")
    pool = await get_pool()
    async with pool.acquire() as conn:
        db_user = await conn.fetchrow("SELECT * FROM users WHERE id=$1", int(user["sub"]))
        if not db_user:
            raise HTTPException(404, "User not found")
        if body.new_password:
            if not body.current_password:
                raise HTTPException(400, "Current password required")
            if not verify_password(body.current_password, db_user["password_hash"]):
                raise HTTPException(400, "Current password is incorrect")
            if len(body.new_password) < 6:
                raise HTTPException(400, "New password must be at least 6 characters")
            await conn.execute(
                "UPDATE users SET password_hash=$1 WHERE id=$2",
                hash_password(body.new_password), int(user["sub"])
            )
        if body.name and body.name.strip():
            await conn.execute(
                "UPDATE users SET name=$1 WHERE id=$2",
                body.name.strip(), int(user["sub"])
            )
    return {"success": True, "name": body.name.strip() if body.name else db_user["name"]}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordBody):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id, name FROM users WHERE email=$1 AND is_active=TRUE", body.email)
        if not user:
            return {"message": "If that email is registered, a reset link has been sent."}

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await conn.execute("DELETE FROM password_reset_tokens WHERE user_id=$1", user["id"])
        await conn.execute(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            user["id"], token, expires_at
        )

        email_sent = False
        smtp_host = os.getenv("SMTP_HOST")
        smtp_user_env = os.getenv("SMTP_USER")
        if smtp_host and smtp_user_env:
            try:
                frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
                reset_link = f"{frontend_url}?reset_token={token}"
                msg = MIMEMultipart("alternative")
                msg["Subject"] = "Reset Your VendorBridge Password"
                msg["From"] = smtp_user_env
                msg["To"] = body.email
                html_body = f"""
                <html><body style="font-family:sans-serif;background:#f8fafc;padding:24px;">
                <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <div style="width:32px;height:32px;background:#4f46e5;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">V</div>
                    <strong style="color:#1e293b;font-size:15px;">VendorBridge</strong>
                  </div>
                  <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px;">Password Reset</h2>
                  <p style="color:#64748b;">Hi <strong>{user['name']}</strong>,</p>
                  <p style="color:#64748b;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                  <div style="margin:24px 0;">
                    <a href="{reset_link}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Reset Password</a>
                  </div>
                  <p style="color:#94a3b8;font-size:12px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
                </div></body></html>
                """
                msg.attach(MIMEText(html_body, "html"))
                smtp_port = int(os.getenv("SMTP_PORT", "587"))
                smtp_pass = os.getenv("SMTP_PASSWORD", "")
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user_env, smtp_pass)
                    server.sendmail(smtp_user_env, body.email, msg.as_string())
                email_sent = True
                print(f"[AUTH] Password reset email sent to {body.email}")
            except Exception as e:
                print(f"[AUTH] SMTP ERROR sending reset email: {e}")
                traceback.print_exc()

        # In dev mode: if email failed, return the token so password reset still works
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        if not email_sent:
            reset_link = f"{frontend_url}?reset_token={token}"
            return {
                "message": "Email could not be sent (SMTP not configured or credentials invalid). Use the reset link below.",
                "reset_link": reset_link,
                "reset_token": token
            }

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordBody):
    if len(body.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    pool = await get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            "SELECT * FROM password_reset_tokens WHERE token=$1 AND used=FALSE",
            body.token
        )
        if not record:
            raise HTTPException(400, "Invalid or expired reset link")
        if record["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(400, "Reset link has expired. Request a new one.")
        await conn.execute(
            "UPDATE users SET password_hash=$1 WHERE id=$2",
            hash_password(body.new_password), record["user_id"]
        )
        await conn.execute(
            "UPDATE password_reset_tokens SET used=TRUE WHERE id=$1",
            record["id"]
        )
    return {"message": "Password reset successfully. You can now sign in."}
