import React from 'react';
import { Gamepad2, Sparkles, Trophy } from 'lucide-react';
import { soundEngine } from '../canvas/sound';

export function FloatingArcadeTrigger({ onClick, highScore, themeKey }) {
  const handleClick = () => {
    if (!soundEngine.enabled) {
      soundEngine.toggle();
    }
    soundEngine.playPianoNote(659.25, 0.8, 1.5);
    onClick();
  };

  return (
    <div className="floating-arcade-trigger-container" data-theme={themeKey}>
      <button
        type="button"
        className="floating-arcade-card-btn"
        onClick={handleClick}
        title="Start Kinetic Typography Arcade Game"
        aria-label="Start Kinetic Typography Arcade Game"
      >
        <div className="trigger-aura-ring" />
        <div className="trigger-shimmer" />

        <div className="trigger-content">
          <div className="trigger-icon-box">
            <Gamepad2 size={18} className="trigger-gamepad-icon" />
            <span className="trigger-badge-dot" />
          </div>

          <div className="trigger-text-group">
            <div className="trigger-title-row">
              <span className="trigger-main-title">PLAY ARCADE</span>
              <span className="trigger-curiosity-pill">
                <span className="curiosity-pill-full">CAN YOU HIT 500?</span>
                <span className="curiosity-pill-short">500 PTS?</span>
              </span>
            </div>
            <div className="trigger-subtitle-row">
              <Sparkles size={11} className="trigger-mini-icon" />
              <span className="trigger-subtext">Dino-style kinetic letter bounce</span>
              {highScore > 0 && (
                <span className="trigger-high-score">
                  <Trophy size={10} /> {highScore.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
