import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LivingCanvas } from './components/LivingCanvas';
import { EditorialHeader } from './components/EditorialHeader';
import { ControlsDock } from './components/ControlsDock';
import { InteractionGuide } from './components/InteractionGuide';
import './styles/living-type.css';

export default function App() {
  const [text, setText] = useState('CREATE');
  const [fontFamily, setFontFamily] = useState('Syne');
  const [materialKey, setMaterialKey] = useState('silicone');
  const [themeKey, setThemeKey] = useState('obsidian');
  const [stats, setStats] = useState({
    fps: 60,
    state: 'Resting',
    ripples: 0,
    strain: '0.0',
  });
  const [hasInteracted, setHasInteracted] = useState(false);

  const canvasRef = useRef(null);

  // Sync theme attribute to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeKey);
  }, [themeKey]);

  // Handle telemetry updates from canvas engine
  const handleStatsUpdate = useCallback((newStats) => {
    setStats(newStats);
    if (newStats.state !== 'Resting') {
      setHasInteracted(true);
    }
  }, []);

  // Reset to default resting state
  const handleReset = useCallback(() => {
    setText('CREATE');
    setMaterialKey('silicone');
    if (canvasRef.current) {
      canvasRef.current.reset();
    }
  }, []);

  // Keyboard shortcut [R] for reset
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      if (e.key.toLowerCase() === 'r') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  return (
    <main className="app-container" data-theme={themeKey}>
      {/* 1. Background WebGL Soft Physical Typography Canvas */}
      <LivingCanvas
        ref={canvasRef}
        text={text}
        fontFamily={fontFamily}
        materialKey={materialKey}
        themeKey={themeKey}
        onStatsUpdate={handleStatsUpdate}
      />

      {/* 2. Top Editorial Header with Custom Typing & Telemetry */}
      <EditorialHeader
        stats={stats}
        themeKey={themeKey}
        text={text}
        setText={setText}
      />

      {/* 4. Subtle Interaction Cues / Guide */}
      <InteractionGuide hasInteracted={hasInteracted} />

      {/* 5. Minimal Bottom Controls Dock */}
      <ControlsDock
        text={text}
        setText={setText}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        materialKey={materialKey}
        setMaterialKey={setMaterialKey}
        themeKey={themeKey}
        setThemeKey={setThemeKey}
        onReset={handleReset}
      />
    </main>
  );
}
