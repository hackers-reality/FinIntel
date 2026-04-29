import json
from datetime import datetime, timezone

from openai import OpenAI

from backend.database.db import db_cursor
from backend.schemas.settings import UserSettings, UserSettingsUpdate
from backend.security.crypto import get_fernet


SUPPORTED_PROVIDERS = {
    "openai": {"base_url": None},
    "groq": {"base_url": "https://api.groq.com/openai/v1"},
    "nvidia": {"base_url": "https://integrate.api.nvidia.com/v1"},
    "custom": {"base_url": None},
}


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


def list_provider_settings() -> list[dict[str, str | bool | None]]:
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT provider, encrypted_key, base_url, model, verified_at, verification_status, verification_message
            FROM provider_settings
            ORDER BY provider ASC
            """
        )
        rows = cursor.fetchall()

    providers: list[dict[str, str | bool | None]] = []
    for row in rows:
        providers.append(
            {
                "provider": row["provider"],
                "has_key": bool(row["encrypted_key"]),
                "base_url": row["base_url"],
                "model": row["model"],
                "verified_at": row["verified_at"],
                "verification_status": row["verification_status"],
                "verification_message": row["verification_message"],
            }
        )
    return providers


def upsert_provider_setting(provider: str, api_key: str, base_url: str | None, model: str | None) -> dict[str, str | bool | None]:
    normalized = provider.strip().lower()
    if normalized not in SUPPORTED_PROVIDERS:
        raise ValueError("Unsupported provider.")

    encrypted_key = get_fernet().encrypt(api_key.encode("utf-8")).decode("utf-8")
    with db_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO provider_settings (provider, encrypted_key, base_url, model, verified_at, verification_status, verification_message)
            VALUES (?, ?, ?, ?, NULL, NULL, NULL)
            ON CONFLICT(provider) DO UPDATE SET
                encrypted_key = excluded.encrypted_key,
                base_url = excluded.base_url,
                model = excluded.model,
                verified_at = NULL,
                verification_status = NULL,
                verification_message = NULL
            """,
            (normalized, encrypted_key, base_url, model),
        )
    return {
        "provider": normalized,
        "has_key": True,
        "base_url": base_url,
        "model": model,
        "verified_at": None,
        "verification_status": None,
        "verification_message": None,
    }


def verify_provider_setting(provider: str) -> dict[str, str | bool | None]:
    normalized = provider.strip().lower()
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT provider, encrypted_key, base_url, model
            FROM provider_settings
            WHERE provider = ?
            """,
            (normalized,),
        )
        row = cursor.fetchone()

    if row is None:
        raise ValueError("Provider key is not configured.")

    decrypted_key = get_fernet().decrypt(row["encrypted_key"].encode("utf-8")).decode("utf-8")
    provider_defaults = SUPPORTED_PROVIDERS.get(normalized, {})
    base_url = row["base_url"] or provider_defaults.get("base_url")
    model = row["model"] or "gpt-4.1-mini"

    try:
        client = OpenAI(api_key=decrypted_key, base_url=base_url)
        models = client.models.list()
        model_count = len(getattr(models, "data", []) or [])
        verified_at = datetime.now(timezone.utc).isoformat()
        status = "verified"
        message = f"Provider key validated successfully. {model_count} models were reachable."
    except Exception as exc:
        verified_at = None
        status = "failed"
        message = f"Verification failed: {exc}"

    with db_cursor() as cursor:
        cursor.execute(
            """
            UPDATE provider_settings
            SET verified_at = ?, verification_status = ?, verification_message = ?
            WHERE provider = ?
            """,
            (verified_at, status, message, normalized),
        )

    return {
        "provider": normalized,
        "has_key": True,
        "base_url": base_url,
        "model": model,
        "verified_at": verified_at,
        "verification_status": status,
        "verification_message": message,
    }
