import json


async def log_activity(conn, user_id: int, action: str, entity_type: str, entity_id: int, details: dict = None):
    await conn.execute(
        "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
        user_id, action, entity_type, entity_id, json.dumps(details) if details else None
    )
