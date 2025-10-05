/**
 * Image optimization utilities for camera captures
 * Compresses images for faster upload and reduced bandwidth
 * Includes YOLOv8-specific preprocessing
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface YOLOPreprocessOptions {
  targetSize?: number; // YOLOv8 imgsz (default 640)
  maintainAspectRatio?: boolean;
  paddingColor?: string;
}

/**
 * Compress an image from canvas or data URL
 */
export async function compressImage(
  source: HTMLCanvasElement | string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options;

  let canvas: HTMLCanvasElement;

  // Handle data URL input
  if (typeof source === 'string') {
    canvas = await dataURLToCanvas(source);
  } else {
    canvas = source;
  }

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = canvas;

  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;

    if (width > height) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    } else {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }
  }

  // Create resized canvas
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = width;
  resizedCanvas.height = height;

  const ctx = resizedCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Use better image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw resized image
  ctx.drawImage(canvas, 0, 0, width, height);

  // Convert to compressed data URL
  return resizedCanvas.toDataURL(mimeType, quality);
}

/**
 * Convert data URL to canvas
 */
function dataURLToCanvas(dataURL: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataURL;
  });
}

/**
 * Get image file size from data URL (in KB)
 */
export function getImageSize(dataURL: string): number {
  const base64Length = dataURL.split(',')[1]?.length || 0;
  const sizeInBytes = (base64Length * 3) / 4;
  return Math.round(sizeInBytes / 1024);
}

/**
 * Convert data URL to Blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binaryString = atob(parts[1]);
  const length = binaryString.length;
  const uint8Array = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mime });
}

/**
 * Create object URL from data URL
 * Remember to revoke with URL.revokeObjectURL when done!
 */
export function createObjectURL(dataURL: string): string {
  const blob = dataURLToBlob(dataURL);
  return URL.createObjectURL(blob);
}

/**
 * Cleanup object URLs to prevent memory leaks
 */
export function cleanupObjectURL(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Progressive image loading - create thumbnail
 */
export async function createThumbnail(
  source: HTMLCanvasElement | string,
  maxSize: number = 200
): Promise<string> {
  return compressImage(source, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality: 0.7,
    mimeType: 'image/jpeg'
  });
}

/**
 * Analyze image quality metrics
 */
export function analyzeImageQuality(dataURL: string): {
  sizeKB: number;
  isOptimized: boolean;
  recommendation: string;
} {
  const sizeKB = getImageSize(dataURL);

  let isOptimized = true;
  let recommendation = 'Image is well optimized';

  if (sizeKB > 2000) {
    isOptimized = false;
    recommendation = 'Image is very large. Consider reducing quality or resolution.';
  } else if (sizeKB > 1000) {
    isOptimized = false;
    recommendation = 'Image is large. Consider slight compression.';
  } else if (sizeKB > 500) {
    recommendation = 'Image size is acceptable but could be optimized further.';
  }

  return {
    sizeKB,
    isOptimized,
    recommendation
  };
}

/**
 * Preprocess image for YOLOv8 meter detection
 * Optimizes for imgsz=640 while maintaining aspect ratio
 */
export async function preprocessForYOLO(
  source: HTMLCanvasElement | string,
  options: YOLOPreprocessOptions = {}
): Promise<{
  dataURL: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
}> {
  const {
    targetSize = 640,
    maintainAspectRatio = true,
    paddingColor = '#000000'
  } = options;

  let canvas: HTMLCanvasElement;

  // Handle data URL input
  if (typeof source === 'string') {
    canvas = await dataURLToCanvas(source);
  } else {
    canvas = source;
  }

  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  // Create target canvas
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetSize;
  targetCanvas.height = targetSize;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Fill with padding color
  ctx.fillStyle = paddingColor;
  ctx.fillRect(0, 0, targetSize, targetSize);

  if (maintainAspectRatio) {
    // Calculate scaling to fit within targetSize
    const scale = Math.min(
      targetSize / originalWidth,
      targetSize / originalHeight
    );

    const scaledWidth = originalWidth * scale;
    const scaledHeight = originalHeight * scale;

    // Center the image
    const x = (targetSize - scaledWidth) / 2;
    const y = (targetSize - scaledHeight) / 2;

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

    return {
      dataURL: targetCanvas.toDataURL('image/jpeg', 0.92),
      originalDimensions: { width: originalWidth, height: originalHeight },
      processedDimensions: { width: scaledWidth, height: scaledHeight }
    };
  } else {
    // Stretch to fill (not recommended for meter detection)
    ctx.drawImage(canvas, 0, 0, targetSize, targetSize);

    return {
      dataURL: targetCanvas.toDataURL('image/jpeg', 0.92),
      originalDimensions: { width: originalWidth, height: originalHeight },
      processedDimensions: { width: targetSize, height: targetSize }
    };
  }
}

/**
 * Prepare image for display in preview (maintain aspect ratio)
 * Useful for displaying 640x640 YOLO images properly
 */
export function createDisplayVersion(
  source: string,
  maxDisplaySize: number = 400
): Promise<string> {
  return compressImage(source, {
    maxWidth: maxDisplaySize,
    maxHeight: maxDisplaySize,
    quality: 0.9,
    mimeType: 'image/jpeg'
  });
}
