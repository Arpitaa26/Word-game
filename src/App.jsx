import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LivingCanvas } from './components/LivingCanvas';
import { EditorialHeader } from './components/EditorialHeader';
import { ControlsDock } from './components/ControlsDock';
import { soundEngine } from './canvas/sound';
import './styles/living-type.css';

export default function App() {
  const [text, setText] = useState('CREATE');
  const [materialKey, setMaterialKey] = useState('silicone');
  const [soundEnabled, setSoundEnabled] = useState(false);

  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const prevTextRef = useRef('CREATE');

  const handleReset = useCallback(() => {
    setText('CREATE');
    setMaterialKey('silicone');
    prevTextRef.current = 'CREATE';
    if (canvasRef.current) {
      canvasRef.current.reset();
    }
  }, []);

  const handleTextChange = useCallback((nextVal) => {
    setText(nextVal);
    if (soundEnabled && nextVal.length > prevTextRef.current.length) {
      const addedChar = nextVal[nextVal.length - 1];
      soundEngine.playPianoKeyForChar(addedChar);
    }
    prevTextRef.current = nextVal;
  }, [soundEnabled]);

  const handleSelectWord = useCallback((newWord) => {
    setText(newWord);
    prevTextRef.current = newWord;
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

  const handleToggleSound = useCallback(() => {
    const nextState = soundEngine.toggle();
    setSoundEnabled(nextState);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement === inputRef.current) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === 'r' && (e.shiftKey || e.key === 'Escape')) {
        handleReset();
        return;
      }

      if (e.key.length === 1 && /^[a-zA-Z0-9]$/.test(e.key) && inputRef.current) {
        inputRef.current.focus();
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

      <EditorialHeader
        text={text}
        onTextChange={handleTextChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onReset={handleReset}
        inputRef={inputRef}
      />

      <ControlsDock
        text={text}
        setText={handleSelectWord}
        materialKey={materialKey}
        setMaterialKey={handleSelectMaterial}
      />
    </main>
  );
}
