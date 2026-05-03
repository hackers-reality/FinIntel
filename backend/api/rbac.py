from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.auth import get_current_user_from_header
from backend.database.db import get_db
from backend.models.user import User


def require_role(*allowed_roles: str):
    def _check_role(
        user: User = Depends(get_current_user_from_header),
        db: Session = Depends(get_db),
    ) -> User:
        if user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role.value}' is not authorized. Required: {', '.join(allowed_roles)}.",
            )
        return user
    return _check_role
