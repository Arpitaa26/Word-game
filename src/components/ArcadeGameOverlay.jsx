import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeEngine } from '../canvas/ArcadeEngine';
import { ArcadeHUD } from './ArcadeHUD';

export function ArcadeGameOverlay({
  engineRef,
  text,
  setText,
  themeKey,
  onClose,
}) {
  const canvasRef = useRef(null);
  const arcadeEngineRef = useRef(null);

  const [mode, setMode] = useState('blitz');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [comboTimeLeft, setComboTimeLeft] = useState(0);
  const [timer, setTimer] = useState(60.0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [collectedLetters, setCollectedLetters] = useState([]);
  const [lastMilestone, setLastMilestone] = useState(null);
  const [gameSpeed, setGameSpeed] = useState(1.0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new ArcadeEngine(canvasRef.current, {
      themeKey,
      text,
      mode,
      getEngine: () => (engineRef?.current?.getEngine ? engineRef.current.getEngine() : null),
      onScoreUpdate: (newScore, newHighScore) => {
        setScore(newScore);
        setHighScore(newHighScore);
      },
      onComboUpdate: (newCombo, timeLeft) => {
        setCombo(newCombo);
        setComboTimeLeft(timeLeft);
      },
      onSpeedUpdate: (newSpeed) => {
        setGameSpeed(newSpeed);
      },
      onTimerUpdate: (newTimer) => {
        setTimer(newTimer);
      },
      onGameOver: (gameOverState) => {
        setIsGameOver(gameOverState);
      },
      onSpellProgress: (letters) => {
        setCollectedLetters(letters);
      },
      onMilestoneReached: (m) => {
        setLastMilestone(m);
        setTimeout(() => {
          setLastMilestone(null);
        }, 2200);
      },
      onWordComplete: () => {
        setTimeout(() => {
          const PRESETS = ['CREATE', 'ELASTIC', 'KINETIC', 'DODO', 'FORM'];
          const curIdx = PRESETS.indexOf(text);
          const nextWord = PRESETS[(curIdx + 1) % PRESETS.length];
          setText(nextWord);
        }, 1200);
      },
    });

    arcadeEngineRef.current = engine;

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      arcadeEngineRef.current = null;
    };
  }, [engineRef, setText, text, themeKey, mode]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    if (arcadeEngineRef.current) {
      arcadeEngineRef.current.setMode(newMode);
    }
  }, []);

  useEffect(() => {
    if (arcadeEngineRef.current) {
      arcadeEngineRef.current.setText(text);
    }
  }, [text]);

  useEffect(() => {
    if (arcadeEngineRef.current) {
      arcadeEngineRef.current.setTheme(themeKey);
    }
  }, [themeKey]);

  const handleSpawnOrb = useCallback(() => {
    if (arcadeEngineRef.current) {
      arcadeEngineRef.current.spawnOrb();
    }
  }, []);

  const handleRestart = useCallback(() => {
    setGameSpeed(1.0);
    if (arcadeEngineRef.current) {
      arcadeEngineRef.current.resetGame();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleSpawnOrb();
      } else if (e.key.toLowerCase() === 'm') {
        setMode((prev) => (prev === 'blitz' ? 'pinball' : prev === 'pinball' ? 'spell' : 'blitz'));
      } else if (e.key.toLowerCase() === 'r') {
        handleRestart();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpawnOrb, handleRestart, onClose]);

  const wordLetters = (text || 'CREATE').toUpperCase().split('');

  return (
    <div className="arcade-overlay-wrapper">
      <canvas
        ref={canvasRef}
        className="arcade-interactive-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      />

      <ArcadeHUD
        mode={mode}
        setMode={handleModeChange}
        score={score}
        highScore={highScore}
        combo={combo}
        comboTimeLeft={comboTimeLeft}
        gameSpeed={gameSpeed}
        timer={timer}
        isGameOver={isGameOver}
        wordLetters={wordLetters}
        collectedLetters={collectedLetters}
        lastMilestone={lastMilestone}
        onSpawnOrb={handleSpawnOrb}
        onRestart={handleRestart}
        onClose={onClose}
        themeKey={themeKey}
      />
    </div>
  );
}
