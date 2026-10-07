import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LivingCanvas } from './components/LivingCanvas';
import { EditorialHeader } from './components/EditorialHeader';
import { ControlsDock } from './components/ControlsDock';
import { InteractionGuide } from './components/InteractionGuide';
import { ArcadeGameOverlay } from './components/ArcadeGameOverlay';
import { FloatingArcadeTrigger } from './components/FloatingArcadeTrigger';
import './styles/living-type.css';

const STORAGE_KEY = 'living_type_arcade_highscore';

export default function App() {
  const [text, setText] = useState('CREATE');
  const [fontFamily, setFontFamily] = useState('Syne');
  const [materialKey, setMaterialKey] = useState('silicone');
  const [themeKey, setThemeKey] = useState('obsidian');
  const [isArcadeMode, setIsArcadeMode] = useState(false);
  const [highScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });
  const [stats, setStats] = useState({
    fps: 60,
    state: 'Resting',
    ripples: 0,
    strain: '0.0',
  });
  const [hasInteracted, setHasInteracted] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeKey);
  }, [themeKey]);

  const handleStatsUpdate = useCallback((newStats) => {
    setStats(newStats);
    if (newStats.state !== 'Resting') {
      setHasInteracted(true);
    }
  }, []);

  const handleReset = useCallback(() => {
    setText('CREATE');
    setMaterialKey('silicone');
    if (canvasRef.current) {
      canvasRef.current.reset();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      if (e.key.toLowerCase() === 'r' && !isArcadeMode) {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, isArcadeMode]);

  return (
    <main className={`app-container ${isArcadeMode ? 'arcade-active' : ''}`} data-theme={themeKey}>
      <LivingCanvas
        ref={canvasRef}
        text={text}
        fontFamily={fontFamily}
        materialKey={materialKey}
        themeKey={themeKey}
        onStatsUpdate={handleStatsUpdate}
      />

      <EditorialHeader
        stats={stats}
        themeKey={themeKey}
        text={text}
        setText={setText}
      />

      {isArcadeMode && (
        <ArcadeGameOverlay
          engineRef={canvasRef}
          text={text}
          setText={setText}
          themeKey={themeKey}
          onClose={() => setIsArcadeMode(false)}
        />
      )}

      {!isArcadeMode && (
        <FloatingArcadeTrigger
          onClick={() => setIsArcadeMode(true)}
          highScore={highScore}
          themeKey={themeKey}
        />
      )}

      {!isArcadeMode && <InteractionGuide hasInteracted={hasInteracted} />}

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
        isArcadeMode={isArcadeMode}
        setIsArcadeMode={setIsArcadeMode}
      />
    </main>
  );
}
