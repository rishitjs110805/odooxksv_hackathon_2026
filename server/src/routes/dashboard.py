from fastapi import APIRouter, Depends
from src.db import get_pool
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        active_rfqs = await conn.fetchval("SELECT COUNT(*) FROM rfqs WHERE status='open'")
        pending_approvals = await conn.fetchval("SELECT COUNT(*) FROM approvals WHERE status='pending'")
        total_vendors = await conn.fetchval("SELECT COUNT(*) FROM vendors WHERE status='active'")
        total_pos = await conn.fetchval("SELECT COUNT(*) FROM purchase_orders")
        total_invoices = await conn.fetchval("SELECT COUNT(*) FROM invoices")
        recent_pos = await conn.fetch(
            """SELECT po.*, v.name as vendor_name, q.total_amount
               FROM purchase_orders po
               JOIN quotations q ON q.id=po.quotation_id
               JOIN vendors v ON v.id=q.vendor_id
               ORDER BY po.created_at DESC LIMIT 5"""
        )
        recent_invoices = await conn.fetch(
            """SELECT i.*, po.po_number, v.name as vendor_name
               FROM invoices i
               JOIN purchase_orders po ON po.id=i.po_id
               JOIN quotations q ON q.id=po.quotation_id
               JOIN vendors v ON v.id=q.vendor_id
               ORDER BY i.created_at DESC LIMIT 5"""
        )
    return {
        "stats": {
            "active_rfqs": active_rfqs,
            "pending_approvals": pending_approvals,
            "total_vendors": total_vendors,
            "total_pos": total_pos,
            "total_invoices": total_invoices,
        },
        "recent_pos": [dict(r) for r in recent_pos],
        "recent_invoices": [dict(r) for r in recent_invoices],
    }
