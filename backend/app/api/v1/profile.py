"""
Simple profile creation endpoint - fresh implementation
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.core.auth import get_current_user

router = APIRouter()


class ProfileCreate(BaseModel):
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None


class ProfileResponse(BaseModel):
    success: bool
    message: str
    profile: dict


@router.post("/create", response_model=ProfileResponse)
async def create_profile(
    profile_data: ProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create user profile - simple implementation"""
    
    # For now, just return success to get the flow working
    # We'll implement database storage later
    
    profile = {
        "user_id": current_user["id"],
        "full_name": profile_data.full_name,
        "phone": profile_data.phone,
        "address": profile_data.address,
        "created_at": datetime.utcnow().isoformat()
    }
    
    return ProfileResponse(
        success=True,
        message="Profile created successfully!",
        profile=profile
    )


@router.get("/status")
async def get_profile_status(
    current_user: dict = Depends(get_current_user)
):
    """Check if user has a profile"""
    
    # For now, always return no profile to force creation flow
    return {
        "has_profile": False,
        "user_id": current_user["id"]
    }