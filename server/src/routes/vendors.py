from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import Optional
from src.db import get_pool
from src.middleware.auth import get_current_user, require_roles
from src.controller.activity import log_activity

router = APIRouter(prefix="/vendors", tags=["vendors"])


class VendorBody(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    category: Optional[str] = None
    status: str = "active"
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    photo_url: Optional[str] = None


@router.get("")
async def list_vendors(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        filters, params, idx = [], [], 1
        if search:
            filters.append(f"(name ILIKE ${idx} OR email ILIKE ${idx} OR gst_number ILIKE ${idx} OR category ILIKE ${idx})")
            params.append(f"%{search}%"); idx += 1
        if category:
            filters.append(f"category = ${idx}")
            params.append(category); idx += 1
        if status:
            filters.append(f"status = ${idx}")
            params.append(status); idx += 1
        where = ("WHERE " + " AND ".join(filters)) if filters else ""
        rows = await conn.fetch(f"SELECT * FROM vendors {where} ORDER BY created_at DESC", *params)
    return [dict(r) for r in rows]


@router.post("")
async def create_vendor(body: VendorBody, user: dict = Depends(require_roles("admin", "procurement_officer", "manager"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchval("SELECT id FROM vendors WHERE email=$1", body.email)
        if existing:
            raise HTTPException(400, "Vendor email already exists")
        row = await conn.fetchrow(
            """INSERT INTO vendors (name, email, phone, gst_number, category, status, address, city, state, pincode, photo_url)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *""",
            body.name, body.email, body.phone, body.gst_number, body.category,
            body.status, body.address, body.city, body.state, body.pincode, body.photo_url
        )
        await log_activity(conn, int(user["sub"]), "created", "vendor", row["id"], {"name": body.name})
    return dict(row)


@router.get("/{vendor_id}")
async def get_vendor(vendor_id: int, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM vendors WHERE id=$1", vendor_id)
    if not row:
        raise HTTPException(404, "Vendor not found")
    return dict(row)


@router.put("/{vendor_id}")
async def update_vendor(vendor_id: int, body: VendorBody, user: dict = Depends(require_roles("admin", "procurement_officer", "manager"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """UPDATE vendors SET name=$1, email=$2, phone=$3, gst_number=$4, category=$5,
               status=$6, address=$7, city=$8, state=$9, pincode=$10, photo_url=$11
               WHERE id=$12 RETURNING *""",
            body.name, body.email, body.phone, body.gst_number, body.category,
            body.status, body.address, body.city, body.state, body.pincode, body.photo_url, vendor_id
        )
    if not row:
        raise HTTPException(404, "Vendor not found")
    return dict(row)


@router.delete("/{vendor_id}")
async def delete_vendor(vendor_id: int, user: dict = Depends(require_roles("admin"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        deleted = await conn.fetchval("DELETE FROM vendors WHERE id=$1 RETURNING id", vendor_id)
    if not deleted:
        raise HTTPException(404, "Vendor not found")
    return {"deleted": True}
