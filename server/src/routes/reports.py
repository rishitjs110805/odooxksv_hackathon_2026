from fastapi import APIRouter, Depends, Query
from typing import Optional
from src.db import get_pool
from src.middleware.auth import require_roles

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/vendor-performance")
async def vendor_performance(user: dict = Depends(require_roles("admin", "manager", "procurement_officer"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT v.id, v.name, v.category,
                      COUNT(DISTINCT q.id) as total_quotations,
                      COUNT(DISTINCT CASE WHEN q.status='accepted' THEN q.id END) as accepted_quotations,
                      COUNT(DISTINCT po.id) as total_pos,
                      COALESCE(SUM(CASE WHEN q.status='accepted' THEN q.total_amount END), 0) as total_po_value,
                      COALESCE(AVG(q.delivery_days), 0) as avg_delivery_days
               FROM vendors v
               LEFT JOIN quotations q ON q.vendor_id=v.id
               LEFT JOIN purchase_orders po ON po.quotation_id=q.id
               GROUP BY v.id, v.name, v.category
               ORDER BY total_po_value DESC"""
        )
    return [dict(r) for r in rows]


@router.get("/spending-summary")
async def spending_summary(user: dict = Depends(require_roles("admin", "manager", "procurement_officer"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        monthly = await conn.fetch(
            """SELECT DATE_TRUNC('month', i.created_at) as month,
                      COUNT(i.id) as invoice_count,
                      SUM(i.total) as total_spend,
                      SUM(i.tax_amount) as total_tax
               FROM invoices i
               WHERE i.status != 'cancelled'
               GROUP BY DATE_TRUNC('month', i.created_at)
               ORDER BY month DESC
               LIMIT 12"""
        )
        by_category = await conn.fetch(
            """SELECT v.category,
                      COUNT(DISTINCT po.id) as po_count,
                      COALESCE(SUM(q.total_amount), 0) as total_value
               FROM purchase_orders po
               JOIN quotations q ON q.id=po.quotation_id
               JOIN vendors v ON v.id=q.vendor_id
               WHERE po.status != 'cancelled'
               GROUP BY v.category
               ORDER BY total_value DESC"""
        )
    return {
        "monthly_trends": [dict(r) for r in monthly],
        "by_category": [dict(r) for r in by_category],
    }


@router.get("/procurement-stats")
async def procurement_stats(user: dict = Depends(require_roles("admin", "manager", "procurement_officer"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        stats = await conn.fetchrow(
            """SELECT
                 (SELECT COUNT(*) FROM rfqs) as total_rfqs,
                 (SELECT COUNT(*) FROM rfqs WHERE status='open') as open_rfqs,
                 (SELECT COUNT(*) FROM quotations) as total_quotations,
                 (SELECT COUNT(*) FROM quotations WHERE status='accepted') as accepted_quotations,
                 (SELECT COUNT(*) FROM purchase_orders WHERE status='issued') as active_pos,
                 (SELECT COUNT(*) FROM invoices WHERE status='paid') as paid_invoices,
                 (SELECT COALESCE(SUM(total),0) FROM invoices WHERE status='paid') as total_paid_amount,
                 (SELECT COUNT(*) FROM approvals WHERE status='pending') as pending_approvals"""
        )
    return dict(stats)
