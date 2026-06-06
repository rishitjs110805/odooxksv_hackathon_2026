from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from src.db import get_pool
from src.middleware.auth import get_current_user, require_roles
from src.controller.activity import log_activity

router = APIRouter(prefix="/invoices", tags=["invoices"])


class InvoiceBody(BaseModel):
    po_id: int
    tax_rate: float = 18.0


@router.post("")
async def generate_invoice(body: InvoiceBody, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        po = await conn.fetchrow("SELECT * FROM purchase_orders WHERE id=$1", body.po_id)
        if not po:
            raise HTTPException(404, "PO not found")
        existing = await conn.fetchrow("SELECT id FROM invoices WHERE po_id=$1", body.po_id)
        if existing:
            raise HTTPException(400, "Invoice already exists for this PO")
        q = await conn.fetchrow("SELECT total_amount FROM quotations WHERE id=$1", po["quotation_id"])
        subtotal = float(q["total_amount"])
        tax_amount = round(subtotal * body.tax_rate / 100, 2)
        total = round(subtotal + tax_amount, 2)
        count = await conn.fetchval("SELECT COUNT(*) FROM invoices")
        invoice_number = f"INV-{int(count) + 1:06d}"
        row = await conn.fetchrow(
            """INSERT INTO invoices (po_id, invoice_number, tax_rate, subtotal, tax_amount, total)
               VALUES ($1,$2,$3,$4,$5,$6) RETURNING *""",
            body.po_id, invoice_number, body.tax_rate, subtotal, tax_amount, total
        )
        await log_activity(conn, int(user["sub"]), "generated", "invoice", row["id"], {"invoice_number": invoice_number})
    return dict(row)


@router.get("")
async def list_invoices(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        if user["role"] == "vendor":
            vendor = await conn.fetchrow("SELECT id FROM vendors WHERE user_id=$1", int(user["sub"]))
            if not vendor:
                return []
            rows = await conn.fetch(
                """SELECT i.*, po.po_number, v.name as vendor_name
                   FROM invoices i
                   JOIN purchase_orders po ON po.id=i.po_id
                   JOIN quotations q ON q.id=po.quotation_id
                   JOIN vendors v ON v.id=q.vendor_id
                   WHERE q.vendor_id=$1 ORDER BY i.created_at DESC""",
                vendor["id"]
            )
        else:
            rows = await conn.fetch(
                """SELECT i.*, po.po_number, v.name as vendor_name
                   FROM invoices i
                   JOIN purchase_orders po ON po.id=i.po_id
                   JOIN quotations q ON q.id=po.quotation_id
                   JOIN vendors v ON v.id=q.vendor_id
                   ORDER BY i.created_at DESC"""
            )
    return [dict(r) for r in rows]


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: int, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT i.*, po.po_number, po.delivery_date, po.status as po_status,
                      v.name as vendor_name, v.email as vendor_email, v.gst_number, v.address,
                      v.city, v.state, v.pincode,
                      r.title as rfq_title, q.delivery_days
               FROM invoices i
               JOIN purchase_orders po ON po.id=i.po_id
               JOIN quotations q ON q.id=po.quotation_id
               JOIN vendors v ON v.id=q.vendor_id
               JOIN rfqs r ON r.id=q.rfq_id
               WHERE i.id=$1""",
            invoice_id
        )
    if not row:
        raise HTTPException(404, "Invoice not found")
    return dict(row)


@router.patch("/{invoice_id}/status")
async def update_invoice_status(invoice_id: int, status: str, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    if status not in ("generated", "sent", "paid", "cancelled"):
        raise HTTPException(400, "Invalid status")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("UPDATE invoices SET status=$1 WHERE id=$2 RETURNING *", status, invoice_id)
        if not row:
            raise HTTPException(404, "Invoice not found")
        await log_activity(conn, int(user["sub"]), f"invoice_{status}", "invoice", invoice_id, {})
    return dict(row)
