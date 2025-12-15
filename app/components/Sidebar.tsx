'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  side: 'left' | 'right';
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Sidebar({ isOpen, onToggle, side, title, icon, children }: SidebarProps) {
  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 320 : 48 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`
        h-full bg-white/90 backdrop-blur-xl border-gray-200
        flex-shrink-0 relative z-10
        ${side === 'left' ? 'border-r' : 'border-l'}
      `}
    >
      {/* Collapsed State */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="w-full h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
            title={title}
          >
            {icon || (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded State */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-80 h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {icon && <span className="text-violet-600">{icon}</span>}
                <h2 className="font-semibold text-gray-900">{title}</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
