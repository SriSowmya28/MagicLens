// Utility functions for canvas and image handling

/**
 * Convert a File to Base64 string (without data URL prefix)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a File to a data URL (with prefix, for displaying in img tags)
 */
export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert canvas to Base64 string (without prefix)
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.split(',')[1];
}

/**
 * Convert canvas to data URL (with prefix)
 */
export function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Load an image from a data URL and return dimensions
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Create a white mask from drawn regions on canvas
 * The mask should be white where edits should happen, black elsewhere
 */
export function createMaskFromCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a new canvas for the mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d')!;
  
  // Fill with black (no edit)
  maskCtx.fillStyle = 'black';
  maskCtx.fillRect(0, 0, width, height);
  
  // Copy the drawn content (should be white/light colored strokes)
  // Scale if the drawing canvas is different size from original image
  const scaleX = width / canvas.width;
  const scaleY = height / canvas.height;
  
  maskCtx.scale(scaleX, scaleY);
  maskCtx.drawImage(canvas, 0, 0);
  
  return canvasToBase64(maskCanvas);
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 12 * 1024 * 1024; // 12MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, or WebP.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 12MB.' };
  }
  
  return { valid: true };
}

/**
 * Clamp a number to a range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert natural language camera instructions to numeric values
 */
export function parseCameraDirection(direction: string): Partial<{ yaw: number; pitch: number; roll: number }> {
  const result: Partial<{ yaw: number; pitch: number; roll: number }> = {};
  const lower = direction.toLowerCase();
  
  // Yaw (horizontal rotation)
  if (lower.includes('left')) {
    result.yaw = lower.includes('slight') ? -15 : lower.includes('hard') ? -45 : -30;
  } else if (lower.includes('right')) {
    result.yaw = lower.includes('slight') ? 15 : lower.includes('hard') ? 45 : 30;
  }
  
  // Pitch (vertical rotation)
  if (lower.includes('up') || lower.includes('above')) {
    result.pitch = lower.includes('slight') ? 15 : lower.includes('high') ? 45 : 30;
  } else if (lower.includes('down') || lower.includes('below')) {
    result.pitch = lower.includes('slight') ? -15 : lower.includes('low') ? -45 : -30;
  }
  
  // Roll (tilt)
  if (lower.includes('tilt left') || lower.includes('dutch left')) {
    result.roll = -15;
  } else if (lower.includes('tilt right') || lower.includes('dutch right')) {
    result.roll = 15;
  }
  
  return result;
}
