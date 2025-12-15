'use client';

import { useState, useCallback, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  }, [message, disabled, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Describe your edit (e.g., "add flowers here and rotate camera left")'}
          disabled={disabled}
          rows={2}
          className={`
            w-full px-4 py-3 
            bg-white border border-gray-200 
            rounded-xl resize-none
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
            transition-all duration-200 shadow-sm
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        
        {/* Character hint */}
        <div className="absolute bottom-2 right-3 text-xs text-gray-400">
          Press Enter to send
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={`
          px-6 py-3 rounded-xl font-medium
          transition-all duration-200
          flex items-center gap-2
          ${!disabled && message.trim()
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Send
      </button>
    </div>
  );
}

// Preset suggestions component
interface PresetSuggestionsProps {
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function PresetSuggestions({ onSelect, disabled }: PresetSuggestionsProps) {
  const suggestions = [
    "Add flowers in the marked area",
    "Rotate camera 30° to the left",
    "Change lighting to dramatic side light",
    "Make the colors more vibrant",
    "Add a sunset background",
    "Zoom in closer (decrease FOV)",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-xs rounded-full
            border border-gray-200
            transition-all duration-200
            ${disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600'
            }
          `}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
