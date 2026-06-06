from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import date
from src.db import get_pool
from src.middleware.auth import get_current_user, require_roles
from src.controller.activity import log_activity

router = APIRouter(prefix="/purchase-orders", tags=["purchase_orders"])


class POBody(BaseModel):
    quotation_id: int
    delivery_date: Optional[date] = None


@router.post("")
async def create_po(body: POBody, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        q = await conn.fetchrow("SELECT * FROM quotations WHERE id=$1", body.quotation_id)
        if not q:
            raise HTTPException(404, "Quotation not found")
        if q["status"] != "accepted":
            raise HTTPException(400, "Quotation must be accepted before generating PO")
        approval = await conn.fetchrow(
            "SELECT * FROM approvals WHERE quotation_id=$1 AND status='approved'", body.quotation_id
        )
        if not approval:
            raise HTTPException(400, "No approved approval for this quotation")
        existing_po = await conn.fetchrow("SELECT id FROM purchase_orders WHERE quotation_id=$1", body.quotation_id)
        if existing_po:
            raise HTTPException(400, "PO already exists for this quotation")

        count = await conn.fetchval("SELECT COUNT(*) FROM purchase_orders")
        po_number = f"PO-{int(count) + 1:06d}"

        row = await conn.fetchrow(
            """INSERT INTO purchase_orders (quotation_id, po_number, status, delivery_date, created_by)
               VALUES ($1,$2,'issued',$3,$4) RETURNING *""",
            body.quotation_id, po_number, body.delivery_date, int(user["sub"])
        )
        await log_activity(conn, int(user["sub"]), "created", "purchase_order", row["id"], {"po_number": po_number})
    return dict(row)


@router.get("")
async def list_pos(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        if user["role"] == "vendor":
            vendor = await conn.fetchrow("SELECT id FROM vendors WHERE user_id=$1", int(user["sub"]))
            if not vendor:
                return []
            rows = await conn.fetch(
                """SELECT po.*, q.total_amount, v.name as vendor_name
                   FROM purchase_orders po
                   JOIN quotations q ON q.id=po.quotation_id
                   JOIN vendors v ON v.id=q.vendor_id
                   WHERE q.vendor_id=$1 ORDER BY po.created_at DESC""",
                vendor["id"]
            )
        else:
            rows = await conn.fetch(
                """SELECT po.*, q.total_amount, v.name as vendor_name
                   FROM purchase_orders po
                   JOIN quotations q ON q.id=po.quotation_id
                   JOIN vendors v ON v.id=q.vendor_id
                   ORDER BY po.created_at DESC"""
            )
    return [dict(r) for r in rows]


@router.get("/{po_id}")
async def get_po(po_id: int, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT po.*, q.total_amount, q.delivery_days, q.notes as quotation_notes,
                      v.name as vendor_name, v.email as vendor_email, v.gst_number, v.address,
                      r.title as rfq_title, r.deadline
               FROM purchase_orders po
               JOIN quotations q ON q.id=po.quotation_id
               JOIN vendors v ON v.id=q.vendor_id
               JOIN rfqs r ON r.id=q.rfq_id
               WHERE po.id=$1""",
            po_id
        )
    if not row:
        raise HTTPException(404, "PO not found")
    return dict(row)


@router.patch("/{po_id}/status")
async def update_po_status(po_id: int, status: str, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    if status not in ("issued", "delivered", "cancelled"):
        raise HTTPException(400, "Invalid status")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("UPDATE purchase_orders SET status=$1 WHERE id=$2 RETURNING *", status, po_id)
        if not row:
            raise HTTPException(404, "PO not found")
        await log_activity(conn, int(user["sub"]), f"po_status_{status}", "purchase_order", po_id, {})
    return dict(row)
