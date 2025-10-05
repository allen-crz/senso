"""
Notification service for sending alerts and reminders
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json

from app.core.config import settings
from app.core.database import get_supabase
from app.models.schemas import (
    NotificationCreate, 
    NotificationResponse, 
    NotificationMethod, 
    UtilityType,
    AnomalySeverity
)
from loguru import logger


class NotificationService:
    """Service for managing notifications and alerts"""
    
    def __init__(self):
        self.supabase = None
        
    async def init_supabase(self):
        """Initialize Supabase client"""
        if not self.supabase:
            from app.core.database import get_supabase
            self.supabase = await get_supabase()
    
    async def create_notification(
        self, 
        user_id: str, 
        notification: NotificationCreate
    ) -> Optional[NotificationResponse]:
        """Create and queue a notification"""
        
        await self.init_supabase()
        
        try:
            notification_data = {
                "user_id": user_id,
                "type": notification.type,
                "title": notification.title,
                "message": notification.message,
                "data": notification.data or {},
                "delivery_method": notification.delivery_method.value,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("notifications").insert(notification_data).execute()
            
            if result.data:
                notification_response = NotificationResponse(**result.data[0])
                
                # Send immediately if enabled
                if settings.ENABLE_NOTIFICATIONS:
                    await self._send_notification(notification_response)
                
                return notification_response
            else:
                raise Exception("Failed to create notification")
                
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
            return None
    
    async def send_anomaly_alert(
        self, 
        user_id: str, 
        reading_id: str, 
        utility_type: UtilityType,
        severity: AnomalySeverity,
        anomaly_score: float,
        contributing_factors: Dict[str, Any]
    ) -> bool:
        """Send anomaly detection alert"""
        
        try:
            # Check user preferences
            preferences = await self._get_user_preferences(user_id)
            
            if not preferences.get("anomaly_notifications_enabled", True):
                logger.info(f"Anomaly notifications disabled for user {user_id}")
                return False
            
            # Get user's preferred notification methods
            notification_methods = preferences.get("anomaly_notification_methods", ["push", "email"])
            
            # Create notification content based on severity
            title, message = self._create_anomaly_message(utility_type, severity, anomaly_score, contributing_factors)
            
            # Send notification via each preferred method
            success = True
            for method in notification_methods:
                try:
                    notification = NotificationCreate(
                        type="anomaly_alert",
                        title=title,
                        message=message,
                        data={
                            "reading_id": reading_id,
                            "utility_type": utility_type.value,
                            "severity": severity.value,
                            "anomaly_score": anomaly_score,
                            "contributing_factors": contributing_factors
                        },
                        delivery_method=NotificationMethod(method)
                    )
                    
                    result = await self.create_notification(user_id, notification)
                    if not result:
                        success = False
                        
                except Exception as e:
                    logger.error(f"Failed to send anomaly alert via {method}: {e}")
                    success = False
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to send anomaly alert: {e}")
            return False
    
    async def send_forecast_notification(
        self, 
        user_id: str, 
        utility_type: UtilityType,
        predicted_cost: float,
        forecast_month: str,
        confidence_lower: float,
        confidence_upper: float
    ) -> bool:
        """Send cost forecast notification"""
        
        try:
            # Check user preferences
            preferences = await self._get_user_preferences(user_id)
            
            if not preferences.get("forecast_notifications_enabled", True):
                logger.info(f"Forecast notifications disabled for user {user_id}")
                return False
            
            # Create forecast message
            title = f"Monthly {utility_type.value.title()} Cost Forecast"
            message = f"Your predicted {utility_type.value} bill for {forecast_month} is ₱{predicted_cost:.2f}. "
            message += f"Expected range: ₱{confidence_lower:.2f} - ₱{confidence_upper:.2f}"
            
            notification = NotificationCreate(
                type="forecast_ready",
                title=title,
                message=message,
                data={
                    "utility_type": utility_type.value,
                    "predicted_cost": predicted_cost,
                    "forecast_month": forecast_month,
                    "confidence_lower": confidence_lower,
                    "confidence_upper": confidence_upper
                },
                delivery_method=NotificationMethod.PUSH  # Default to push
            )
            
            result = await self.create_notification(user_id, notification)
            return result is not None
            
        except Exception as e:
            logger.error(f"Failed to send forecast notification: {e}")
            return False
    
    async def send_reading_reminder(self, user_id: str) -> bool:
        """Send reminder to take meter reading"""
        
        try:
            # Check user preferences
            preferences = await self._get_user_preferences(user_id)
            
            if not preferences.get("reading_reminder_enabled", True):
                return False
            
            title = "Time to Take Your Meter Reading"
            message = "Don't forget to capture your daily utility meter readings to keep your monitoring accurate!"
            
            notification = NotificationCreate(
                type="reading_reminder",
                title=title,
                message=message,
                data={},
                delivery_method=NotificationMethod.PUSH
            )
            
            result = await self.create_notification(user_id, notification)
            return result is not None
            
        except Exception as e:
            logger.error(f"Failed to send reading reminder: {e}")
            return False
    
    async def _send_notification(self, notification: NotificationResponse) -> bool:
        """Send notification via appropriate delivery method"""
        
        try:
            success = False
            
            if notification.delivery_method == NotificationMethod.EMAIL:
                success = await self._send_email_notification(notification)
            elif notification.delivery_method == NotificationMethod.PUSH:
                success = await self._send_push_notification(notification)
            elif notification.delivery_method == NotificationMethod.IN_APP:
                success = True  # In-app notifications are just stored in DB
            
            # Update notification status
            await self._update_notification_status(
                notification.id, 
                "sent" if success else "failed",
                sent_at=datetime.utcnow() if success else None
            )
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to send notification {notification.id}: {e}")
            await self._update_notification_status(notification.id, "failed", error_message=str(e))
            return False
    
    async def _send_email_notification(self, notification: NotificationResponse) -> bool:
        """Send email notification"""
        
        if not settings.EMAIL_ENABLED or not settings.SMTP_HOST:
            logger.info("Email notifications not configured")
            return False
        
        try:
            # Get user email
            user_result = self.supabase.auth.admin.get_user_by_id(notification.user_id)
            if not user_result.user or not user_result.user.email:
                logger.error(f"User email not found for user {notification.user_id}")
                return False
            
            user_email = user_result.user.email
            
            # Create email
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = user_email
            msg['Subject'] = notification.title
            
            # Create HTML body
            html_body = f"""
            <html>
                <body>
                    <h2>{notification.title}</h2>
                    <p>{notification.message}</p>
                    <hr>
                    <p><small>This is an automated message from Senso Utility Monitoring.</small></p>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            if settings.SMTP_TLS:
                server.starttls()
            
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email notification sent to {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return False
    
    async def _send_push_notification(self, notification: NotificationResponse) -> bool:
        """Send PWA push notification"""

        try:
            # Get user's push subscriptions
            subscriptions = await self._get_user_push_subscriptions(notification.user_id)

            if not subscriptions:
                logger.info(f"No push subscriptions found for user {notification.user_id}")
                return False

            # Send to all user's subscriptions
            success_count = 0
            for subscription in subscriptions:
                try:
                    success = await self._send_web_push(subscription, notification)
                    if success:
                        success_count += 1
                except Exception as e:
                    logger.error(f"Failed to send to subscription {subscription.get('id')}: {e}")

            # Consider successful if at least one delivery succeeded
            overall_success = success_count > 0

            if overall_success:
                logger.info(f"Push notification sent to {success_count}/{len(subscriptions)} subscriptions: {notification.title}")

            return overall_success

        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
            return False

    async def _send_web_push(self, subscription_data: Dict[str, Any], notification: NotificationResponse) -> bool:
        """Send web push notification using Web Push Protocol"""

        try:
            # Import web push library (install with: pip install pywebpush)
            from pywebpush import webpush, WebPushException

            # Create push payload
            payload = {
                "title": notification.title,
                "body": notification.message,
                "icon": "/icons/senso-icon-192x192.png",
                "badge": "/icons/senso-icon-96x96.png",
                "tag": f"senso-{notification.type}",
                "data": {
                    "notificationId": notification.id,
                    "type": notification.type,
                    "url": "/",
                    **notification.data
                },
                "actions": []
            }

            # Add type-specific actions
            if notification.type == "anomaly_alert":
                payload["actions"] = [
                    {"action": "view", "title": "View Details"},
                    {"action": "dismiss", "title": "Dismiss"}
                ]
                payload["requireInteraction"] = True
            elif notification.type == "reading_reminder":
                payload["actions"] = [
                    {"action": "take_reading", "title": "Take Reading"},
                    {"action": "remind_later", "title": "Remind Later"}
                ]

            # Send web push
            response = webpush(
                subscription_info={
                    "endpoint": subscription_data["endpoint"],
                    "keys": subscription_data["keys"]
                },
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": "mailto:support@senso-app.com"
                }
            )

            # Update delivery timestamp
            await self._update_subscription_last_used(subscription_data["id"])

            return True

        except WebPushException as e:
            if e.response.status_code == 410:
                # Subscription is no longer valid, remove it
                await self._remove_invalid_subscription(subscription_data["id"])
                logger.info(f"Removed invalid push subscription {subscription_data['id']}")
            else:
                logger.error(f"Web push failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to send web push: {e}")
            return False
    
    async def _get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user notification preferences"""
        
        try:
            result = self.supabase.table("user_preferences").select("*").eq("user_id", user_id).single().execute()
            
            if result.data:
                return result.data
            else:
                # Return default preferences
                return {
                    "anomaly_notifications_enabled": True,
                    "anomaly_notification_methods": ["push", "email"],
                    "forecast_notifications_enabled": True,
                    "reading_reminder_enabled": True
                }
                
        except Exception as e:
            logger.error(f"Failed to get user preferences: {e}")
            return {}
    
    def _create_anomaly_message(
        self, 
        utility_type: UtilityType, 
        severity: AnomalySeverity,
        anomaly_score: float,
        contributing_factors: Dict[str, Any]
    ) -> tuple:
        """Create anomaly alert message based on severity and factors"""
        
        utility_name = utility_type.value.title()
        
        # Create title based on severity
        severity_titles = {
            AnomalySeverity.LOW: f"Unusual {utility_name} Reading Detected",
            AnomalySeverity.MEDIUM: f"Moderate {utility_name} Anomaly Alert",
            AnomalySeverity.HIGH: f"High {utility_name} Anomaly Alert",
            AnomalySeverity.CRITICAL: f"Critical {utility_name} Anomaly Alert"
        }
        
        title = severity_titles.get(severity, f"{utility_name} Anomaly Detected")
        
        # Create message with insights
        message = f"An anomalous {utility_name.lower()} reading has been detected with a {severity.value} severity level. "
        message += f"Anomaly score: {anomaly_score:.3f}."
        
        # Add insights if available
        insights = contributing_factors.get("insights", [])
        if insights:
            message += "\n\nPossible reasons:"
            for insight in insights[:3]:  # Limit to top 3 insights
                message += f"\n• {insight}"
        
        # Add recommendation
        if severity in [AnomalySeverity.HIGH, AnomalySeverity.CRITICAL]:
            message += "\n\nWe recommend checking your meter and recent usage patterns."
        
        return title, message
    
    async def _update_notification_status(
        self, 
        notification_id: str, 
        status: str,
        sent_at: Optional[datetime] = None,
        delivered_at: Optional[datetime] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """Update notification delivery status"""
        
        try:
            update_data = {"status": status}
            
            if sent_at:
                update_data["sent_at"] = sent_at.isoformat()
            
            if delivered_at:
                update_data["delivered_at"] = delivered_at.isoformat()
            
            if error_message:
                update_data["error_message"] = error_message
            
            result = self.supabase.table("notifications").update(update_data).eq("id", notification_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Failed to update notification status: {e}")
            return False
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False
    ) -> List[NotificationResponse]:
        """Get user's notifications"""
        
        await self.init_supabase()
        
        try:
            query = self.supabase.table("notifications").select("*").eq("user_id", user_id)
            
            if unread_only:
                query = query.is_("read_at", "null")
            
            result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            
            return [NotificationResponse(**notification) for notification in result.data]
            
        except Exception as e:
            logger.error(f"Failed to get user notifications: {e}")
            return []
    
    async def mark_notification_read(self, user_id: str, notification_id: str) -> bool:
        """Mark notification as read"""
        
        await self.init_supabase()
        
        try:
            result = self.supabase.table("notifications").update({
                "read_at": datetime.utcnow().isoformat()
            }).eq("id", notification_id).eq("user_id", user_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Failed to mark notification as read: {e}")
            return False
    
    async def mark_all_notifications_read(self, user_id: str) -> bool:
        """Mark all user notifications as read"""
        
        await self.init_supabase()
        
        try:
            result = self.supabase.table("notifications").update({
                "read_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).is_("read_at", "null").execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to mark all notifications as read: {e}")
            return False
    
    async def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a notification"""
        
        await self.init_supabase()
        
        try:
            result = self.supabase.table("notifications").delete().eq("id", notification_id).eq("user_id", user_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Failed to delete notification: {e}")
            return False
    
    async def process_pending_notifications(self) -> int:
        """Process all pending notifications (for background task)"""
        
        await self.init_supabase()
        
        try:
            # Get pending notifications
            result = self.supabase.table("notifications").select("*").eq("status", "pending").order("created_at").limit(100).execute()
            
            processed = 0
            
            for notification_data in result.data:
                try:
                    notification = NotificationResponse(**notification_data)
                    success = await self._send_notification(notification)
                    if success:
                        processed += 1
                except Exception as e:
                    logger.error(f"Failed to process notification {notification_data.get('id')}: {e}")
            
            logger.info(f"Processed {processed} pending notifications")
            return processed

        except Exception as e:
            logger.error(f"Failed to process pending notifications: {e}")
            return 0

    async def store_push_subscription(
        self,
        user_id: str,
        endpoint: str,
        p256dh_key: str,
        auth_key: str
    ) -> bool:
        """Store PWA push subscription for user"""

        await self.init_supabase()

        try:
            keys_data = {
                "p256dh": p256dh_key,
                "auth": auth_key
            }

            # First check if subscription already exists
            existing = self.supabase.table("push_subscriptions").select("id").eq(
                "user_id", user_id
            ).eq("endpoint", endpoint).execute()

            if existing.data:
                # Update existing subscription
                result = self.supabase.table("push_subscriptions").update({
                    "keys": keys_data,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("user_id", user_id).eq("endpoint", endpoint).execute()
            else:
                # Create new subscription
                result = self.supabase.table("push_subscriptions").insert({
                    "user_id": user_id,
                    "endpoint": endpoint,
                    "keys": keys_data,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                    "is_active": True
                }).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to store push subscription: {e}")
            return False

    async def remove_push_subscription(self, user_id: str, endpoint: Optional[str] = None) -> bool:
        """Remove PWA push subscription(s) for user"""

        await self.init_supabase()

        try:
            query = self.supabase.table("push_subscriptions").delete().eq("user_id", user_id)

            if endpoint:
                # Remove specific subscription
                query = query.eq("endpoint", endpoint)

            result = query.execute()
            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to remove push subscription: {e}")
            return False

    async def _get_user_push_subscriptions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active push subscriptions for user"""

        try:
            result = self.supabase.table("push_subscriptions").select("*").eq(
                "user_id", user_id
            ).eq("is_active", True).execute()

            return result.data or []

        except Exception as e:
            logger.error(f"Failed to get push subscriptions: {e}")
            return []

    async def _update_subscription_last_used(self, subscription_id: str) -> bool:
        """Update last used timestamp for subscription"""

        try:
            result = self.supabase.table("push_subscriptions").update({
                "last_used_at": datetime.utcnow().isoformat()
            }).eq("id", subscription_id).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to update subscription timestamp: {e}")
            return False

    async def _remove_invalid_subscription(self, subscription_id: str) -> bool:
        """Mark subscription as inactive when it's no longer valid"""

        try:
            result = self.supabase.table("push_subscriptions").update({
                "is_active": False,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", subscription_id).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to mark subscription as inactive: {e}")
            return False

    async def send_test_notification(self, user_id: str) -> Optional[NotificationResponse]:
        """Send a test push notification for debugging"""

        try:
            notification = NotificationCreate(
                type="test",
                title="Test Notification",
                message="This is a test push notification from Senso! 🔔",
                data={"test": True},
                delivery_method=NotificationMethod.PUSH
            )

            return await self.create_notification(user_id, notification)

        except Exception as e:
            logger.error(f"Failed to send test notification: {e}")
            return None

    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for user"""

        await self.init_supabase()

        try:
            result = self.supabase.table("notifications").select(
                "id", count="exact"
            ).eq("user_id", user_id).is_("read_at", "null").execute()

            return result.count or 0

        except Exception as e:
            logger.error(f"Failed to get unread count: {e}")
            return 0

    async def track_notification_delivery(self, notification_id: str, delivered_at: str) -> bool:
        """Track notification delivery from service worker"""

        await self.init_supabase()

        try:
            result = self.supabase.table("notifications").update({
                "delivered_at": delivered_at,
                "status": "delivered"
            }).eq("id", notification_id).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to track notification delivery: {e}")
            return False

    async def track_notification_click(
        self,
        notification_id: str,
        clicked_at: str,
        action: Optional[str] = None
    ) -> bool:
        """Track notification click from service worker"""

        await self.init_supabase()

        try:
            update_data = {
                "clicked_at": clicked_at,
                "status": "clicked"
            }

            if action:
                # Store action in data field if it exists
                notification = self.supabase.table("notifications").select("data").eq("id", notification_id).single().execute()

                if notification.data:
                    existing_data = notification.data.get("data") or {}
                    existing_data["last_action"] = action
                    update_data["data"] = existing_data

            result = self.supabase.table("notifications").update(update_data).eq("id", notification_id).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to track notification click: {e}")
            return False

    async def track_notification_dismissal(self, notification_id: str, dismissed_at: str) -> bool:
        """Track notification dismissal from service worker"""

        await self.init_supabase()

        try:
            result = self.supabase.table("notifications").update({
                "status": "dismissed"
                # Note: We don't have a dismissed_at field in schema, using status only
            }).eq("id", notification_id).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to track notification dismissal: {e}")
            return False


# Global service instance
notification_service = NotificationService()