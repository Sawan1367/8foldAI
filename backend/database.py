import sqlite3
import json
from datetime import datetime
from flask import g, current_app
from config import DB_PATH

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
    return db

def init_db(app):
    with app.app_context():
        db = get_db()
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                company_name TEXT,
                payload TEXT,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )
        db.commit()

def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

def save_account(id, company_name, payload):
    db = get_db()
    now = datetime.utcnow().isoformat()
    payload_json = json.dumps(payload)
    db.execute(
        """
        INSERT INTO accounts (id, company_name, payload, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at
        """,
        (id, company_name, payload_json, now, now),
    )
    db.commit()

def load_account(id):
    db = get_db()
    cur = db.execute("SELECT * FROM accounts WHERE id = ?", (id,))
    row = cur.fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "company_name": row["company_name"],
        "payload": json.loads(row["payload"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
