import json
import secrets

import pyotp


def generate_mfa_secret() -> str:
    return pyotp.random_base32()


def generate_mfa_uri(secret: str, email: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="FinIntel")


def verify_mfa_token(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)


def generate_backup_codes(count: int = 5) -> list[str]:
    return [secrets.token_hex(4) for _ in range(count)]
