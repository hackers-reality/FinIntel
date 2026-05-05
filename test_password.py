from backend.security.password import hash_password, verify_password

h = hash_password("securepass123")
print(f"Hash length: {len(h)}")
print(f"Verify correct: {verify_password('securepass123', h)}")
print(f"Verify wrong: {verify_password('wrongpass', h)}")
