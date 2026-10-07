import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LivingCanvas } from './components/LivingCanvas';
import { EditorialHeader } from './components/EditorialHeader';
import { ControlsDock } from './components/ControlsDock';
import './styles/living-type.css';

const PRESET_WORDS = ['CREATE', 'ELASTIC', 'KINETIC', 'DODO', 'FORM'];

export default function App() {
  const [text, setText] = useState('CREATE');
  const [materialKey, setMaterialKey] = useState('silicone');
  const canvasRef = useRef(null);

  const handleReset = useCallback(() => {
    setText('CREATE');
    setMaterialKey('silicone');
    if (canvasRef.current) {
      canvasRef.current.reset();
    }
  }, []);

  const handleSelectWord = useCallback((newWord) => {
    setText(newWord);
    if (canvasRef.current) {
      canvasRef.current.triggerRipple(0.5, 0.5);
    }
  }, []);

  const handleSelectMaterial = useCallback((key) => {
    setMaterialKey(key);
    if (canvasRef.current) {
      canvasRef.current.triggerRipple(0.5, 0.5);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        setText((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
        if (canvasRef.current) {
          canvasRef.current.triggerRipple(0.5, 0.5);
        }
        return;
      }

      if (e.key.toLowerCase() === 'r' && (e.shiftKey || e.key === 'Escape')) {
        handleReset();
        return;
      }

      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        const char = e.key.toUpperCase();
        setText((prev) => {
          if (PRESET_WORDS.includes(prev)) {
            return char;
          }
          return prev.length >= 12 ? prev.slice(1) + char : prev + char;
        });
        if (canvasRef.current) {
          canvasRef.current.triggerRipple(0.5, 0.5);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  return (
    <main className="app-container" data-theme="obsidian">
      <LivingCanvas
        ref={canvasRef}
        text={text}
        fontFamily="Syne"
        materialKey={materialKey}
        themeKey="obsidian"
      />

      <EditorialHeader onReset={handleReset} />

      <ControlsDock
        text={text}
        setText={handleSelectWord}
        materialKey={materialKey}
        setMaterialKey={handleSelectMaterial}
      />
    </main>
  );
}
