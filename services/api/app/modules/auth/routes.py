from fastapi import APIRouter

router = APIRouter()


@router.post("/otp/request")
def request_otp(mobile: str) -> dict[str, str]:
    return {"status": "otp_requested", "mobile": mobile}


@router.post("/otp/verify")
def verify_otp(mobile: str, otp: str) -> dict[str, str]:
    return {"status": "verified", "mobile": mobile}

