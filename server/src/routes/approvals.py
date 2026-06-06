from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from src.db import get_pool
from src.middleware.auth import get_current_user, require_roles
from src.controller.activity import log_activity

router = APIRouter(prefix="/approvals", tags=["approvals"])


class ApprovalBody(BaseModel):
    quotation_id: int


class ApprovalActionBody(BaseModel):
    status: str
    remarks: Optional[str] = None


@router.post("")
async def create_approval(body: ApprovalBody, user: dict = Depends(require_roles("admin", "procurement_officer"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        q = await conn.fetchrow("SELECT * FROM quotations WHERE id=$1", body.quotation_id)
        if not q:
            raise HTTPException(404, "Quotation not found")
        existing = await conn.fetchrow("SELECT id FROM approvals WHERE quotation_id=$1", body.quotation_id)
        if existing:
            raise HTTPException(400, "Approval already initiated for this quotation")
        row = await conn.fetchrow(
            "INSERT INTO approvals (quotation_id, approver_id, status) VALUES ($1, NULL, 'pending') RETURNING *",
            body.quotation_id
        )
        await log_activity(conn, int(user["sub"]), "approval_initiated", "approval", row["id"], {"quotation_id": body.quotation_id})
    return dict(row)


@router.get("")
async def list_approvals(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT a.*, q.rfq_id, q.total_amount, q.vendor_id, v.name as vendor_name
               FROM approvals a
               JOIN quotations q ON q.id=a.quotation_id
               JOIN vendors v ON v.id=q.vendor_id
               ORDER BY a.created_at DESC"""
        )
    return [dict(r) for r in rows]


@router.get("/pending")
async def list_pending_approvals(user: dict = Depends(require_roles("admin", "manager"))):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT a.*, q.rfq_id, q.total_amount, q.vendor_id, v.name as vendor_name,
                      r.title as rfq_title
               FROM approvals a
               JOIN quotations q ON q.id=a.quotation_id
               JOIN vendors v ON v.id=q.vendor_id
               JOIN rfqs r ON r.id=q.rfq_id
               WHERE a.status='pending'
               ORDER BY a.created_at DESC"""
        )
    return [dict(r) for r in rows]


@router.patch("/{approval_id}/action")
async def process_approval(
    approval_id: int,
    body: ApprovalActionBody,
    user: dict = Depends(require_roles("admin", "manager"))
):
    if body.status not in ("approved", "rejected"):
        raise HTTPException(400, "Status must be 'approved' or 'rejected'")
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """UPDATE approvals SET status=$1, remarks=$2, approver_id=$3, updated_at=NOW()
                   WHERE id=$4 RETURNING *""",
                body.status, body.remarks, int(user["sub"]), approval_id
            )
            if not row:
                raise HTTPException(404, "Approval not found")
            # update quotation status accordingly
            q_status = "accepted" if body.status == "approved" else "rejected"
            await conn.execute("UPDATE quotations SET status=$1 WHERE id=$2", q_status, row["quotation_id"])
            await log_activity(conn, int(user["sub"]), f"approval_{body.status}", "approval", approval_id, {"remarks": body.remarks})
    return dict(row)
