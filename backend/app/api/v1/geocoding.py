"""
Geocoding endpoints for reverse geocoding
"""
import httpx
from fastapi import APIRouter, HTTPException, Query
from loguru import logger

router = APIRouter()

@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Reverse geocode coordinates to get address
    Tries multiple geocoding services to avoid CORS and reliability issues
    """
    try:
        # List of geocoding services to try
        services = [
            {
                "name": "BigDataCloud",
                "url": f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en",
                "parser": lambda data: parse_bigdatacloud_response(data)
            },
            {
                "name": "Nominatim", 
                "url": f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&addressdetails=1&zoom=18",
                "parser": lambda data: data.get("display_name"),
                "headers": {
                    "User-Agent": "Senso-Backend/1.0.0",
                    "Accept": "application/json"
                }
            }
        ]
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for service in services:
                try:
                    logger.info(f"Trying {service['name']} geocoding service")
                    
                    headers = service.get("headers", {"Accept": "application/json"})
                    response = await client.get(service["url"], headers=headers)
                    
                    if response.status_code == 200:
                        data = response.json()
                        address = service["parser"](data)
                        
                        if address and len(address.strip()) > 0:
                            # Clean up the address format
                            cleaned_address = clean_address_format(address)
                            logger.info(f"{service['name']} succeeded: {cleaned_address}")
                            return {
                                "success": True,
                                "address": cleaned_address,
                                "service": service["name"],
                                "coordinates": {"latitude": lat, "longitude": lon}
                            }
                    
                except Exception as e:
                    logger.warning(f"{service['name']} failed: {str(e)}")
                    continue
        
        # If all services failed
        logger.error("All geocoding services failed")
        return {
            "success": False,
            "error": "All geocoding services unavailable",
            "coordinates": {"latitude": lat, "longitude": lon}
        }
        
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Geocoding service error: {str(e)}"
        )

def clean_address_format(address: str) -> str:
    """Clean up address formatting issues"""
    try:
        # Remove common formatting issues
        cleaned = address.strip()
        
        # Remove "(the)" from country names
        cleaned = cleaned.replace("(the)", "").strip()
        
        # Fix double commas or spaces
        cleaned = ", ".join([part.strip() for part in cleaned.split(",") if part.strip()])
        
        # Fix multiple spaces
        cleaned = " ".join(cleaned.split())
        
        return cleaned
        
    except Exception as e:
        logger.error(f"Error cleaning address format: {e}")
        return address

def parse_bigdatacloud_response(data):
    """Parse BigDataCloud API response"""
    try:
        parts = []
        
        # Build address from available parts
        if data.get("locality"):
            parts.append(data["locality"])
        elif data.get("city"):
            parts.append(data["city"])
            
        if data.get("principalSubdivision"):
            parts.append(data["principalSubdivision"])
            
        if data.get("countryName"):
            parts.append(data["countryName"])
        
        if parts:
            return ", ".join(parts)
            
        # Fallback to any available location info
        if data.get("plus_code"):
            return f"Near {data['plus_code']}"
            
        return None
        
    except Exception as e:
        logger.error(f"Error parsing BigDataCloud response: {e}")
        return None