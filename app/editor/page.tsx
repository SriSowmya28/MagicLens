'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import ChatPanel, { ChatMessage } from '../components/ChatPanel';
import LayersPanel, { Layer, ImageFilters, defaultFilters } from '../components/LayersPanel';
import FiltersPanel, { PRESET_FILTERS } from '../components/FiltersPanel';
import ToolsPanel, { Tool } from '../components/ToolsPanel';
import AdvancedCanvasEditor, { CanvasEditorRef } from '../components/AdvancedCanvasEditor';
import { FIBOParams, GenerateResponse } from '../lib/types';
import { Sparkles, ArrowLeft, Upload, Play, Download, RotateCcw, Brush, Eraser, Hand, ZoomIn } from 'lucide-react';

// Default FIBO params
const defaultParams: FIBOParams = {
  subject_description: '',
  camera: { pitch: 0, yaw: 0, roll: 0, fov: 50 },
  lighting: 'natural_daylight',
  composition: 'rule_of_thirds',
  color_palette: 'natural',
  realism_level: 'high',
  edit_mode: 'mask',
  output_format: 'png',
};

export default function StudioPage() {
  // Sidebars
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<'layers' | 'filters'>('layers');
  
  // Image state
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [maskData, setMaskData] = useState<string | null>(null);
  
  // Layers
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<ImageFilters>(defaultFilters);
  
  // Tools
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(30);
  const [brushColor, setBrushColor] = useState('#FF6B6B');
  const [brushOpacity, setBrushOpacity] = useState(80);
  
  // Chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  
  // Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [params, setParams] = useState<FIBOParams>(defaultParams);
  const [pendingOperation, setPendingOperation] = useState<{
    operation?: string;
    prompt?: string;
    needsMask?: boolean;
  } | null>(null);
  
  // Refs
  const canvasRef = useRef<CanvasEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setOriginalImage(dataUrl);
      setCurrentImage(dataUrl);
      
      // Create thumbnail
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.min(80 / img.width, 80 / img.height);
        const x = (80 - img.width * scale) / 2;
        const y = (80 - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        // Add as layer
        const newLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: 'Original',
          type: 'original',
          visible: true,
          thumbnail,
          data: dataUrl,
          timestamp: Date.now(),
        };
        
        setLayers([newLayer]);
        setActiveLayerId(newLayer.id);
      };
      img.src = dataUrl;

      setChatHistory([{
        role: 'assistant',
        content: '📷 Image uploaded! Draw on the areas you want to edit, then describe what changes you want.',
      }]);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle chat message
  const handleSendMessage = useCallback(async (message: string) => {
    const imageToEdit = currentImage || originalImage;
    if (!imageToEdit) {
      setChatHistory(prev => [...prev, {
        role: 'system',
        content: '⚠️ Please upload an image first.',
      }]);
      return;
    }

    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setIsProcessingChat(true);

    try {
      // Call agent to convert to FIBO params
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: message,
          currentParams: params,
          hasMask: !!maskData,
        }),
      });

      if (!response.ok) throw new Error('Failed to process');

      const data = await response.json();
      
      if (data.params) {
        setParams(prev => ({ ...prev, ...data.params }));
      }

      // Store the operation and prompt for when user clicks Generate
      setPendingOperation({
        operation: data.operation,
        prompt: data.prompt,
        needsMask: data.needsMask,
      });

      // Show operation-specific feedback
      let feedback = data.response || '✨ Got it! Click "Generate" to apply your changes.';
      
      // If mask is needed but not drawn, show helpful message
      if (data.needsMask) {
        feedback = `🎯 **Draw on the area first!**\n\nUse the brush tool to mark the ${data.operation === 'inpaint_remove' ? 'object you want to remove' : data.operation === 'inpaint_add' ? 'area where you want to add' : 'area you want to change'}.\n\nThen click "Generate"!`;
      } else if (data.operation) {
        const opDescriptions: Record<string, string> = {
          'inpaint_remove': '🗑️ I\'ll remove that from the marked area.',
          'inpaint_replace': '🔄 I\'ll replace what\'s in the marked area.',
          'inpaint_add': '➕ I\'ll add that to the marked area.',
          'style_transfer': '🎨 I\'ll apply that style to the whole image.',
          'generate_new': '✨ I\'ll generate a new image.',
          'camera_adjust': '📷 I\'ll adjust the camera/perspective.',
        };
        feedback = opDescriptions[data.operation] || feedback;
        feedback += '\n\nClick "Generate" when ready!';
      }

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: feedback,
      }]);

    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I had trouble understanding that. Please try again.',
      }]);
    } finally {
      setIsProcessingChat(false);
    }
  }, [currentImage, originalImage, params, maskData]);

  // Handle mask change - also clear needsMask flag when user draws
  const handleMaskChange = useCallback((newMaskData: string | null) => {
    setMaskData(newMaskData);
    // If user draws a mask and we were waiting for one, update the message
    if (newMaskData && pendingOperation?.needsMask) {
      setPendingOperation(prev => prev ? { ...prev, needsMask: false } : null);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '✅ Great! You\'ve marked the area. Click **Generate** to apply the edit!',
      }]);
    }
  }, [pendingOperation?.needsMask]);

  // Handle generate - uses currentImage (selected layer) not original
  const handleGenerate = useCallback(async () => {
    // Use the current image (selected layer) for editing
    const imageToEdit = currentImage || originalImage;
    if (!imageToEdit) return;

    // Check if mask is required but not provided
    const needsMaskForOp = pendingOperation?.operation && 
      ['inpaint_remove', 'inpaint_replace', 'inpaint_add'].includes(pendingOperation.operation);
    
    if (needsMaskForOp && !maskData) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ **Please draw on the area first!**\n\nUse the brush tool to mark the region you want to edit, then click Generate again.',
      }]);
      return;
    }

    setIsGenerating(true);
    setChatHistory(prev => [...prev, {
      role: 'system',
      content: '🎨 Generating your edit...',
    }]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageToEdit,
          mask: maskData,
          params: params,
          operation: pendingOperation?.operation,
          prompt: pendingOperation?.prompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data: GenerateResponse = await response.json();
      
      // Update current image
      setCurrentImage(data.imageUrl);
      
      // Create thumbnail and add as layer
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.min(80 / img.width, 80 / img.height);
        const x = (80 - img.width * scale) / 2;
        const y = (80 - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        const newLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: `Edit ${layers.filter(l => l.type === 'edit').length + 1}`,
          type: 'edit',
          visible: true,
          thumbnail,
          data: data.imageUrl,
          timestamp: Date.now(),
        };
        
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
      };
      img.src = data.imageUrl;

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '✅ Done! Your edit has been applied. You can continue editing or start fresh.',
      }]);

      // Clear mask for next edit
      canvasRef.current?.clearMask();
      setMaskData(null);
      setPendingOperation(null);

    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [currentImage, originalImage, maskData, params, layers, pendingOperation]);

  // Layer controls
  const handleSelectLayer = useCallback((id: string) => {
    setActiveLayerId(id);
    const layer = layers.find(l => l.id === id);
    if (layer?.data) {
      setCurrentImage(layer.data);
    }
  }, [layers]);

  const handleToggleLayerVisibility = useCallback((id: string) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, visible: !l.visible } : l
    ));
  }, []);

  const handleDeleteLayer = useCallback((id: string) => {
    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== id);
      if (activeLayerId === id && filtered.length > 0) {
        setActiveLayerId(filtered[filtered.length - 1].id);
        setCurrentImage(filtered[filtered.length - 1].data || null);
      }
      return filtered;
    });
  }, [activeLayerId]);

  // Filter controls
  const handleApplyPreset = useCallback((presetId: string) => {
    const preset = PRESET_FILTERS[presetId];
    if (preset) {
      setFilters(preset);
    }
  }, []);

  // Reset
  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setCurrentImage(null);
    setMaskData(null);
    setLayers([]);
    setActiveLayerId(null);
    setFilters(defaultFilters);
    setParams(defaultParams);
    setChatHistory([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Download
  const handleDownload = useCallback(() => {
    if (!currentImage) return;
    
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `fibo-edit-${Date.now()}.png`;
    link.click();
  }, [currentImage]);

  // Keyboard shortcuts for brush size
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === '[') {
        setBrushSize(prev => Math.max(1, prev - 5));
      } else if (e.key === ']') {
        setBrushSize(prev => Math.min(100, prev + 5));
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveTool('brush');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('eraser');
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 flex flex-col overflow-hidden">
      {/* Background Decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-200 opacity-30 blur-3xl" />
        <div className="absolute -right-40 top-1/4 h-80 w-80 rounded-full bg-blue-200 opacity-30 blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 h-60 w-60 rounded-full bg-pink-200 opacity-20 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 relative z-10"
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                MagicLens
              </span>
            </motion.div>
          </Link>
          <span className="text-xs text-gray-500 hidden sm:block">AI Image Editor</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <motion.label
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl cursor-pointer transition-all shadow-sm"
          >
            <Upload className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Upload</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </motion.label>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={!originalImage || isGenerating}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium transition-all ${
              originalImage && !isGenerating
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Generate</span>
              </>
            )}
          </motion.button>

          {/* Download */}
          {currentImage && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}

          {/* Reset */}
          {originalImage && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="p-2.5 hover:bg-red-50 rounded-xl transition-colors border border-gray-200"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5 text-red-500" />
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat */}
        <Sidebar
          isOpen={leftSidebarOpen}
          onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
          side="left"
          title="AI Chat"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        >
          <ChatPanel
            messages={chatHistory}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessingChat}
            disabled={!originalImage}
          />
        </Sidebar>

        {/* Center - Canvas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 flex flex-col min-w-0 relative z-0"
        >
          {/* Tools Bar */}
          <div className="h-12 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center px-4 gap-4">
            {/* Quick Tools */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {(['brush', 'eraser', 'pan', 'zoom'] as Tool[]).map((tool) => (
                <motion.button
                  key={tool}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTool(tool)}
                  className={`p-2 rounded-lg transition-all ${
                    activeTool === tool
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                  }`}
                  title={tool.charAt(0).toUpperCase() + tool.slice(1)}
                >
                  {tool === 'brush' && <Brush className="w-4 h-4" />}
                  {tool === 'eraser' && <Eraser className="w-4 h-4" />}
                  {tool === 'pan' && <Hand className="w-4 h-4" />}
                  {tool === 'zoom' && <ZoomIn className="w-4 h-4" />}
                </motion.button>
              ))}
            </div>

            {/* Brush Size */}
            {(activeTool === 'brush' || activeTool === 'eraser') && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Size:</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-violet-600"
                />
                <span className="text-xs text-gray-600 w-8 font-medium">{brushSize}</span>
              </div>
            )}

            {/* Brush Color */}
            {activeTool === 'brush' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Color:</span>
                <div className="flex gap-1">
                  {['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD'].map((color) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setBrushColor(color)}
                      className={`w-6 h-6 rounded-full transition-all shadow-sm ${
                        brushColor === color ? 'ring-2 ring-violet-500 ring-offset-2 scale-110' : 'hover:shadow-md'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Mask indicator */}
            {maskData && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-full"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Mask active
              </motion.div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-4 overflow-hidden bg-gradient-to-br from-gray-100/50 to-white">
            <AdvancedCanvasEditor
              ref={canvasRef}
              imageUrl={currentImage}
              tool={activeTool}
              brushSize={brushSize}
              brushColor={brushColor}
              brushOpacity={brushOpacity}
              filters={filters}
              onMaskChange={handleMaskChange}
              disabled={isGenerating}
            />
          </div>
        </motion.div>

        {/* Right Sidebar - Layers & Filters */}
        <Sidebar
          isOpen={rightSidebarOpen}
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
          side="right"
          title={activeRightTab === 'layers' ? 'Layers' : 'Filters'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        >
          <div className="flex flex-col h-full">
            {/* Tab Switcher */}
            <div className="flex p-2 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveRightTab('layers')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeRightTab === 'layers'
                    ? 'bg-white text-violet-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Layers
              </button>
              <button
                onClick={() => setActiveRightTab('filters')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeRightTab === 'filters'
                    ? 'bg-white text-violet-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Filters
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeRightTab === 'layers' ? (
                <LayersPanel
                  layers={layers}
                  activeLayerId={activeLayerId}
                  onSelectLayer={handleSelectLayer}
                  onToggleVisibility={handleToggleLayerVisibility}
                  onDeleteLayer={handleDeleteLayer}
                  onReorderLayers={setLayers}
                  onUndo={() => canvasRef.current?.undo()}
                  onRedo={() => canvasRef.current?.redo()}
                  canUndo={canvasRef.current?.canUndo || false}
                  canRedo={canvasRef.current?.canRedo || false}
                />
              ) : (
                <FiltersPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  onApplyPreset={handleApplyPreset}
                  disabled={!originalImage}
                />
              )}
            </div>
          </div>
        </Sidebar>
      </div>

      {/* Status Bar */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="h-8 bg-white/80 backdrop-blur-md border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500 flex-shrink-0 relative z-10"
      >
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Powered by Bria FIBO</span>
          {originalImage && <span className="text-gray-300">•</span>}
          {originalImage && <span className="text-emerald-600 font-medium">Image loaded</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono">?</kbd> for shortcuts</span>
        </div>
      </motion.footer>
    </div>
  );
}
