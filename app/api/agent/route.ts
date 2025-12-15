import { NextRequest, NextResponse } from 'next/server';
import { FIBOParams, AgentResponse, DEFAULT_FIBO_PARAMS, OperationType } from '../../lib/types';

/**
 * AI Agent API Route
 * 
 * Converts natural language instructions into FIBO JSON parameters.
 * Uses OpenAI to parse user intent, detect operation type, and update the JSON state.
 */

// Enhanced system prompt that detects operation intent
const SYSTEM_PROMPT = `You are an intelligent image editing assistant for Bria FIBO's AI system.

YOUR TASK: Analyze the user's instruction and determine:
1. OPERATION TYPE - What kind of edit they want
2. PARAMETERS - Update the image parameters accordingly
3. WHETHER MASK IS NEEDED - Tell user if they need to draw on the area first

OPERATION TYPES (choose ONE):
- "inpaint_remove": User wants to REMOVE/DELETE/ERASE something (e.g., "remove the TV", "delete the person")
- "inpaint_replace": User wants to REPLACE/CHANGE something (e.g., "replace sky with sunset", "change shirt to red")
- "inpaint_add": User wants to ADD something to a specific area (e.g., "add flowers here", "put a hat on")
- "style_transfer": Change the STYLE/MOOD/LIGHTING of the whole image (e.g., "make it dramatic", "vintage look")
- "generate_new": Generate a completely NEW image (e.g., "create a landscape")
- "camera_adjust": Only camera/composition changes (e.g., "zoom in", "rotate left")

MASK REQUIREMENTS:
- inpaint_remove, inpaint_replace, inpaint_add REQUIRE a mask (hasMask must be true)
- style_transfer, generate_new, camera_adjust do NOT require a mask
- If operation requires mask but hasMask=false, set response to tell user to draw on the area first

DETECTION RULES:
- "remove", "delete", "erase", "get rid of" → inpaint_remove
- "replace", "change X to Y", "swap", "turn X into Y" → inpaint_replace  
- "add", "put", "place", "insert" → inpaint_add
- "style", "mood", "lighting", "filter", "make it look" → style_transfer
- "create", "generate", "imagine" → generate_new
- Camera terms only (zoom, rotate, angle) → camera_adjust

PARAMETER SCHEMA:
{
  "camera": { "yaw": -180 to 180, "pitch": -90 to 90, "roll": -180 to 180, "fov": 10 to 120 },
  "lighting": "studio_soft" | "natural_daylight" | "dramatic_side" | "backlit" | "overcast" | "neon" | "candlelight",
  "color_palette": "warm" | "cool" | "vibrant" | "muted" | "monochrome" | "pastel" | "natural",
  "composition": "centered" | "rule_of_thirds" | "golden_ratio" | "symmetrical" | "dynamic",
  "subject_description": string,
  "realism_level": "high" | "medium" | "stylized"
}

OUTPUT FORMAT - Return ONLY this JSON:
{
  "operation": "inpaint_remove" | "inpaint_replace" | "inpaint_add" | "style_transfer" | "generate_new" | "camera_adjust",
  "needsMask": boolean (true if this operation needs a mask but hasMask=false),
  "params": { ...updated parameters... },
  "prompt": "descriptive prompt for the AI",
  "response": "friendly message to the user (include mask instructions if needsMask=true)"
}`;

interface AgentRequest {
  userMessage: string;
  currentParams: FIBOParams;
  hasMask: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: AgentRequest = await request.json();
    const { userMessage, currentParams, hasMask } = body;

    if (!userMessage) {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }

    // Get Azure OpenAI API key from environment
    const openaiKey = process.env.AZURE_OPENAI_API_KEY;

    // Prepare the context for the AI
    const userPrompt = `CURRENT PARAMETERS:
${JSON.stringify(currentParams, null, 2)}

USER HAS DRAWN MASK: ${hasMask ? 'YES - User has marked a specific region to edit' : 'NO - No specific region selected'}

USER INSTRUCTION: "${userMessage}"

Analyze the intent and return the JSON response.`;

    let response: AgentResponse;

    if (openaiKey) {
      // Call OpenAI API
      response = await callOpenAI(openaiKey, userPrompt, hasMask);
    } else {
      // Mock response for demo without API key
      console.log('No OPENAI_API_KEY - using mock agent response');
      response = mockAgentResponse(userMessage, currentParams, hasMask);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to process instruction' },
      { status: 500 }
    );
  }
}

/**
 * Call Azure OpenAI API for JSON generation
 */
async function callOpenAI(apiKey: string, userPrompt: string, hasMask: boolean): Promise<AgentResponse> {
  // Azure OpenAI configuration
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';
  
  // Use Azure OpenAI
  const url = `${azureEndpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  
  console.log('Calling Azure OpenAI:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more deterministic JSON
      response_format: { type: 'json_object' } // Enforce JSON output
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Azure OpenAI API error:', error);
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Azure OpenAI');
  }

  // Parse the JSON response
  const parsed = JSON.parse(content);
  
  console.log('Agent detected operation:', parsed.operation);
  console.log('Agent needsMask:', parsed.needsMask);
  console.log('Agent prompt:', parsed.prompt);
  
  // Validate and map operation type
  const validOperations: OperationType[] = ['inpaint_remove', 'inpaint_replace', 'inpaint_add', 'style_transfer', 'generate_new', 'camera_adjust'];
  const operation: OperationType = validOperations.includes(parsed.operation) 
    ? parsed.operation 
    : (hasMask ? 'inpaint_replace' : 'style_transfer');
  
  return {
    operation,
    needsMask: parsed.needsMask || false,
    params: parsed.params || parsed,
    prompt: parsed.prompt || '',
    response: parsed.response || '✨ Got it! Click Generate to apply changes.',
  };
}

/**
 * Mock agent response for demo/testing without API key
 * Parses common instructions and detects operation type
 */
function mockAgentResponse(
  userMessage: string,
  currentParams: FIBOParams,
  hasMask: boolean
): AgentResponse {
  const lower = userMessage.toLowerCase();
  const updatedParams = { ...currentParams, camera: { ...currentParams.camera } };
  
  // Detect operation type based on keywords
  let operation: OperationType = 'style_transfer';
  let prompt = userMessage;
  let response = '✨ Got it! Click Generate to apply changes.';

  // Removal keywords
  if (/\b(remove|delete|erase|get rid of|clear|eliminate)\b/.test(lower)) {
    operation = 'inpaint_remove';
    const match = lower.match(/(?:remove|delete|erase|get rid of|clear|eliminate)\s+(?:the\s+)?(.+?)(?:\s+from|\s+in|\s*$)/);
    updatedParams.subject_description = match ? match[1].trim() : userMessage;
    prompt = `Remove ${updatedParams.subject_description} from the marked area and fill with natural background`;
    response = `🗑️ I'll remove "${updatedParams.subject_description}" from the marked area. Click Generate!`;
  }
  // Replace keywords
  else if (/\b(replace|change|swap|turn|convert)\b.*\b(to|into|with)\b/.test(lower)) {
    operation = 'inpaint_replace';
    const match = lower.match(/(?:replace|change|swap|turn|convert)\s+(?:the\s+)?(.+?)\s+(?:to|into|with)\s+(.+?)(?:\s*$)/);
    if (match) {
      updatedParams.subject_description = `Replace ${match[1]} with ${match[2]}`;
      prompt = `Replace ${match[1]} with ${match[2]} in the marked area, blend naturally`;
    }
    response = `🔄 I'll replace that for you. Click Generate!`;
  }
  // Add keywords
  else if (/\b(add|put|place|insert|include)\b/.test(lower)) {
    operation = hasMask ? 'inpaint_add' : 'style_transfer';
    const match = lower.match(/(?:add|put|place|insert|include)\s+(?:a\s+|some\s+)?(.+?)(?:\s+here|\s+there|\s+in|\s+on|\s*$)/);
    updatedParams.subject_description = match ? match[1].trim() : userMessage;
    prompt = `Add ${updatedParams.subject_description} in the marked area, blend seamlessly`;
    response = `✨ I'll add "${updatedParams.subject_description}" to the marked area. Click Generate!`;
  }
  // Camera only
  else if (/\b(zoom|rotate|tilt|angle|pan)\b/.test(lower) && !/\b(add|remove|change|style)\b/.test(lower)) {
    operation = 'camera_adjust';
    response = `📷 Camera adjusted! Click Generate to see the new angle.`;
  }
  // Generate new
  else if (/\b(create|generate|imagine|make me a|design)\b/.test(lower) && !hasMask) {
    operation = 'generate_new';
    updatedParams.subject_description = userMessage;
    prompt = userMessage;
    response = `🎨 I'll generate that for you. Click Generate!`;
  }
  // Default to style transfer
  else {
    operation = 'style_transfer';
    updatedParams.subject_description = userMessage;
    prompt = userMessage;
    response = `🎨 I'll apply those changes. Click Generate!`;
  }

  // Parse camera instructions
  if (lower.includes('left') && !lower.includes('tilt')) {
    const amount = lower.includes('slight') ? -15 : lower.includes('hard') ? -45 : -30;
    updatedParams.camera.yaw = Math.max(-180, updatedParams.camera.yaw + amount);
  }
  if (lower.includes('right') && !lower.includes('copyright') && !lower.includes('tilt')) {
    const amount = lower.includes('slight') ? 15 : lower.includes('hard') ? 45 : 30;
    updatedParams.camera.yaw = Math.min(180, updatedParams.camera.yaw + amount);
  }
  if (lower.includes('zoom in') || lower.includes('closer')) {
    updatedParams.camera.fov = Math.max(10, updatedParams.camera.fov - 15);
  }
  if (lower.includes('zoom out') || lower.includes('wider')) {
    updatedParams.camera.fov = Math.min(120, updatedParams.camera.fov + 15);
  }

  // Parse lighting instructions
  if (lower.includes('dramatic')) updatedParams.lighting = 'dramatic_side';
  if (lower.includes('soft')) updatedParams.lighting = 'studio_soft';
  if (lower.includes('natural') || lower.includes('daylight')) updatedParams.lighting = 'natural_daylight';
  if (lower.includes('neon')) updatedParams.lighting = 'neon';

  // Parse color palette
  if (lower.includes('warm')) updatedParams.color_palette = 'warm';
  if (lower.includes('cool') || lower.includes('cold')) updatedParams.color_palette = 'cool';
  if (lower.includes('vibrant')) updatedParams.color_palette = 'vibrant';

  // Set edit_mode based on operation
  updatedParams.edit_mode = operation.startsWith('inpaint') ? 'mask' : 'full';

  // Check if mask is needed but not provided
  const needsMask = ['inpaint_remove', 'inpaint_replace', 'inpaint_add'].includes(operation) && !hasMask;
  
  if (needsMask) {
    const objectName = updatedParams.subject_description || 'the area';
    response = `🎯 Please draw on ${objectName} first!\n\nUse the brush tool to mark the area, then click "Generate".`;
  }

  console.log('Mock agent detected operation:', operation, 'needsMask:', needsMask);

  return { 
    operation,
    needsMask,
    params: updatedParams,
    prompt,
    response
  };
}