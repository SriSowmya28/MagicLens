'use client';

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Tool } from './ToolsPanel';
import { ImageFilters } from './LayersPanel';

interface CanvasEditorProps {
  imageUrl: string | null;
  tool: Tool;
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  filters: ImageFilters;
  onMaskChange: (maskDataUrl: string | null) => void;
  disabled?: boolean;
}

export interface CanvasEditorRef {
  clearMask: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  exportImage: () => string | null;
}

const AdvancedCanvasEditor = forwardRef<CanvasEditorRef, CanvasEditorProps>(
  ({ imageUrl, tool, brushSize, brushColor, brushOpacity, filters, onMaskChange, disabled }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 600 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    
    // History for undo/redo
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [hasMask, setHasMask] = useState(false);

    // Generate CSS filter string from filters
    const getFilterString = useCallback(() => {
      const parts: string[] = [];
      
      if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
      if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
      if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
      if (filters.hue !== 0) parts.push(`hue-rotate(${filters.hue}deg)`);
      if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
      if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
      if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
      
      return parts.length > 0 ? parts.join(' ') : 'none';
    }, [filters]);

    // Load image
    useEffect(() => {
      if (!imageUrl) return;
      
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        
        // Initialize mask canvas
        const maskCanvas = maskCanvasRef.current;
        if (maskCanvas) {
          maskCanvas.width = img.width;
          maskCanvas.height = img.height;
          const ctx = maskCanvas.getContext('2d')!;
          ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          setHasMask(false);
          setHistory([]);
          setHistoryIndex(-1);
        }
      };
      img.src = imageUrl;
    }, [imageUrl]);

    // Save to history
    const saveToHistory = useCallback(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Remove any redo states
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    // Export mask for API
    const exportMask = useCallback(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas || !hasMask) {
        onMaskChange(null);
        return;
      }
      
      // Create a binary mask (white where colored, black elsewhere)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exportCtx = exportCanvas.getContext('2d')!;
      
      // Fill with black
      exportCtx.fillStyle = 'black';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      
      // Get mask data
      const maskCtx = canvas.getContext('2d')!;
      const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
      const exportData = exportCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
      
      // Convert colored mask to binary mask
      for (let i = 0; i < maskData.data.length; i += 4) {
        const alpha = maskData.data[i + 3];
        if (alpha > 10) {
          // Set to white where there's any color
          exportData.data[i] = 255;     // R
          exportData.data[i + 1] = 255; // G
          exportData.data[i + 2] = 255; // B
          exportData.data[i + 3] = 255; // A
        }
      }
      
      exportCtx.putImageData(exportData, 0, 0);
      onMaskChange(exportCanvas.toDataURL('image/png'));
    }, [hasMask, onMaskChange]);

    // Get canvas position from mouse/touch event
    const getCanvasPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      const canvas = maskCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return { x: 0, y: 0 };
      
      const rect = container.getBoundingClientRect();
      
      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      // Account for container position, zoom, and pan
      const x = ((clientX - rect.left) / zoom - pan.x) * (canvas.width / (rect.width / zoom));
      const y = ((clientY - rect.top) / zoom - pan.y) * (canvas.height / (rect.height / zoom));
      
      return { x, y };
    }, [zoom, pan]);

    // Draw stroke
    const drawStroke = useCallback((x: number, y: number, isNewStroke: boolean) => {
      const canvas = maskCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        // Parse color and apply opacity
        const opacity = brushOpacity / 100;
        ctx.strokeStyle = brushColor;
        ctx.globalAlpha = opacity;
      }

      if (isNewStroke || !lastPos) {
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      
      setLastPos({ x, y });
      setHasMask(true);
    }, [brushSize, brushColor, brushOpacity, tool, lastPos]);

    // Mouse/touch handlers
    const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      
      if (tool === 'pan' || (e as React.MouseEvent).button === 1) {
        setIsPanning(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
        return;
      }
      
      if (tool === 'brush' || tool === 'eraser') {
        setIsDrawing(true);
        const pos = getCanvasPosition(e);
        drawStroke(pos.x, pos.y, true);
      }
    }, [disabled, tool, pan, getCanvasPosition, drawStroke]);

    const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      
      if (isPanning) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setPan({ x: clientX - panStart.x, y: clientY - panStart.y });
        return;
      }
      
      if (isDrawing && (tool === 'brush' || tool === 'eraser')) {
        const pos = getCanvasPosition(e);
        drawStroke(pos.x, pos.y, false);
      }
    }, [disabled, isPanning, panStart, isDrawing, tool, getCanvasPosition, drawStroke]);

    const handlePointerUp = useCallback(() => {
      if (isDrawing) {
        saveToHistory();
        exportMask();
      }
      setIsDrawing(false);
      setIsPanning(false);
      setLastPos(null);
    }, [isDrawing, saveToHistory, exportMask]);

    // Zoom handling
    const handleWheel = useCallback((e: React.WheelEvent) => {
      if (tool === 'zoom' || e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * delta, 0.25), 4));
      }
    }, [tool]);

    // Clear mask
    const clearMask = useCallback(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasMask(false);
      saveToHistory();
      onMaskChange(null);
    }, [saveToHistory, onMaskChange]);

    // Undo
    const undo = useCallback(() => {
      if (historyIndex <= 0) return;
      
      const canvas = maskCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d')!;
      const newIndex = historyIndex - 1;
      
      if (newIndex < 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasMask(false);
      } else {
        ctx.putImageData(history[newIndex], 0, 0);
        setHasMask(true);
      }
      
      setHistoryIndex(newIndex);
      exportMask();
    }, [historyIndex, history, exportMask]);

    // Redo
    const redo = useCallback(() => {
      if (historyIndex >= history.length - 1) return;
      
      const canvas = maskCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d')!;
      const newIndex = historyIndex + 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
      setHasMask(true);
      exportMask();
    }, [historyIndex, history, exportMask]);

    // Export final image
    const exportImage = useCallback(() => {
      if (!imageUrl) return null;
      
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = imageDimensions.width;
      exportCanvas.height = imageDimensions.height;
      const ctx = exportCanvas.getContext('2d')!;
      
      // Draw image with filters
      const img = new Image();
      img.src = imageUrl;
      ctx.filter = getFilterString();
      ctx.drawImage(img, 0, 0);
      
      return exportCanvas.toDataURL('image/png');
    }, [imageUrl, imageDimensions, getFilterString]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      clearMask,
      undo,
      redo,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      exportImage,
    }), [clearMask, undo, redo, historyIndex, history.length, exportImage]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        
        if (e.key === '[') {
          e.preventDefault();
          // Decrease brush size - handled by parent
        } else if (e.key === ']') {
          e.preventDefault();
          // Increase brush size - handled by parent
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          redo();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    // Get cursor style
    const getCursor = () => {
      if (disabled) return 'not-allowed';
      switch (tool) {
        case 'brush':
        case 'eraser':
          return 'crosshair';
        case 'pan':
          return isPanning ? 'grabbing' : 'grab';
        case 'zoom':
          return 'zoom-in';
        default:
          return 'default';
      }
    };

    if (!imageUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-700">No image loaded</p>
            <p className="text-sm">Upload an image to start editing</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden rounded-2xl bg-[#1a1a1a]"
        style={{ cursor: getCursor() }}
        onWheel={handleWheel}
      >
        {/* Image Layer */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center',
          }}
        >
          <img
            src={imageUrl}
            alt="Source"
            className="max-w-full max-h-full object-contain"
            style={{ filter: getFilterString() }}
            draggable={false}
          />
          
          {/* Mask Canvas Overlay */}
          <canvas
            ref={maskCanvasRef}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ 
              mixBlendMode: 'normal',
              opacity: 0.6,
            }}
          />
        </div>

        {/* Interaction Layer */}
        <div
          className="absolute inset-0"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{ touchAction: 'none' }}
        />

        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full border border-gray-200 shadow-lg">
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs font-medium min-w-[3rem] text-center text-gray-700">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 4))}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            Fit
          </button>
        </div>

        {/* Brush Cursor Preview */}
        {(tool === 'brush' || tool === 'eraser') && !disabled && (
          <div
            className="fixed pointer-events-none border-2 rounded-full opacity-50"
            style={{
              width: brushSize * zoom,
              height: brushSize * zoom,
              borderColor: tool === 'eraser' ? '#fff' : brushColor,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>
    );
  }
);

AdvancedCanvasEditor.displayName = 'AdvancedCanvasEditor';

export default AdvancedCanvasEditor;
