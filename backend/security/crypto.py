import base64
import hashlib

from cryptography.fernet import Fernet

from backend.config.settings import get_settings


def get_fernet() -> Fernet:
    secret = get_settings().app_secret.encode("utf-8")
    digest = hashlib.sha256(secret).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)
