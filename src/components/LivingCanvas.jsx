import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { LivingTypeEngine } from '../canvas/LivingTypeEngine';

export const LivingCanvas = forwardRef(function LivingCanvas(
  {
    text,
    fontFamily,
    materialKey,
    themeKey,
    onStatsUpdate,
  },
  ref
) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const initialOptionsRef = useRef({
    text,
    fontFamily,
    materialKey,
    themeKey,
    onStatsUpdate,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const engine = new LivingTypeEngine(canvasRef.current, initialOptionsRef.current);
      engineRef.current = engine;
    } catch (err) {
      console.error('[LivingCanvas] Engine init error:', err);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Sync props changes dynamically
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setText(text);
    }
  }, [text]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setFontFamily(fontFamily);
    }
  }, [fontFamily]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMaterial(materialKey);
    }
  }, [materialKey]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTheme(themeKey);
    }
  }, [themeKey]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (engineRef.current) {
        engineRef.current.reset();
      }
    },
    triggerRipple: (x, y) => {
      if (engineRef.current) {
        engineRef.current.triggerRipple(x, y);
      }
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="living-canvas"
      style={{
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        touchAction: 'none',
      }}
    />
  );
});
