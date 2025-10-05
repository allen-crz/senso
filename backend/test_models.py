#!/usr/bin/env python3
"""
Test script for YOLO models - extract readings from local images
No database storage, just model testing and reading extraction
"""

import os
import sys
import asyncio
import base64
from pathlib import Path
from typing import List, Dict, Any

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.image_processing import ImageProcessingService
from app.models.schemas import UtilityType


def encode_image_to_base64(image_path: str) -> str:
    """Convert local image file to base64 string"""
    try:
        with open(image_path, 'rb') as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded_string
    except Exception as e:
        print(f"Error encoding image {image_path}: {e}")
        return None


async def test_model(service: ImageProcessingService, image_path: str, utility_type: UtilityType) -> Dict[str, Any]:
    """Test a single image with the specified model"""
    print(f"\nTesting {utility_type.value} model with: {os.path.basename(image_path)}")

    # Encode image
    base64_image = encode_image_to_base64(image_path)
    if not base64_image:
        return {"error": "Failed to encode image"}

    try:
        # Process image
        result = await service.process_image(base64_image, utility_type)

        # Debug info
        raw_data = result.raw_ocr_data if hasattr(result, 'raw_ocr_data') else {}

        return {
            "file": os.path.basename(image_path),
            "utility_type": utility_type.value,
            "reading": result.reading_value,
            "confidence": float(result.confidence_score) if result.confidence_score else 0.0,
            "status": result.processing_status.value,
            "error": result.error_message,
            "raw_data": raw_data
        }
    except Exception as e:
        return {
            "file": os.path.basename(image_path),
            "utility_type": utility_type.value,
            "error": str(e)
        }


async def run_tests():
    """Run tests on manually specified images"""
    print("YOLO Model Testing - Reading Extraction Only")
    print("=" * 50)

    # Initialize service
    service = ImageProcessingService()

    # Manual test image paths - UPDATE THESE PATHS
    test_images = {
        "water": [
            r"C:\Users\ileen\Downloads\standardized water\1.jpg",
            # Add more water meter images here
        ],
        "electricity": [
            r"C:\Users\ileen\Downloads\IMG_5796.jpg",
            # Add more electricity meter images here
        ]
    }

    results = []

    # Test water images
    print("\n1. TESTING WATER MODEL")
    print("-" * 30)

    for img_path in test_images["water"]:
        if os.path.exists(img_path):
            result = await test_model(service, img_path, UtilityType.WATER)
            results.append(result)

            if result.get('error') and result['error'] != 'None':
                print(f"  {result['file']}: ERROR - {result['error']}")
                if 'raw_data' in result:
                    print(f"    Debug: {result['raw_data']}")
            elif result.get('reading'):
                print(f"  {result['file']}: Reading={result['reading']}, Confidence={result['confidence']:.3f}")
                if 'raw_data' in result:
                    print(f"    Raw: {result['raw_data']}")
            else:
                print(f"  {result['file']}: No reading detected")
                if 'raw_data' in result:
                    print(f"    Debug: {result['raw_data']}")
        else:
            print(f"  File not found: {img_path}")

    # Test electricity images
    print("\n2. TESTING ELECTRICITY MODEL")
    print("-" * 30)

    for img_path in test_images["electricity"]:
        if os.path.exists(img_path):
            result = await test_model(service, img_path, UtilityType.ELECTRICITY)
            results.append(result)

            if result.get('error') and result['error'] != 'None':
                print(f"  {result['file']}: ERROR - {result['error']}")
                if 'raw_data' in result:
                    print(f"    Debug: {result['raw_data']}")
            elif result.get('reading'):
                print(f"  {result['file']}: Reading={result['reading']}, Confidence={result['confidence']:.3f}")
                if 'raw_data' in result:
                    print(f"    Raw: {result['raw_data']}")
            else:
                print(f"  {result['file']}: No reading detected")
                if 'raw_data' in result:
                    print(f"    Debug: {result['raw_data']}")
        else:
            print(f"  File not found: {img_path}")

    if not test_images["electricity"]:
        print("  No electricity images specified - add paths to test_images['electricity']")

    # Summary
    print("\n3. SUMMARY")
    print("-" * 30)

    electricity_results = [r for r in results if r.get('utility_type') == 'electricity']
    water_results = [r for r in results if r.get('utility_type') == 'water']

    print(f"Electricity tests: {len(electricity_results)}")
    electricity_success = len([r for r in electricity_results if 'error' not in r and r.get('reading')])
    print(f"  Successful readings: {electricity_success}/{len(electricity_results)}")

    if electricity_success > 0:
        avg_conf = sum(r['confidence'] for r in electricity_results if 'confidence' in r and r['confidence'] > 0) / electricity_success
        print(f"  Average confidence: {avg_conf:.3f}")

    print(f"\nWater tests: {len(water_results)}")
    water_success = len([r for r in water_results if 'error' not in r and r.get('reading')])
    print(f"  Successful readings: {water_success}/{len(water_results)}")

    if water_success > 0:
        avg_conf = sum(r['confidence'] for r in water_results if 'confidence' in r and r['confidence'] > 0) / water_success
        print(f"  Average confidence: {avg_conf:.3f}")

    print(f"\nTotal successful readings: {electricity_success + water_success}/{len(results)}")


if __name__ == "__main__":
    print("Starting YOLO model tests...")
    print("Make sure you have test images in one of these directories:")
    print("  - test_images/electricity/ or test_images/water/")
    print("  - electricity_samples/ or water_samples/")
    print("  - Or any images with 'electric', 'water', or 'meter' in filename")
    print()

    try:
        asyncio.run(run_tests())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        import traceback
        traceback.print_exc()