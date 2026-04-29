import json

from backend.database.db import db_cursor
from backend.schemas.settings import UserSettings, UserSettingsUpdate


DEFAULT_SETTINGS = UserSettings()


def get_user_settings() -> UserSettings:
    with db_cursor() as cursor:
        cursor.execute("SELECT key, value FROM user_settings")
        rows = cursor.fetchall()

    data = DEFAULT_SETTINGS.model_dump()
    for row in rows:
        data[row["key"]] = json.loads(row["value"])
    return UserSettings(**data)


def update_user_settings(payload: UserSettingsUpdate) -> UserSettings:
    current = get_user_settings().model_dump()
    updates = payload.model_dump(exclude_none=True)
    current.update(updates)

    with db_cursor() as cursor:
        for key, value in updates.items():
            cursor.execute(
                """
                INSERT INTO user_settings (key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, json.dumps(value)),
            )

    return UserSettings(**current)
