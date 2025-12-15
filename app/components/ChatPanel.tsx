'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, Sparkles } from 'lucide-react';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  'Add flowers in the background',
  'Make it look like sunset',
  'Add dramatic lighting',
  'Remove background objects',
  'Make it more vibrant',
  'Add bokeh effect',
];

export default function ChatPanel({ messages, onSendMessage, isProcessing, disabled }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">AI Assistant</h3>
            <p className="text-sm text-gray-500 mb-4">
              Describe what changes you want to make to your image
            </p>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium">Quick prompts:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                  <motion.button
                    key={prompt}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !disabled && onSendMessage(prompt)}
                    disabled={disabled}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-600 hover:text-violet-700 rounded-full transition-all disabled:opacity-50 shadow-sm"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-md shadow-md shadow-violet-500/20'
                    : msg.role === 'system'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-white text-gray-700 rounded-bl-md shadow-md border border-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))
        )}

        {/* Typing indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-md border border-gray-100">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Upload an image first...' : 'Describe your edit...'}
            disabled={disabled || isProcessing}
            rows={1}
            className="w-full bg-gray-50 text-gray-900 rounded-xl pl-4 pr-12 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-200 disabled:opacity-50 placeholder-gray-400"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isProcessing || disabled}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${
              input.trim() && !isProcessing && !disabled
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/25'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Keyboard hint */}
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-mono">Enter</kbd> to send
        </p>
      </div>
    </div>
  );
}
