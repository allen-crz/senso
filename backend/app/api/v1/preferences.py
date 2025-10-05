"""
User preferences API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.models.schemas import UserPreferencesResponse, UserPreferencesUpdate, UserPreferencesBase
from app.core.auth import get_current_user_id
from app.core.database import get_supabase
from loguru import logger

router = APIRouter()


@router.get("/", response_model=UserPreferencesResponse)
async def get_user_preferences(
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase)
):
    """Get user preferences"""
    
    try:
        result = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
        
        if result.data:
            return UserPreferencesResponse(**result.data[0])
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user preferences"
        )


@router.put("/", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase)
):
    """Update user preferences"""
    
    try:
        # Prepare update data, excluding None values
        update_data = preferences_update.model_dump(exclude_none=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No preferences provided for update"
            )

        # Update preferences directly
        result = supabase.table("user_preferences").update(update_data).eq("user_id", user_id).execute()

        if result.data:
            return UserPreferencesResponse(**result.data[0])
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user preferences"
        )


@router.post("/", response_model=UserPreferencesResponse, status_code=status.HTTP_201_CREATED)
async def create_user_preferences(
    preferences: UserPreferencesBase,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase)
):
    """Create user preferences (if not exists)"""
    
    try:
        # Check if preferences already exist
        existing_result = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
        
        if existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User preferences already exist"
            )
        
        # Create new preferences
        from datetime import datetime
        preferences_data = preferences.model_dump()
        preferences_data["user_id"] = user_id
        preferences_data["created_at"] = datetime.utcnow().isoformat()
        preferences_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("user_preferences").insert(preferences_data).execute()
        
        if result.data:
            return UserPreferencesResponse(**result.data[0])
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user preferences"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user preferences"
        )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def reset_user_preferences(
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase)
):
    """Reset user preferences to defaults"""
    
    try:
        # Create default preferences
        from datetime import datetime
        default_preferences = UserPreferencesBase()
        preferences_data = default_preferences.model_dump()
        preferences_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update with defaults
        result = supabase.table("user_preferences").update(preferences_data).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found"
            )
        
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset user preferences"
        )