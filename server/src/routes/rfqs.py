from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from src.db import get_pool
from src.middleware.auth import get_current_user, require_roles
from src.controller.activity import log_activity

router = APIRouter(prefix="/rfqs", tags=["rfqs"])


class RFQItem(BaseModel):
    product_name: str
    quantity: float
    unit: Optional[str] = None
    specifications: Optional[str] = None


class RFQBody(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    deadline: date
    status: str = 'open'
    vendor_ids: List[int] = []
    items: List[RFQItem] = []


@router.get("")
async def list_rfqs(
    status: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        if user["role"] == "vendor":
            vendor = await conn.fetchrow("SELECT id FROM vendors WHERE user_id=$1", int(user["sub"]))
            if not vendor:
                return []
            rows = await conn.fetch(
                """SELECT r.* FROM rfqs r
                   JOIN rfq_vendors rv ON rv.rfq_id = r.id
                   WHERE rv.vendor_id=$1 AND ($2::text IS NULL OR r.status=$2)
                   ORDER BY r.created_at DESC""",
                vendor["id"], status
            )
        else:
            rows = await conn.fetch(
                "SELECT * FROM rfqs WHERE ($1::text IS NULL OR status=$1) ORDER BY created_at DESC",
                status
            )
    return [dict(r) for r in rows]


@router.post("")
async def create_rfq(body: RFQBody, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    if body.status not in ("draft", "open"):
        raise HTTPException(400, "Status must be 'draft' or 'open'")
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            rfq = await conn.fetchrow(
                """INSERT INTO rfqs (title, description, category, deadline, status, created_by)
                   VALUES ($1,$2,$3,$4,$5,$6) RETURNING *""",
                body.title, body.description, body.category, body.deadline, body.status, int(user["sub"])
            )
            rfq_id = rfq["id"]
            for item in body.items:
                await conn.execute(
                    "INSERT INTO rfq_items (rfq_id, product_name, quantity, unit, specifications) VALUES ($1,$2,$3,$4,$5)",
                    rfq_id, item.product_name, item.quantity, item.unit, item.specifications
                )
            for vid in body.vendor_ids:
                await conn.execute(
                    "INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
                    rfq_id, vid
                )
            await log_activity(conn, int(user["sub"]), "created", "rfq", rfq_id, {"title": body.title, "status": body.status})
    return dict(rfq)


@router.get("/{rfq_id}")
async def get_rfq(rfq_id: int, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rfq = await conn.fetchrow("SELECT * FROM rfqs WHERE id=$1", rfq_id)
        if not rfq:
            raise HTTPException(404, "RFQ not found")
        items = await conn.fetch("SELECT * FROM rfq_items WHERE rfq_id=$1", rfq_id)
        vendors = await conn.fetch(
            "SELECT v.* FROM vendors v JOIN rfq_vendors rv ON rv.vendor_id=v.id WHERE rv.rfq_id=$1", rfq_id
        )
    return {**dict(rfq), "items": [dict(i) for i in items], "vendors": [dict(v) for v in vendors]}


@router.patch("/{rfq_id}/status")
async def update_rfq_status(rfq_id: int, status: str, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    if status not in ("draft", "open", "closed", "cancelled"):
        raise HTTPException(400, "Invalid status")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("UPDATE rfqs SET status=$1 WHERE id=$2 RETURNING *", status, rfq_id)
        if not row:
            raise HTTPException(404, "RFQ not found")
        await log_activity(conn, int(user["sub"]), f"status_changed_to_{status}", "rfq", rfq_id, {})
    return dict(row)


@router.delete("/{rfq_id}")
async def delete_rfq(rfq_id: int, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        deleted = await conn.fetchval("DELETE FROM rfqs WHERE id=$1 RETURNING id", rfq_id)
    if not deleted:
        raise HTTPException(404, "RFQ not found")
    return {"deleted": True}
