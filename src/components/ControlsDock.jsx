import React from 'react';
import { RotateCcw, Sun, Moon, Type, Layers, Gamepad2 } from 'lucide-react';
import { MATERIAL_PRESETS } from '../canvas/LivingTypeEngine';

const PRESET_WORDS = ['CREATE', 'ELASTIC', 'KINETIC', 'DODO', 'FORM'];

const SHORT_MATERIAL_NAMES = {
  chrome: 'Chrome',
  silicone: 'Silicone',
  jelly: 'Jelly',
  foam: 'Foam',
};

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
  isArcadeMode,
  setIsArcadeMode,
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
              <span className="seg-label-full">{data.name}</span>
              <span className="seg-label-short">{SHORT_MATERIAL_NAMES[key] || data.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dock-separator" />

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

      <div className="dock-section actions-group">
        <button
          type="button"
          onClick={() => setIsArcadeMode((prev) => !prev)}
          className={`dock-action-btn arcade-dock-btn ${isArcadeMode ? 'active' : ''}`}
          title={isArcadeMode ? 'Exit Arcade Game' : 'Play Kinetic Arcade Game'}
          aria-label="Toggle arcade game"
        >
          <Gamepad2 size={15} />
          <span>{isArcadeMode ? 'ARCADE ON' : 'PLAY'}</span>
        </button>

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
