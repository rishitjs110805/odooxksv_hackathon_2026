from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.db import get_pool
from src.middleware.auth import get_current_user, require_roles
from src.controller.activity import log_activity

router = APIRouter(prefix="/invoices", tags=["invoices"])


class InvoiceBody(BaseModel):
    po_id: int
    tax_rate: float = 18.0


class SendEmailBody(BaseModel):
    recipient_email: Optional[str] = None


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


@router.post("/{invoice_id}/send-email")
async def send_invoice_email(invoice_id: int, body: SendEmailBody, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT i.*, po.po_number, v.name as vendor_name, v.email as vendor_email,
                      r.title as rfq_title
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

        recipient = body.recipient_email or row["vendor_email"]
        if not recipient:
            raise HTTPException(400, "No recipient email available. Add vendor email or provide one.")

        invoice = dict(row)
        simulated = True

        smtp_host = os.getenv("SMTP_HOST")
        smtp_user_env = os.getenv("SMTP_USER")
        if smtp_host and smtp_user_env:
            try:
                smtp_port = int(os.getenv("SMTP_PORT", "587"))
                smtp_pass = os.getenv("SMTP_PASSWORD", "")
                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"Invoice {invoice['invoice_number']} — VendorBridge"
                msg["From"] = smtp_user_env
                msg["To"] = recipient
                html_body = f"""
                <html><body style="font-family:sans-serif;color:#1e293b;background:#f8fafc;padding:24px;">
                <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                    <div style="width:36px;height:36px;background:#4f46e5;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">V</div>
                    <div><strong style="color:#1e293b;font-size:16px;">VendorBridge</strong><div style="color:#64748b;font-size:12px;">Procurement ERP Platform</div></div>
                  </div>
                  <h2 style="color:#1e293b;margin:0 0 8px;">Invoice {invoice['invoice_number']}</h2>
                  <p style="color:#64748b;margin:0 0 24px;">Dear <strong>{invoice['vendor_name']}</strong>,</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">PO Number</td><td style="padding:8px 0;text-align:right;font-weight:500;">{invoice['po_number']}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">RFQ</td><td style="padding:8px 0;text-align:right;">{invoice['rfq_title']}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Subtotal</td><td style="padding:8px 0;text-align:right;">&#8377;{invoice['subtotal']}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">GST ({invoice['tax_rate']}%)</td><td style="padding:8px 0;text-align:right;">&#8377;{invoice['tax_amount']}</td></tr>
                    <tr style="background:#f0fdf4;"><td style="padding:12px 8px;font-weight:bold;color:#15803d;border-radius:4px;">Total Payable</td><td style="padding:12px 8px;text-align:right;font-weight:bold;color:#15803d;font-size:18px;">&#8377;{invoice['total']}</td></tr>
                  </table>
                  <p style="color:#94a3b8;font-size:12px;margin-top:24px;">This is an automated invoice from VendorBridge. Please contact your procurement officer for queries.</p>
                </div></body></html>
                """
                msg.attach(MIMEText(html_body, "html"))
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user_env, smtp_pass)
                    server.sendmail(smtp_user_env, recipient, msg.as_string())
                simulated = False
            except Exception:
                simulated = True

        await conn.execute("UPDATE invoices SET status='sent' WHERE id=$1", invoice_id)
        await log_activity(conn, int(user["sub"]), "email_sent", "invoice", invoice_id, {
            "recipient": recipient, "simulated": simulated
        })

    return {"sent": True, "recipient": recipient, "simulated": simulated, "invoice_number": invoice["invoice_number"]}
