'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface CanvasEditorProps {
  imageUrl: string;
  onMaskChange: (maskDataUrl: string | null) => void;
  disabled?: boolean;
}

export default function CanvasEditor({ imageUrl, onMaskChange, disabled }: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [hasDrawing, setHasDrawing] = useState(false);

  // Load image and set up canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      
      // Clear canvas when new image loads
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHasDrawing(false);
          onMaskChange(null);
        }
      }
    };
    img.src = imageUrl;
  }, [imageUrl, onMaskChange]);

  // Get position relative to canvas
  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // Draw on canvas
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getPosition(e);
    
    // Draw white circle (mask region)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    
    setHasDrawing(true);
  }, [isDrawing, brushSize, disabled, getPosition]);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    draw(e);
  }, [disabled, draw]);

  // Stop drawing and export mask
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Export mask
    const canvas = canvasRef.current;
    if (canvas && hasDrawing) {
      // Create a proper mask: white where drawn, black elsewhere
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = imageDimensions.width || canvas.width;
      maskCanvas.height = imageDimensions.height || canvas.height;
      const maskCtx = maskCanvas.getContext('2d')!;
      
      // Fill with black
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      
      // Scale and draw the user's mask (white regions)
      const scaleX = maskCanvas.width / canvas.width;
      const scaleY = maskCanvas.height / canvas.height;
      maskCtx.scale(scaleX, scaleY);
      maskCtx.drawImage(canvas, 0, 0);
      
      onMaskChange(maskCanvas.toDataURL('image/png'));
    }
  }, [isDrawing, hasDrawing, imageDimensions, onMaskChange]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawing(false);
      onMaskChange(null);
    }
  }, [onMaskChange]);

  return (
    <div className="space-y-3">
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-sm"
      >
        {/* Background Image */}
        <img
          src={imageUrl}
          alt="Source"
          className="w-full h-auto max-h-[500px] object-contain"
          draggable={false}
        />
        
        {/* Drawing Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ 
            touchAction: 'none',
            opacity: disabled ? 0.5 : 1 
          }}
        />

        {/* Instruction Overlay */}
        {!hasDrawing && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-gray-200">
              <p className="text-sm text-gray-600">
                🖌️ Draw on the image to mark edit regions
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Brush Size Slider */}
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm text-gray-600 whitespace-nowrap">
            Brush:
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
            disabled={disabled}
          />
          <span className="text-sm text-gray-600 w-8">{brushSize}</span>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          disabled={disabled || !hasDrawing}
          className={`
            px-3 py-1.5 text-sm rounded-lg
            transition-colors duration-200
            ${hasDrawing && !disabled
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Clear Mask
        </button>
      </div>

      {/* Status */}
      {hasDrawing && (
        <p className="text-xs text-green-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Mask region selected
        </p>
      )}
    </div>
  );
}
