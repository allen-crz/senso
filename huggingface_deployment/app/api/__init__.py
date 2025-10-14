"""
API router initialization - V1 only
"""
from fastapi import APIRouter
from app.api.v1 import api_v1_router

api_router = APIRouter()

# Include only v1 API router
api_router.include_router(api_v1_router)