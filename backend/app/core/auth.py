"""
Authentication utilities and middleware for Supabase integration
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from supabase import Client

from app.core.config import settings
from app.core.database import get_supabase
from app.models.schemas import UserResponse, Token
from loguru import logger

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service for Supabase integration"""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
    
    async def init_supabase(self):
        """Initialize Supabase client"""
        if not self.supabase:
            self.supabase = await get_supabase()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        return pwd_context.hash(password)
    
    
    async def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user from Supabase using JWT token"""
        await self.init_supabase()

        try:
            # Use JWT secret if available, otherwise anon key
            jwt_secret = settings.SUPABASE_JWT_SECRET or settings.SUPABASE_ANON_KEY

            # Decode and verify the JWT token
            from jose import jwt, JWTError
            from dateutil import parser
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False}  # Supabase doesn't always set aud
            )

            # Extract user info from JWT payload
            if payload and payload.get("sub"):
                # Parse datetime strings to datetime objects
                created_at = payload.get("created_at")
                if created_at and isinstance(created_at, str):
                    created_at = parser.parse(created_at)

                last_sign_in_at = payload.get("last_sign_in_at")
                if last_sign_in_at and isinstance(last_sign_in_at, str):
                    last_sign_in_at = parser.parse(last_sign_in_at)

                return {
                    "id": payload.get("sub"),
                    "email": payload.get("email"),
                    "created_at": created_at,
                    "last_sign_in_at": last_sign_in_at,
                    "role": payload.get("role", "authenticated")
                }
        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
        except Exception as e:
            logger.error(f"Failed to get user from token: {e}")

        return None
    
    async def sign_up(self, email: str, password: str) -> Dict[str, Any]:
        """Register new user with Supabase"""
        await self.init_supabase()
        
        try:
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            
            if response.user:
                return {
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "created_at": response.user.created_at
                    },
                    "session": response.session
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Registration failed"
                )
                
        except Exception as e:
            logger.error(f"Sign up failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {str(e)}"
            )
    
    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in user with Supabase"""
        await self.init_supabase()
        
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user and response.session:
                return {
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "created_at": response.user.created_at,
                        "last_sign_in_at": response.user.last_sign_in_at
                    },
                    "session": response.session,
                    "access_token": response.session.access_token,
                    "expires_in": response.session.expires_in
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
        except Exception as e:
            logger.error(f"Sign in failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
    
    async def sign_out(self, token: str) -> bool:
        """Sign out user"""
        await self.init_supabase()
        
        try:
            self.supabase.auth.sign_out()
            return True
        except Exception as e:
            logger.error(f"Sign out failed: {e}")
            return False
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        await self.init_supabase()
        
        try:
            response = self.supabase.auth.refresh_session(refresh_token)
            
            if response.session:
                return {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_in": response.session.expires_in
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token"
                )
                
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token refresh failed"
            )
    
    async def change_password(self, user_id: str, new_password: str) -> bool:
        """Change user password"""
        await self.init_supabase()
        
        try:
            # Use user update method instead of admin method
            response = self.supabase.auth.update_user({
                "password": new_password
            })
            
            return response.user is not None
                
        except Exception as e:
            logger.error(f"Change password failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to change password"
            )


# Global auth service instance
auth_service = AuthService()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    user = await auth_service.get_user_from_token(token)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_user_id(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """Dependency to get current user ID"""
    return current_user["id"]