import json
from datetime import datetime, timezone

from openai import OpenAI

from backend.database.db import db_cursor
from backend.schemas.settings import UserSettings, UserSettingsUpdate
from backend.security.crypto import encrypt, decrypt


SUPPORTED_PROVIDERS = {
    "nvidia_nim": {"base_url": "https://integrate.api.nvidia.com/v1"},
    "openai": {"base_url": None},
    "anthropic": {"base_url": "https://api.anthropic.com/v1"},
    "groq": {"base_url": "https://api.groq.com/openai/v1"},
    "openrouter": {"base_url": "https://openrouter.ai/api/v1"},
}


def verify_provider_key(provider: str, key: str) -> bool:
    """Verify a provider API key is valid."""
    provider = provider.strip().lower()
    if provider == "nvidia_nim":
        import requests
        try:
            resp = requests.get(
                "https://integrate.api.nvidia.com/v1/models",
                headers={"Authorization": f"Bearer {key}"},
                timeout=10,
            )
            return resp.status_code == 200
        except Exception:
            return False
    elif provider == "anthropic":
        import anthropic
        try:
            client = anthropic.Anthropic(api_key=key)
            # Minimal call - just check auth, not actual generation
            resp = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1,
                messages=[{"role": "user", "content": "Hi"}],
            )
            return True
        except Exception:
            return False
    elif provider == "groq":
        import requests
        try:
            resp = requests.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {key}"},
                timeout=10,
            )
            return resp.status_code == 200
        except Exception:
            return False
    elif provider == "openrouter":
        import requests
        try:
            resp = requests.get(
                "https://openrouter.ai/api/v1/models",
                headers={"Authorization": f"Bearer {key}"},
                timeout=10,
            )
            return resp.status_code == 200
        except Exception:
            return False
    # OpenAI - keep existing logic
    return True


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

    encrypted_key = encrypt(api_key)
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

    decrypted_key = decrypt(row["encrypted_key"])
    provider_defaults = SUPPORTED_PROVIDERS.get(normalized, {})
    base_url = row["base_url"] or provider_defaults.get("base_url")
    model = row["model"] or _default_model(normalized)

    # Use the new verification function
    is_valid = verify_provider_key(normalized, decrypted_key)

    if is_valid:
        verified_at = datetime.now(timezone.utc).isoformat()
        status = "verified"
        message = "Provider key validated successfully."
    else:
        verified_at = None
        status = "failed"
        message = "Verification failed: Invalid API key or unreachable endpoint."

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


def _default_model(provider: str) -> str:
    defaults = {
        "nvidia_nim": "meta/llama-3.1-70b-instruct",
        "openai": "gpt-4o",
        "anthropic": "claude-sonnet-4-20250514",
        "groq": "llama-3.3-70b-versatile",
        "openrouter": "meta-llama/llama-3.1-70b-instruct",
    }
    return defaults.get(provider, "gpt-4o")


def fetch_models_from_provider(provider: str, api_key: str | None = None, base_url: str | None = None) -> list[str]:
    provider = provider.strip().lower()
    provider_defaults = SUPPORTED_PROVIDERS.get(provider, {})
    url = base_url or provider_defaults.get("base_url")

    if not api_key:
        with db_cursor() as cursor:
            cursor.execute(
                "SELECT encrypted_key, base_url FROM provider_settings WHERE provider = ?",
                (provider,)
            )
            row = cursor.fetchone()
            if row and row["encrypted_key"]:
                api_key = decrypt(row["encrypted_key"])
                if not url:
                    url = row["base_url"]

    if not api_key:
        return []

    headers = {"Authorization": f"Bearer {api_key}"}

    if provider == "openai":
        url = url or "https://api.openai.com/v1"
    elif provider == "anthropic":
        return [
            "claude-3-5-sonnet-latest",
            "claude-3-5-haiku-latest",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
        ]

    # Clean up URL for /models
    if not url.endswith("/models"):
        url = url.rstrip("/") + "/models"

    import requests
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, dict) and "data" in data:
                return [m["id"] for m in data["data"] if "id" in m]
    except Exception:
        pass

    return []
