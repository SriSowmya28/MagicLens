// Bria FIBO API Client
// Handles communication with Bria's V2 API endpoints

import { FIBOParams, BriaStructuredPrompt, GenerateResponse } from './types';

const BRIA_API_BASE = 'https://engine.prod.bria-api.com/v2';
const BRIA_EDIT_BASE = 'https://engine.prod.bria-api.com/v2/image/edit';

/**
 * Convert our simplified FIBO params to Bria's structured prompt format
 */
export function paramsToStructuredPrompt(
  params: FIBOParams,
  subjectDescription?: string
): BriaStructuredPrompt {
  // Map camera params to descriptive strings
  const cameraAngle = describeCameraAngle(params.camera);
  const focalLength = fovToFocalLength(params.camera.fov);
  
  return {
    short_description: subjectDescription || 'A professionally composed image',
    lighting: {
      type: mapLightingType(params.lighting),
      direction: 'front',
      shadows: params.lighting.includes('dramatic') ? 'strong' : 'soft'
    },
    aesthetics: {
      composition: params.composition.replace('_', ' '),
      color_scheme: params.color_palette || 'natural',
      mood_atmosphere: params.realism_level === 'stylized' ? 'artistic' : 'realistic'
    },
    photographic_characteristics: {
      depth_of_field: params.camera.fov < 30 ? 'shallow' : 'medium',
      focus: 'sharp on subject',
      camera_angle: cameraAngle,
      lens_focal_length: focalLength
    },
    style_medium: params.realism_level === 'high' ? 'photograph' : 'digital art'
  };
}

/**
 * Describe camera angle from numeric values
 */
function describeCameraAngle(camera: FIBOParams['camera']): string {
  const parts: string[] = [];
  
  if (Math.abs(camera.pitch) > 10) {
    parts.push(camera.pitch > 0 ? 'high angle' : 'low angle');
  }
  if (Math.abs(camera.yaw) > 10) {
    parts.push(camera.yaw > 0 ? 'from the right' : 'from the left');
  }
  if (Math.abs(camera.roll) > 5) {
    parts.push('dutch angle');
  }
  
  return parts.length > 0 ? parts.join(', ') : 'straight on';
}

/**
 * Convert FOV to approximate focal length description
 */
function fovToFocalLength(fov: number): string {
  if (fov < 20) return '135mm telephoto';
  if (fov < 35) return '85mm portrait';
  if (fov < 50) return '50mm standard';
  if (fov < 70) return '35mm wide';
  return '24mm ultra-wide';
}

/**
 * Map our lighting presets to descriptive strings
 */
function mapLightingType(lighting: string): string {
  const mapping: Record<string, string> = {
    'studio_soft': 'soft studio lighting with diffused shadows',
    'natural_daylight': 'natural daylight, golden hour warmth',
    'dramatic_side': 'dramatic side lighting with strong contrast',
    'backlit': 'backlit with rim lighting',
    'overcast': 'soft overcast ambient lighting',
    'neon': 'colorful neon lighting',
    'candlelight': 'warm candlelight ambiance'
  };
  return mapping[lighting] || lighting.replace('_', ' ');
}

/**
 * Call Bria FIBO API to generate an image
 * Uses /gen_fill for inpainting when mask is provided,
 * otherwise uses /image/generate for text-to-image
 */
export async function generateImage(
  image: string,
  mask: string | undefined,
  params: FIBOParams,
  prompt?: string,
  apiToken?: string
): Promise<GenerateResponse> {
  // If no API token, return mock response for demo
  if (!apiToken) {
    console.log('No BRIA_API_TOKEN - returning mock response');
    return mockGenerateResponse(params);
  }

  // Build a rich text prompt that describes what we want
  const textPrompt = buildRichPrompt(params, prompt);

  // If we have both image and mask, use gen_fill for inpainting
  if (image && mask) {
    return generateWithGenFill(image, mask, textPrompt, apiToken);
  }

  // Otherwise use standard generation
  return generateStandard(image, textPrompt, apiToken);
}

/**
 * Use /gen_fill endpoint for inpainting - edits masked region of image
 * Mask: white (255) = area to fill, black (0) = preserve
 */
async function generateWithGenFill(
  image: string,
  mask: string,
  prompt: string,
  apiToken: string
): Promise<GenerateResponse> {
  // Strip data URL prefix if present - API wants raw base64
  const rawImageBase64 = image.includes(',') 
    ? image.split(',')[1] 
    : image;
  
  const rawMaskBase64 = mask.includes(',') 
    ? mask.split(',')[1] 
    : mask;

  const requestBody = {
    image: rawImageBase64,
    mask: rawMaskBase64,
    prompt: prompt,
    sync: true,
    version: 2,  // Better quality
    mask_type: 'manual'
  };

  console.log('Sending to Bria gen_fill API:', {
    prompt: prompt.substring(0, 100) + '...',
    hasImage: true,
    hasMask: true
  });

  try {
    const response = await fetch(`${BRIA_EDIT_BASE}/gen_fill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiToken
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bria gen_fill API error response:', errorText);
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // Keep default error message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Bria gen_fill API success:', { 
      hasImageUrl: !!data.result?.image_url,
      requestId: data.request_id
    });
    
    return {
      imageUrl: data.result.image_url,
      seed: undefined,
      structuredPrompt: undefined
    };
  } catch (error) {
    console.error('Bria gen_fill API error:', error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Standard text-to-image or image-inspired generation
 */
async function generateStandard(
  image: string | undefined,
  prompt: string,
  apiToken: string
): Promise<GenerateResponse> {
  const requestBody: Record<string, unknown> = {
    sync: true,
    aspect_ratio: '1:1',
    prompt: prompt
  };

  // Add image as raw base64 if provided (without data URL prefix)
  if (image) {
    const rawBase64 = image.includes(',') 
      ? image.split(',')[1] 
      : image;
    requestBody.images = [rawBase64];
  }

  console.log('Sending to Bria generate API:', {
    prompt: prompt.substring(0, 100) + '...',
    hasImage: !!image
  });

  try {
    const response = await fetch(`${BRIA_API_BASE}/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiToken
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bria generate API error response:', errorText);
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // Keep default error message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Bria generate API success:', { 
      hasImageUrl: !!data.result?.image_url,
      hasSeed: !!data.result?.seed 
    });
    
    return {
      imageUrl: data.result.image_url,
      seed: data.result.seed,
      structuredPrompt: data.result.structured_prompt
    };
  } catch (error) {
    console.error('Bria generate API error:', error);
    throw error;
  }
}

/**
 * Build a rich text prompt from FIBO params
 */
function buildRichPrompt(params: FIBOParams, userPrompt?: string): string {
  const parts: string[] = [];
  
  // Start with user prompt if provided
  if (userPrompt) {
    parts.push(userPrompt);
  }
  
  // Add subject description
  if (params.subject_description) {
    parts.push(params.subject_description);
  }
  
  // Add lighting
  const lightingMap: Record<string, string> = {
    'studio_soft': 'soft studio lighting with diffused shadows',
    'natural_daylight': 'natural daylight, golden hour warmth',
    'dramatic_side': 'dramatic side lighting with strong contrast',
    'backlit': 'backlit with rim lighting',
    'overcast': 'soft overcast ambient lighting',
    'neon': 'colorful neon lighting',
    'candlelight': 'warm candlelight ambiance'
  };
  if (params.lighting && lightingMap[params.lighting]) {
    parts.push(lightingMap[params.lighting]);
  }
  
  // Add composition
  const compositionMap: Record<string, string> = {
    'rule_of_thirds': 'composed using rule of thirds',
    'centered': 'centered composition',
    'golden_ratio': 'golden ratio composition',
    'symmetrical': 'symmetrical composition',
    'leading_lines': 'leading lines composition'
  };
  if (params.composition && compositionMap[params.composition]) {
    parts.push(compositionMap[params.composition]);
  }
  
  // Add color palette
  if (params.color_palette) {
    parts.push(`${params.color_palette} color palette`);
  }
  
  // Add realism level
  if (params.realism_level === 'high') {
    parts.push('photorealistic, highly detailed');
  } else if (params.realism_level === 'stylized') {
    parts.push('artistic, stylized');
  }
  
  return parts.join('. ') || 'A high quality image';
}

/**
 * Mock response for demo/testing without API key
 */
function mockGenerateResponse(params: FIBOParams): GenerateResponse {
  // Return a placeholder image URL
  // In a real demo, you might have pre-generated examples
  const seed = Math.floor(Math.random() * 1000000);
  
  // Use a placeholder service for demo
  const placeholderUrl = `https://picsum.photos/seed/${seed}/1024/1024`;
  
  return {
    imageUrl: placeholderUrl,
    seed,
    structuredPrompt: JSON.stringify(paramsToStructuredPrompt(params))
  };
}

/**
 * Poll for async generation result (if using async mode)
 */
export async function pollGenerationStatus(
  statusUrl: string,
  apiToken: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<GenerateResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(statusUrl, {
      headers: { 'api_token': apiToken }
    });
    
    const data = await response.json();
    
    if (data.status === 'completed' && data.result) {
      return {
        imageUrl: data.result.image_url,
        seed: data.result.seed,
        structuredPrompt: data.result.structured_prompt
      };
    }
    
    if (data.status === 'failed') {
      throw new Error(data.error || 'Generation failed');
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Generation timed out');
}
