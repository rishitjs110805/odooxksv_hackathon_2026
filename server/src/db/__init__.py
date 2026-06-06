import asyncpg
import os
from src.db.schema import SCHEMA_SQL

_pool: asyncpg.Pool | None = None


async def ensure_database():
    conn = await asyncpg.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", 5432)),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD"),
        database="postgres",
    )
    db_name = os.getenv("POSTGRES_DB")
    exists = await conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = $1", db_name
    )
    if not exists:
        await conn.execute(f'CREATE DATABASE "{db_name}"')
        print(f'Database "{db_name}" created')
    await conn.close()


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        await ensure_database()
        _pool = await asyncpg.create_pool(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=int(os.getenv("POSTGRES_PORT", 5432)),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD"),
            database=os.getenv("POSTGRES_DB"),
        )
        async with _pool.acquire() as conn:
            await conn.execute(SCHEMA_SQL)
        print("Connected to PostgreSQL, schema ready")
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
