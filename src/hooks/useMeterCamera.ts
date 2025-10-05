/**
 * Unified camera hook using Capacitor Camera
 * Works on mobile (native) and web (file picker/webcam)
 * Handles HEIC conversion automatically on iOS
 */
import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { preprocessForYOLO, getImageSize } from '@/utils/imageOptimization';

export interface CapturedMeterImage {
  dataUrl: string;
  format: string;
  sizeKB: number;
  originalDimensions?: { width: number; height: number };
  processedDimensions?: { width: number; height: number };
  platform: 'native' | 'web';
}

export interface UseMeterCameraOptions {
  quality?: number;
  preprocessForML?: boolean;
  allowGallery?: boolean;
}

export function useMeterCamera(options: UseMeterCameraOptions = {}) {
  const {
    quality = 85,
    preprocessForML = true,
    allowGallery = true
  } = options;

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCaptured, setLastCaptured] = useState<CapturedMeterImage | null>(null);

  const platform = Capacitor.isNativePlatform() ? 'native' : 'web';

  /**
   * Capture meter photo
   */
  const capture = async (): Promise<CapturedMeterImage | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      // Request camera permissions
      const permissions = await Camera.checkPermissions();
      if (permissions.camera === 'denied' || permissions.photos === 'denied') {
        const request = await Camera.requestPermissions();
        if (request.camera === 'denied') {
          throw new Error('Camera permission denied');
        }
      }

      // Capture photo
      // On mobile: Opens native camera
      // On web: Opens webcam or file picker
      const photo = await Camera.getPhoto({
        quality,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // iOS converts HEIC → JPEG here!
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true,
        width: 1920,
        height: 1080
      });

      if (!photo.dataUrl) {
        throw new Error('Failed to capture photo');
      }

      // Preprocess for YOLOv8 if needed
      let processedDataUrl = photo.dataUrl;
      let originalDimensions: { width: number; height: number } | undefined;
      let processedDimensions: { width: number; height: number } | undefined;

      if (preprocessForML) {
        const result = await preprocessForYOLO(photo.dataUrl, {
          targetSize: 640,
          maintainAspectRatio: true,
          paddingColor: '#000000'
        });

        processedDataUrl = result.dataURL;
        originalDimensions = result.originalDimensions;
        processedDimensions = result.processedDimensions;

        console.log('[Meter Camera] Preprocessed for YOLOv8:', {
          original: originalDimensions,
          processed: processedDimensions,
          platform
        });
      }

      const sizeKB = getImageSize(processedDataUrl);
      const format = photo.format || 'jpeg';

      const capturedImage: CapturedMeterImage = {
        dataUrl: processedDataUrl,
        format,
        sizeKB,
        originalDimensions,
        processedDimensions,
        platform
      };

      setLastCaptured(capturedImage);
      console.log(`[Meter Camera] Captured on ${platform}: ${sizeKB}KB, format: ${format}`);

      return capturedImage;

    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to capture photo';
      setError(errorMessage);
      console.error('[Meter Camera] Error:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Pick photo from gallery
   */
  const pickFromGallery = async (): Promise<CapturedMeterImage | null> => {
    if (!allowGallery) {
      setError('Gallery access not allowed');
      return null;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const permissions = await Camera.checkPermissions();
      if (permissions.photos === 'denied') {
        const request = await Camera.requestPermissions();
        if (request.photos === 'denied') {
          throw new Error('Gallery permission denied');
        }
      }

      const photo = await Camera.getPhoto({
        quality,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos, // Opens gallery
        correctOrientation: true
      });

      if (!photo.dataUrl) {
        throw new Error('Failed to pick photo');
      }

      // Same preprocessing as capture
      let processedDataUrl = photo.dataUrl;
      let originalDimensions: { width: number; height: number } | undefined;
      let processedDimensions: { width: number; height: number } | undefined;

      if (preprocessForML) {
        const result = await preprocessForYOLO(photo.dataUrl, {
          targetSize: 640,
          maintainAspectRatio: true,
          paddingColor: '#000000'
        });

        processedDataUrl = result.dataURL;
        originalDimensions = result.originalDimensions;
        processedDimensions = result.processedDimensions;
      }

      const sizeKB = getImageSize(processedDataUrl);
      const format = photo.format || 'jpeg';

      const capturedImage: CapturedMeterImage = {
        dataUrl: processedDataUrl,
        format,
        sizeKB,
        originalDimensions,
        processedDimensions,
        platform
      };

      setLastCaptured(capturedImage);
      return capturedImage;

    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to pick photo';
      setError(errorMessage);
      console.error('[Meter Camera] Gallery error:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Handle native file input (for iOS web compatibility)
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<CapturedMeterImage | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const file = event.target.files?.[0];
      if (!file) {
        throw new Error('No file selected');
      }

      // Read file as data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Preprocess for YOLOv8 if needed
      let processedDataUrl = dataUrl;
      let originalDimensions: { width: number; height: number } | undefined;
      let processedDimensions: { width: number; height: number } | undefined;

      if (preprocessForML) {
        const result = await preprocessForYOLO(dataUrl, {
          targetSize: 640,
          maintainAspectRatio: true,
          paddingColor: '#000000'
        });

        processedDataUrl = result.dataURL;
        originalDimensions = result.originalDimensions;
        processedDimensions = result.processedDimensions;

        console.log('[Meter Camera] Preprocessed for YOLOv8:', {
          original: originalDimensions,
          processed: processedDimensions,
          platform: 'web-native-input'
        });
      }

      const sizeKB = getImageSize(processedDataUrl);
      const format = file.type.split('/')[1] || 'jpeg';

      const capturedImage: CapturedMeterImage = {
        dataUrl: processedDataUrl,
        format,
        sizeKB,
        originalDimensions,
        processedDimensions,
        platform: 'web'
      };

      setLastCaptured(capturedImage);
      console.log(`[Meter Camera] Captured via native input: ${sizeKB}KB, format: ${format}`);

      return capturedImage;

    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to process photo';
      setError(errorMessage);
      console.error('[Meter Camera] File select error:', err);
      return null;
    } finally {
      setIsCapturing(false);
      // Reset input so same file can be selected again
      event.target.value = '';
    }
  };

  /**
   * Clear last captured image
   */
  const clear = () => {
    setLastCaptured(null);
    setError(null);
  };

  return {
    // State
    isCapturing,
    error,
    lastCaptured,
    platform,

    // Methods
    capture,
    pickFromGallery,
    handleFileSelect,
    clear,

    // Helpers
    isNative: platform === 'native',
    isWeb: platform === 'web'
  };
}
