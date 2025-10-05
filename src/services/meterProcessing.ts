/**
 * Service for processing meter images using YOLO model
 */

export interface ImageProcessRequest {
  image_data: string; // Base64 encoded image
  utility_type: 'water' | 'electricity';
}

export interface ImageProcessResponse {
  reading_value?: number;
  confidence_score: number;
  processing_status: 'pending' | 'processed' | 'failed' | 'manual';
  raw_ocr_data: Record<string, any>;
  error_message?: string;
}

class MeterProcessingService {
  private baseUrl = 'http://localhost:8000/api/v1';

  async processImage(imageData: string, utilityType: 'water' | 'electricity'): Promise<ImageProcessResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/readings/process-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_data: imageData,
          utility_type: utilityType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result: ImageProcessResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error processing meter image:', error);
      throw error;
    }
  }

  /**
   * Convert file to base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert canvas to base64
   */
  canvasToBase64(canvas: HTMLCanvasElement): string {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    // Remove data URL prefix
    return dataUrl.split(',')[1];
  }

  /**
   * Convert captured image data URL to base64
   */
  dataUrlToBase64(dataUrl: string): string {
    return dataUrl.split(',')[1];
  }
}

export const meterProcessingService = new MeterProcessingService();