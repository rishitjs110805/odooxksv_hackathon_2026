from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.db import get_pool, close_pool
from src.routes.auth import router as auth_router
from src.routes.vendors import router as vendors_router
from src.routes.rfqs import router as rfqs_router
from src.routes.quotations import router as quotations_router
from src.routes.approvals import router as approvals_router
from src.routes.purchase_orders import router as po_router
from src.routes.invoices import router as invoices_router
from src.routes.dashboard import router as dashboard_router
from src.routes.activity import router as activity_router
from src.routes.reports import router as reports_router
from src.routes.users import router as users_router
from src.routes.notifications import router as notifications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(title="VendorBridge API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(vendors_router)
app.include_router(rfqs_router)
app.include_router(quotations_router)
app.include_router(approvals_router)
app.include_router(po_router)
app.include_router(invoices_router)
app.include_router(dashboard_router)
app.include_router(activity_router)
app.include_router(reports_router)
app.include_router(users_router)
app.include_router(notifications_router)


@app.get("/health")
async def health():
    pool = await get_pool()
    async with pool.acquire() as conn:
        now = await conn.fetchval("SELECT NOW()")
    return {"status": "ok", "time": str(now)}
