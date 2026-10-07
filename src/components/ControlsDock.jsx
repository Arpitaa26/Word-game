import React from 'react';
import { RotateCcw, Sun, Moon, Type, Layers } from 'lucide-react';
import { MATERIAL_PRESETS } from '../canvas/LivingTypeEngine';

const PRESET_WORDS = ['CREATE', 'ELASTIC', 'KINETIC', 'DODO', 'FORM'];

export function ControlsDock({
  text,
  setText,
  fontFamily,
  setFontFamily,
  materialKey,
  setMaterialKey,
  themeKey,
  setThemeKey,
  onReset,
}) {

  const handleThemeToggle = () => {
    setThemeKey((prev) => (prev === 'obsidian' ? 'alabaster' : 'obsidian'));
  };

  const fonts = [
    { id: 'Syne', label: 'Syne' },
    { id: 'Instrument Serif', label: 'Serif' },
    { id: 'Plus Jakarta Sans', label: 'Grotesk' },
  ];

  return (
    <nav className="controls-dock" aria-label="Living Type controls">
      {/* 1. Quick Word Presets */}
      <div className="dock-section presets-group">
        <span className="dock-label">
          <span>WORDS</span>
        </span>
        <div className="preset-chips">
          {PRESET_WORDS.map((word) => (
            <button
              key={word}
              type="button"
              className={`chip-btn ${text === word ? 'active' : ''}`}
              onClick={() => setText(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="dock-separator" />

      {/* 2. Material Selector */}
      <div className="dock-section material-group">
        <span className="dock-label">
          <Layers size={15} className="dock-icon" />
          <span>MATERIAL</span>
        </span>
        <div className="segmented-control">
          {Object.entries(MATERIAL_PRESETS).map(([key, data]) => (
            <button
              key={key}
              type="button"
              className={`seg-btn ${materialKey === key ? 'active' : ''}`}
              onClick={() => setMaterialKey(key)}
              title={data.description}
            >
              {data.name}
            </button>
          ))}
        </div>
      </div>

      <div className="dock-separator" />

      {/* 3. Typography Family Selector */}
      <div className="dock-section font-group">
        <span className="dock-label">
          <Type size={15} className="dock-icon" />
          <span>TYPEFACE</span>
        </span>
        <div className="segmented-control">
          {fonts.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`seg-btn ${fontFamily === f.id ? 'active' : ''}`}
              onClick={() => setFontFamily(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dock-separator" />

      {/* 4. Action Buttons: Theme Toggle & Reset */}
      <div className="dock-section actions-group">
        <button
          type="button"
          onClick={handleThemeToggle}
          className="dock-action-btn theme-toggle-btn"
          title={`Switch to ${themeKey === 'obsidian' ? 'Alabaster Paper' : 'Obsidian Noir'}`}
          aria-label="Toggle visual theme"
        >
          {themeKey === 'obsidian' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="dock-action-btn reset-btn"
          title="Reset to default resting state [R]"
          aria-label="Reset experience"
        >
          <RotateCcw size={15} />
          <span>RESET</span>
          <kbd className="key-hint">R</kbd>
        </button>
      </div>
    </nav>
  );
}
