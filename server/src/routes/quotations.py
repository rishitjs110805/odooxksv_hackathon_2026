from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from src.db import get_pool
from src.middleware.auth import get_current_user, require_roles
from src.controller.activity import log_activity

router = APIRouter(prefix="/quotations", tags=["quotations"])


class QuotationItemBody(BaseModel):
    rfq_item_id: int
    unit_price: float
    total_price: float


class QuotationBody(BaseModel):
    rfq_id: int
    vendor_id: int
    total_amount: float
    delivery_days: int
    notes: Optional[str] = None
    items: List[QuotationItemBody] = []


@router.post("")
async def submit_quotation(body: QuotationBody, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rfq = await conn.fetchrow("SELECT * FROM rfqs WHERE id=$1", body.rfq_id)
        if not rfq or rfq["status"] != "open":
            raise HTTPException(400, "RFQ not open for quotations")
        async with conn.transaction():
            q = await conn.fetchrow(
                """INSERT INTO quotations (rfq_id, vendor_id, total_amount, delivery_days, notes)
                   VALUES ($1,$2,$3,$4,$5) RETURNING *""",
                body.rfq_id, body.vendor_id, body.total_amount, body.delivery_days, body.notes
            )
            for item in body.items:
                await conn.execute(
                    "INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, total_price) VALUES ($1,$2,$3,$4)",
                    q["id"], item.rfq_item_id, item.unit_price, item.total_price
                )
            await log_activity(conn, int(user["sub"]), "submitted", "quotation", q["id"], {"rfq_id": body.rfq_id})
    return dict(q)


@router.get("/rfq/{rfq_id}")
async def list_quotations_for_rfq(rfq_id: int, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT q.*, v.name as vendor_name, v.email as vendor_email, v.category as vendor_category
               FROM quotations q JOIN vendors v ON v.id=q.vendor_id
               WHERE q.rfq_id=$1 ORDER BY q.total_amount ASC""",
            rfq_id
        )
    return [dict(r) for r in rows]


@router.get("/{quotation_id}")
async def get_quotation(quotation_id: int, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        q = await conn.fetchrow("SELECT * FROM quotations WHERE id=$1", quotation_id)
        if not q:
            raise HTTPException(404, "Quotation not found")
        items = await conn.fetch("SELECT * FROM quotation_items WHERE quotation_id=$1", quotation_id)
    return {**dict(q), "items": [dict(i) for i in items]}


@router.patch("/{quotation_id}/status")
async def update_quotation_status(
    quotation_id: int,
    status: str,
    user: dict = Depends(require_roles("admin", "procurement_officer", "manager"))
):
    if status not in ("submitted", "under_review", "accepted", "rejected"):
        raise HTTPException(400, "Invalid status")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE quotations SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
            status, quotation_id
        )
        if not row:
            raise HTTPException(404, "Quotation not found")
        await log_activity(conn, int(user["sub"]), f"quotation_{status}", "quotation", quotation_id, {})
    return dict(row)


@router.get("/compare/{rfq_id}")
async def compare_quotations(rfq_id: int, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        quotations = await conn.fetch(
            """SELECT q.*, v.name as vendor_name, v.email as vendor_email
               FROM quotations q JOIN vendors v ON v.id=q.vendor_id
               WHERE q.rfq_id=$1 ORDER BY q.total_amount ASC""",
            rfq_id
        )
        result = []
        for q in quotations:
            items = await conn.fetch("SELECT * FROM quotation_items WHERE quotation_id=$1", q["id"])
            result.append({**dict(q), "items": [dict(i) for i in items]})
    return result
