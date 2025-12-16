This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
## MagicLens — AI-Powered Image Editor (Next.js)

MagicLens is a Next.js app that blends a clean canvas editor with AI-powered image operations (via Bria FIBO). It supports manual editing (crop, rotate, eraser with drag-to-resize, undo/redo) and quick actions like background removal, blur/replace background, expand, upscale, and HDR enhance.

### Highlights
- Free rotation (-180° to 180°) with a simple slider
- Crop with draggable handles and rule-of-thirds grid
- Eraser tool with vertical drag-to-resize and slider control
- Undo/redo with keyboard shortcuts
- Enter to apply crop/rotation, Escape to cancel
- “No image loaded” state with centered upload button
- Bria FIBO integration for background/expand/upscale/enhance/erase

---

## Quick Start

Prerequisites:
- Node.js 18+
- npm 9+ (or pnpm/yarn)

Install and run:
```bash
npm install
npm run dev
```

Open the app at:
```
http://localhost:3000
```

---

## Environment Variables

Create a `.env.local` in the project root:
```bash
# Required for Bria FIBO engine
BRIA_API_TOKEN=your_bria_api_token

# Optional: If you wire up chat/LLM features
# AZURE_OPENAI_ENDPOINT=... 
# AZURE_OPENAI_API_KEY=...
```

Restart the dev server after adding/updating env vars.

---

## Usage Guide

Open the editor at `/editor`.

- Upload an image: click the upload button or drag a file.
- Crop: click the Crop tool, drag the handles. Press Enter to apply or Esc to cancel.
- Rotate: enable Rotate, adjust the slider. Press Enter to apply or Esc to cancel.
- Eraser: select Eraser, then drag up/down on the canvas to change size, or use the size slider panel.
- Undo/Redo: use toolbar buttons or `Cmd/Ctrl + Z` and `Cmd/Ctrl + Shift + Z`.

Quick Actions (Bria):
- Background remove/blur/replace
- Expand (outpaint) and Upscale (increase resolution)
- HDR Enhance

> Note: Some operations may take a few seconds depending on image size and Bria’s service.

---

## Example Outputs

Examples you can try after uploading a photo:
- Background Remove → returns a transparent PNG where the subject is preserved.
- Background Replace (prompt: “modern living room”) → returns the subject composited into a new background.
- Upscale ×2 → returns a higher resolution image while preserving content.
- HDR Enhance → increases dynamic range and sharpness.

---

## API Integration (Bria FIBO)

All service calls are centralized in `app/lib/bria.ts`. Import and call them from API routes or client actions.

### Client Usage via Next.js API Route
```ts
// app/api/generate/route.ts (already included)
import { removeBackground, replaceBackground, expandImage, upscaleImage, enhanceImage, blurBackground, eraseElements } from "@/app/lib/bria";

export async function POST(req: Request) {
	const { operation, image, prompt, params } = await req.json();

	switch (operation) {
		case "background_remove":
			return Response.json(await removeBackground(image));
		case "background_blur":
			return Response.json(await blurBackground(image, params));
		case "background_replace":
			return Response.json(await replaceBackground(image, prompt, params));
		case "expand":
			return Response.json(await expandImage(image, params));
		case "upscale":
			return Response.json(await upscaleImage(image, params));
		case "hdr_enhance":
			return Response.json(await enhanceImage(image, params));
		case "erase":
			return Response.json(await eraseElements(image, params));
		default:
			return new Response("Unsupported operation", { status: 400 });
	}
}
```

### Direct Function Calls
```ts
import { removeBackground, upscaleImage } from "@/app/lib/bria";

// Remove background
const { image: outPng } = await removeBackground(inputDataUrl);

// Upscale ×2
const { image: hiResPng } = await upscaleImage(inputDataUrl, { desired_increase: 2 });
```

### Example cURL Request (Increase Resolution)
```bash
curl -X POST "https://engine.prod.bria-api.com/v2/image/edit/increase_resolution" \
	-H "Content-Type: application/json" \
	-H "api_token: $BRIA_API_TOKEN" \
	-d '{
		"image": "data:image/png;base64,....",
		"desired_increase": 2,
		"sync": true
	}'
```

---

## Project Structure

```
app/
	editor/page.tsx                 # Editor screen and panels
	components/                     # Editor UI components
	lib/bria.ts                     # Bria FIBO client wrappers
	api/generate/route.ts           # Single endpoint for image operations
components/ui/                    # UI primitives/animations
```

---

## Troubleshooting
- 403 from Bria endpoints → verify `BRIA_API_TOKEN` and ensure you are hitting the correct path (e.g., `/remove_background`, `/increase_resolution`, `/enhance`).
- Large images failing expand → try smaller input size or different expand parameters.
- Crop/Rotate not applying → press Enter to apply or use the ✓ button.

---

## Contributing
Pull requests are welcome. Please open an issue to discuss major changes first.

---

## License
This project is for educational/demo purposes. Add a license if you intend to distribute.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
