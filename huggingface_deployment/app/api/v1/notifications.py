"""
Notifications API endpoints
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.models.schemas import NotificationResponse
from app.core.auth import get_current_user_id
from app.services.notifications import notification_service
from loguru import logger

router = APIRouter()


# Pydantic models for requests
class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: Dict[str, str]  # Contains 'p256dh' and 'auth' keys


class NotificationTrackingRequest(BaseModel):
    notification_id: str
    delivered_at: str = None
    clicked_at: str = None
    dismissed_at: str = None
    action: str = None


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(50, ge=1, le=100, description="Number of notifications to return"),
    offset: int = Query(0, ge=0, description="Number of notifications to skip"),
    unread_only: bool = Query(False, description="Return only unread notifications")
):
    """Get user's notifications"""
    
    try:
        notifications = await notification_service.get_user_notifications(
            user_id=user_id,
            limit=limit,
            offset=offset,
            unread_only=unread_only
        )
        return notifications
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get notifications"
        )


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Mark notification as read"""
    
    try:
        success = await notification_service.mark_notification_read(user_id, notification_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(
    user_id: str = Depends(get_current_user_id)
):
    """Mark all notifications as read"""
    
    try:
        await notification_service.mark_all_notifications_read(user_id)
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all notifications as read"
        )


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a notification"""
    
    try:
        success = await notification_service.delete_notification(user_id, notification_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )


@router.post("/test-reminder", status_code=status.HTTP_201_CREATED)
async def send_test_reminder(
    user_id: str = Depends(get_current_user_id)
):
    """Send a test reading reminder (for testing purposes)"""
    
    try:
        success = await notification_service.send_reading_reminder(user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send reminder"
            )
        
        return {"message": "Test reminder sent successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test reminder: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test reminder"
        )


@router.post("/push-subscription", status_code=status.HTTP_201_CREATED)
async def store_push_subscription(
    subscription: PushSubscriptionRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Store user's push subscription for PWA notifications"""

    try:
        success = await notification_service.store_push_subscription(
            user_id=user_id,
            endpoint=subscription.endpoint,
            p256dh_key=subscription.keys.get("p256dh"),
            auth_key=subscription.keys.get("auth")
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to store push subscription"
            )

        return {"message": "Push subscription stored successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error storing push subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store push subscription"
        )


@router.delete("/push-subscription", status_code=status.HTTP_204_NO_CONTENT)
async def remove_push_subscription(
    user_id: str = Depends(get_current_user_id)
):
    """Remove user's push subscription"""

    try:
        await notification_service.remove_push_subscription(user_id)
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

    except Exception as e:
        logger.error(f"Error removing push subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove push subscription"
        )


@router.post("/track-delivery", status_code=status.HTTP_200_OK)
async def track_notification_delivery(
    tracking_data: NotificationTrackingRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Track notification delivery (called by service worker)"""

    try:
        await notification_service.track_notification_delivery(
            notification_id=tracking_data.notification_id,
            delivered_at=tracking_data.delivered_at
        )
        return {"status": "tracked"}

    except Exception as e:
        logger.warning(f"Error tracking notification delivery: {e}")
        # Don't fail hard for tracking errors
        return {"status": "error", "message": str(e)}


@router.post("/track-click", status_code=status.HTTP_200_OK)
async def track_notification_click(
    tracking_data: NotificationTrackingRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Track notification click (called by service worker)"""

    try:
        await notification_service.track_notification_click(
            notification_id=tracking_data.notification_id,
            clicked_at=tracking_data.clicked_at,
            action=tracking_data.action
        )
        return {"status": "tracked"}

    except Exception as e:
        logger.warning(f"Error tracking notification click: {e}")
        # Don't fail hard for tracking errors
        return {"status": "error", "message": str(e)}


@router.post("/track-dismissal", status_code=status.HTTP_200_OK)
async def track_notification_dismissal(
    tracking_data: NotificationTrackingRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Track notification dismissal (called by service worker)"""

    try:
        await notification_service.track_notification_dismissal(
            notification_id=tracking_data.notification_id,
            dismissed_at=tracking_data.dismissed_at
        )
        return {"status": "tracked"}

    except Exception as e:
        logger.warning(f"Error tracking notification dismissal: {e}")
        # Don't fail hard for tracking errors
        return {"status": "error", "message": str(e)}