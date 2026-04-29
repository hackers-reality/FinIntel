from fastapi import APIRouter

from backend.schemas.compliance import ComplianceBundle
from backend.services.compliance_service import get_compliance_bundle


router = APIRouter(prefix="/system", tags=["compliance"])


@router.get("/compliance", response_model=ComplianceBundle)
def compliance_bundle() -> ComplianceBundle:
    return get_compliance_bundle()
