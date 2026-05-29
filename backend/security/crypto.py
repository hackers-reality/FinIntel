import base64
import hashlib

from Crypto.Cipher import AES

from backend.config.settings import get_settings


def get_encryption_key() -> bytes:
    """Derive a 32-byte AES-256 key from the app secret."""
    secret = get_settings().app_secret.encode("utf-8")
    return hashlib.sha256(secret).digest()


def encrypt(plaintext: str) -> str:
    """Encrypt plaintext using AES-256-GCM. Returns base64-encoded string."""
    key = get_encryption_key()
    cipher = AES.new(key, AES.MODE_GCM)
    ct, tag = cipher.encrypt_and_digest(plaintext.encode("utf-8"))
    return base64.b64encode(cipher.nonce + tag + ct).decode("utf-8")


def decrypt(ciphertext: str) -> str:
    """Decrypt ciphertext using AES-256-GCM. Accepts base64-encoded string."""
    key = get_encryption_key()
    data = base64.b64decode(ciphertext)
    nonce, tag, ct = data[:16], data[16:32], data[32:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ct, tag).decode("utf-8")
