from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

from fastapi import FastAPI
from src.db import get_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    pool = await get_pool()
    async with pool.acquire() as conn:
        now = await conn.fetchval("SELECT NOW()")
    return {"status": "ok", "time": str(now)}
