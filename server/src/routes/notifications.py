from fastapi import APIRouter, Depends
from src.db import get_pool
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    notifications = []

    async with pool.acquire() as conn:
        role = user["role"]

        if role in ("admin", "manager"):
            rows = await conn.fetch("""
                SELECT a.id, a.created_at, v.name as vendor_name, q.total_amount, r.title as rfq_title
                FROM approvals a
                JOIN quotations q ON q.id = a.quotation_id
                JOIN vendors v ON v.id = q.vendor_id
                JOIN rfqs r ON r.id = q.rfq_id
                WHERE a.status = 'pending'
                ORDER BY a.created_at DESC LIMIT 20
            """)
            for r in rows:
                notifications.append({
                    "id": f"approval_{r['id']}",
                    "type": "approval",
                    "title": "Approval Required",
                    "message": f"{r['vendor_name']} — {r['rfq_title']}",
                    "amount": float(r["total_amount"]) if r["total_amount"] else None,
                    "created_at": str(r["created_at"]),
                    "priority": "high",
                    "entity_type": "approval",
                    "entity_id": r["id"],
                    "nav": "approvals",
                })

        if role in ("admin", "procurement_officer", "manager"):
            rows = await conn.fetch("""
                SELECT q.id, q.created_at, v.name as vendor_name, r.title as rfq_title, q.total_amount
                FROM quotations q
                JOIN vendors v ON v.id = q.vendor_id
                JOIN rfqs r ON r.id = q.rfq_id
                WHERE q.status = 'submitted'
                ORDER BY q.created_at DESC LIMIT 20
            """)
            for r in rows:
                notifications.append({
                    "id": f"quotation_{r['id']}",
                    "type": "quotation",
                    "title": "New Quotation Received",
                    "message": f"{r['vendor_name']} submitted for {r['rfq_title']}",
                    "amount": float(r["total_amount"]) if r["total_amount"] else None,
                    "created_at": str(r["created_at"]),
                    "priority": "medium",
                    "entity_type": "quotation",
                    "entity_id": r["id"],
                    "nav": "quotations",
                })

            rows = await conn.fetch("""
                SELECT i.id, i.invoice_number, i.total, i.created_at, v.name as vendor_name
                FROM invoices i
                JOIN purchase_orders po ON po.id = i.po_id
                JOIN quotations q ON q.id = po.quotation_id
                JOIN vendors v ON v.id = q.vendor_id
                WHERE i.status = 'sent'
                ORDER BY i.created_at DESC LIMIT 10
            """)
            for r in rows:
                notifications.append({
                    "id": f"invoice_{r['id']}",
                    "type": "invoice",
                    "title": "Invoice Awaiting Payment",
                    "message": f"{r['invoice_number']} — {r['vendor_name']}",
                    "amount": float(r["total"]) if r["total"] else None,
                    "created_at": str(r["created_at"]),
                    "priority": "medium",
                    "entity_type": "invoice",
                    "entity_id": r["id"],
                    "nav": "invoices",
                })

            rows = await conn.fetch("""
                SELECT r.id, r.title, r.deadline
                FROM rfqs r
                WHERE r.status = 'open'
                AND r.deadline < CURRENT_DATE + INTERVAL '3 days'
                ORDER BY r.deadline ASC LIMIT 5
            """)
            for r in rows:
                notifications.append({
                    "id": f"rfq_deadline_{r['id']}",
                    "type": "deadline",
                    "title": "RFQ Deadline Soon",
                    "message": f"{r['title']} — closes {r['deadline']}",
                    "amount": None,
                    "created_at": str(r["deadline"]),
                    "priority": "high",
                    "entity_type": "rfq",
                    "entity_id": r["id"],
                    "nav": "rfqs",
                })

        if role == "vendor":
            vendor = await conn.fetchrow(
                "SELECT id FROM vendors WHERE user_id=$1", int(user["sub"])
            )
            if vendor:
                rows = await conn.fetch("""
                    SELECT r.id, r.title, r.deadline
                    FROM rfq_vendors rv
                    JOIN rfqs r ON r.id = rv.rfq_id
                    WHERE rv.vendor_id = $1
                    AND r.status = 'open'
                    AND NOT EXISTS (
                        SELECT 1 FROM quotations q WHERE q.rfq_id = r.id AND q.vendor_id = $1
                    )
                    ORDER BY r.deadline ASC LIMIT 10
                """, vendor["id"])
                for r in rows:
                    notifications.append({
                        "id": f"rfq_invite_{r['id']}",
                        "type": "rfq",
                        "title": "Quotation Requested",
                        "message": f"{r['title']} — deadline {r['deadline']}",
                        "amount": None,
                        "created_at": str(r["deadline"]),
                        "priority": "high",
                        "entity_type": "rfq",
                        "entity_id": r["id"],
                        "nav": "quotations",
                    })

                rows = await conn.fetch("""
                    SELECT q.id, q.status, q.updated_at, r.title as rfq_title, q.total_amount
                    FROM quotations q
                    JOIN rfqs r ON r.id = q.rfq_id
                    WHERE q.vendor_id = $1 AND q.status IN ('accepted', 'rejected')
                    ORDER BY q.updated_at DESC LIMIT 10
                """, vendor["id"])
                for r in rows:
                    notifications.append({
                        "id": f"quot_update_{r['id']}",
                        "type": "quotation_update",
                        "title": f"Quotation {r['status'].title()}",
                        "message": r["rfq_title"],
                        "amount": float(r["total_amount"]) if r["total_amount"] else None,
                        "created_at": str(r["updated_at"]),
                        "priority": "high" if r["status"] == "accepted" else "low",
                        "entity_type": "quotation",
                        "entity_id": r["id"],
                        "nav": "quotations",
                    })

                rows = await conn.fetch("""
                    SELECT po.id, po.po_number, po.created_at
                    FROM purchase_orders po
                    JOIN quotations q ON q.id = po.quotation_id
                    WHERE q.vendor_id = $1
                    ORDER BY po.created_at DESC LIMIT 5
                """, vendor["id"])
                for r in rows:
                    notifications.append({
                        "id": f"po_{r['id']}",
                        "type": "purchase_order",
                        "title": "Purchase Order Issued",
                        "message": r["po_number"],
                        "amount": None,
                        "created_at": str(r["created_at"]),
                        "priority": "high",
                        "entity_type": "purchase_order",
                        "entity_id": r["id"],
                        "nav": "purchase-orders",
                    })

    notifications.sort(key=lambda x: x["created_at"], reverse=True)
    return notifications
