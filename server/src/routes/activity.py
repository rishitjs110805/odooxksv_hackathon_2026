from fastapi import APIRouter, Depends, Query
from typing import Optional
from src.db import get_pool
from src.middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("")
async def get_activity_logs(
    entity_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    user: dict = Depends(require_roles("admin", "manager", "procurement_officer"))
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        filters, params, idx = [], [], 1
        if entity_type:
            filters.append(f"al.entity_type = ${idx}")
            params.append(entity_type); idx += 1
        where = ("WHERE " + " AND ".join(filters)) if filters else ""
        params.extend([limit, offset])
        rows = await conn.fetch(
            f"""SELECT al.*, u.name as user_name, u.email as user_email
                FROM activity_logs al
                LEFT JOIN users u ON u.id=al.user_id
                {where}
                ORDER BY al.created_at DESC
                LIMIT ${idx} OFFSET ${idx+1}""",
            *params
        )
        total = await conn.fetchval(f"SELECT COUNT(*) FROM activity_logs al {where}", *params[:-2])
    return {"total": total, "items": [dict(r) for r in rows]}
