from fastapi import APIRouter, HTTPException, Depends
from src.db import get_pool
from src.middleware.auth import require_roles

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(user: dict = Depends(require_roles("admin"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id, email, name, role, is_active, created_at FROM users ORDER BY created_at DESC")
    return [dict(r) for r in rows]


@router.patch("/{user_id}/toggle-active")
async def toggle_user(user_id: int, user: dict = Depends(require_roles("admin"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE users SET is_active = NOT is_active WHERE id=$1 RETURNING id, email, name, role, is_active",
            user_id
        )
    if not row:
        raise HTTPException(404, "User not found")
    return dict(row)


@router.delete("/{user_id}")
async def delete_user(user_id: int, user: dict = Depends(require_roles("admin"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        deleted = await conn.fetchval("DELETE FROM users WHERE id=$1 RETURNING id", user_id)
    if not deleted:
        raise HTTPException(404, "User not found")
    return {"deleted": True}
