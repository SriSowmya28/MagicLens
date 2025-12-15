'use client';

import React, { useState } from 'react';
import { ImageFilters, defaultFilters } from './LayersPanel';

interface FiltersPanelProps {
  filters: ImageFilters;
  onFiltersChange: (filters: ImageFilters) => void;
  onApplyPreset: (preset: string) => void;
  disabled?: boolean;
}

const PRESETS = [
  { id: 'none', name: 'Original', icon: '🔲' },
  { id: 'vivid', name: 'Vivid', icon: '🌈' },
  { id: 'warm', name: 'Warm', icon: '☀️' },
  { id: 'cool', name: 'Cool', icon: '❄️' },
  { id: 'dramatic', name: 'Dramatic', icon: '🎭' },
  { id: 'vintage', name: 'Vintage', icon: '📷' },
  { id: 'noir', name: 'Noir', icon: '🖤' },
  { id: 'fade', name: 'Fade', icon: '🌫️' },
  { id: 'cinema', name: 'Cinema', icon: '🎬' },
  { id: 'sunset', name: 'Sunset', icon: '🌅' },
  { id: 'forest', name: 'Forest', icon: '🌲' },
  { id: 'ocean', name: 'Ocean', icon: '🌊' },
];

export const PRESET_FILTERS: Record<string, ImageFilters> = {
  none: { ...defaultFilters },
  vivid: { ...defaultFilters, saturation: 140, contrast: 110, brightness: 105 },
  warm: { ...defaultFilters, temperature: 30, saturation: 110 },
  cool: { ...defaultFilters, temperature: -30, saturation: 90 },
  dramatic: { ...defaultFilters, contrast: 130, saturation: 120, brightness: 95, vignette: 30 },
  vintage: { ...defaultFilters, sepia: 40, saturation: 80, contrast: 90, grain: 20 },
  noir: { ...defaultFilters, grayscale: 100, contrast: 120, brightness: 95 },
  fade: { ...defaultFilters, contrast: 80, saturation: 80, brightness: 110 },
  cinema: { ...defaultFilters, contrast: 115, saturation: 85, temperature: 10, vignette: 25 },
  sunset: { ...defaultFilters, temperature: 40, saturation: 130, brightness: 105, hue: 10 },
  forest: { ...defaultFilters, temperature: -10, saturation: 120, hue: -10 },
  ocean: { ...defaultFilters, temperature: -25, saturation: 115, hue: -20 },
};

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  defaultValue: number;
  unit?: string;
  disabled?: boolean;
}

function Slider({ label, value, onChange, min, max, defaultValue, unit = '', disabled }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const isDefault = value === defaultValue;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-700 font-medium">{label}</label>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${isDefault ? 'text-gray-400' : 'text-violet-600'}`}>
            {value}{unit}
          </span>
          {!isDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="text-xs text-gray-400 hover:text-violet-600 transition-colors"
              title="Reset"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
          }}
        />
      </div>
    </div>
  );
}

export default function FiltersPanel({ filters, onFiltersChange, onApplyPreset, disabled }: FiltersPanelProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'adjust' | 'effects'>('presets');

  const updateFilter = (key: keyof ImageFilters, value: number) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetAll = () => {
    onFiltersChange({ ...defaultFilters });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {(['presets', 'adjust', 'effects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all capitalize ${
              activeTab === tab
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Presets Tab */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.id)}
              disabled={disabled}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-violet-50 hover:border-violet-200'}
                bg-white border border-gray-200 shadow-sm
              `}
            >
              <span className="text-2xl">{preset.icon}</span>
              <span className="text-xs text-gray-600 font-medium">{preset.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Adjust Tab */}
      {activeTab === 'adjust' && (
        <div className="space-y-4">
          <Slider
            label="Brightness"
            value={filters.brightness}
            onChange={(v) => updateFilter('brightness', v)}
            min={0}
            max={200}
            defaultValue={100}
            unit="%"
            disabled={disabled}
          />
          <Slider
            label="Contrast"
            value={filters.contrast}
            onChange={(v) => updateFilter('contrast', v)}
            min={0}
            max={200}
            defaultValue={100}
            unit="%"
            disabled={disabled}
          />
          <Slider
            label="Saturation"
            value={filters.saturation}
            onChange={(v) => updateFilter('saturation', v)}
            min={0}
            max={200}
            defaultValue={100}
            unit="%"
            disabled={disabled}
          />
          <Slider
            label="Hue Rotate"
            value={filters.hue}
            onChange={(v) => updateFilter('hue', v)}
            min={-180}
            max={180}
            defaultValue={0}
            unit="°"
            disabled={disabled}
          />
          <Slider
            label="Temperature"
            value={filters.temperature}
            onChange={(v) => updateFilter('temperature', v)}
            min={-100}
            max={100}
            defaultValue={0}
            disabled={disabled}
          />

          <button
            onClick={resetAll}
            disabled={disabled}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl border border-gray-200 transition-all font-medium"
          >
            Reset All Adjustments
          </button>
        </div>
      )}

      {/* Effects Tab */}
      {activeTab === 'effects' && (
        <div className="space-y-4">
          <Slider
            label="Blur"
            value={filters.blur}
            onChange={(v) => updateFilter('blur', v)}
            min={0}
            max={20}
            defaultValue={0}
            unit="px"
            disabled={disabled}
          />
          <Slider
            label="Sharpen"
            value={filters.sharpen}
            onChange={(v) => updateFilter('sharpen', v)}
            min={0}
            max={100}
            defaultValue={0}
            unit="%"
            disabled={disabled}
          />
          <Slider
            label="Vignette"
            value={filters.vignette}
            onChange={(v) => updateFilter('vignette', v)}
            min={0}
            max={100}
            defaultValue={0}
            unit="%"
            disabled={disabled}
          />
          <Slider
            label="Grain"
            value={filters.grain}
            onChange={(v) => updateFilter('grain', v)}
            min={0}
            max={100}
            defaultValue={0}
            unit="%"
            disabled={disabled}
          />
          <Slider
            label="Sepia"
            value={filters.sepia}
            onChange={(v) => updateFilter('sepia', v)}
            min={0}
            max={100}
            defaultValue={0}
            unit="%"
            disabled={disabled}
          />
          <Slider
            label="Grayscale"
            value={filters.grayscale}
            onChange={(v) => updateFilter('grayscale', v)}
            min={0}
            max={100}
            defaultValue={0}
            unit="%"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
