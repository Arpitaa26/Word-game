import React from 'react';
import { Target, Zap, Type, RotateCcw, X, Plus, Trophy, Flame, Sparkles } from 'lucide-react';

const MILESTONES = [500, 1000, 1500, 2000, 3000, 5000, 10000];

export function ArcadeHUD({
  mode,
  setMode,
  score,
  highScore,
  combo,
  comboTimeLeft,
  gameSpeed = 1.0,
  timer,
  isGameOver,
  wordLetters,
  collectedLetters,
  lastMilestone,
  onSpawnOrb,
  onRestart,
  onClose,
  themeKey,
}) {
  const modes = [
    { id: 'blitz', label: 'TARGET BLITZ', icon: Target },
    { id: 'pinball', label: 'JELLY PINBALL', icon: Zap },
    { id: 'spell', label: 'WORD SPELL', icon: Type },
  ];

  const nextMilestone = MILESTONES.find((m) => m > score) || 10000;
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= score) || 0;
  const progressRatio = Math.min(
    Math.max((score - prevMilestone) / (nextMilestone - prevMilestone), 0),
    1
  );

  const formattedScore = score.toString().padStart(5, '0');
  const formattedHighScore = highScore.toString().padStart(5, '0');

  return (
    <div className="arcade-hud-root" data-theme={themeKey}>
      <div className="arcade-top-bar">
        <div className="arcade-modes-dock">
          {modes.map((m) => {
            const IconComponent = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`arcade-mode-tab ${isActive ? 'active' : ''}`}
                onClick={() => setMode(m.id)}
                title={`Switch to ${m.label}`}
              >
                <IconComponent size={13} className="tab-icon" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="arcade-center-stats">
          {mode === 'blitz' && (
            <div className={`blitz-timer-pill ${timer <= 10 ? 'urgent' : ''}`}>
              <span className="timer-label">TIME</span>
              <span className="timer-val">{Math.max(timer, 0).toFixed(1)}s</span>
            </div>
          )}

          {mode === 'spell' && (
            <div className="spell-tracker-pill">
              <span className="spell-label">SPELL:</span>
              <div className="spell-letters-row">
                {wordLetters.map((char, idx) => {
                  const isCollected = collectedLetters.includes(idx);
                  return (
                    <span
                      key={idx}
                      className={`spell-char-box ${isCollected ? 'collected' : ''}`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'pinball' && (
            <div className="pinball-tag-pill">
              <Zap size={13} />
              <span>ENDLESS ELASTIC PHYSICS</span>
            </div>
          )}
        </div>

        <div className="arcade-right-stats">
          <div
            className={`arcade-speed-pill ${gameSpeed >= 1.2 ? 'accelerated' : ''} ${gameSpeed >= 1.6 ? 'hyper' : ''}`}
            title={`Speed: ${gameSpeed.toFixed(1)}x`}
          >
            <Zap size={11} className="speed-icon" />
            <span className="speed-val">{gameSpeed.toFixed(1)}x SPEED</span>
          </div>

          <div className={`combo-pill ${combo > 1 ? 'active' : ''}`}>
            <Flame size={13} className="combo-icon" />
            <span className="combo-text">
              {combo > 1 ? `${combo}x` : '1x'}
            </span>
            {combo > 1 && (
              <div
                className="combo-progress-bar"
                style={{ width: `${Math.max(comboTimeLeft * 100, 0)}%` }}
              />
            )}
          </div>

          <div className="dino-score-box">
            <div className="dino-high-row">
              <Trophy size={11} className="dino-trophy" />
              <span className="dino-label">HI</span>
              <span className="dino-digits">{formattedHighScore}</span>
            </div>
            <div className="dino-current-row">
              <span className="dino-score-digits">{formattedScore}</span>
            </div>
          </div>

          <button
            type="button"
            className="arcade-close-btn"
            onClick={onClose}
            title="Exit Arcade Mode [Esc]"
            aria-label="Exit Arcade Mode"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="milestone-progress-bar-container">
        <div className="milestone-label-row">
          <span className="milestone-target-text">
            NEXT GOAL: <strong>{nextMilestone.toLocaleString()} PTS</strong> (CONFETTI)
          </span>
          <span className="milestone-pts-ratio">
            {score.toLocaleString()} / {nextMilestone.toLocaleString()}
          </span>
        </div>
        <div className="milestone-track">
          <div
            className="milestone-fill"
            style={{ width: `${Math.round(progressRatio * 100)}%` }}
          />
        </div>
      </div>

      {lastMilestone && (
        <div className="celebration-toast-banner">
          <div className="celebration-toast-content">
            <Sparkles size={18} className="celebration-sparkle left" />
            <div className="celebration-text-group">
              <span className="celebration-badge">MILESTONE UNLOCKED</span>
              <span className="celebration-main-title">
                {lastMilestone.toLocaleString()} POINTS REACHED
              </span>
            </div>
            <Sparkles size={18} className="celebration-sparkle right" />
          </div>
        </div>
      )}

      <div className="arcade-bottom-bar">
        <div className="arcade-hints">
          <span className="hint-item">
            <kbd className="arcade-kbd">DRAG</kbd> AIM SLINGSHOT
          </span>
          <span className="hint-dot">·</span>
          <span className="hint-item">
            <kbd className="arcade-kbd">TAP</kbd> SHOCKWAVE BLAST
          </span>
          <span className="hint-dot">·</span>
          <span className="hint-item">
            <kbd className="arcade-kbd">SPACE</kbd> DROP ORB
          </span>
        </div>

        <div className="arcade-actions-group">
          <button
            type="button"
            className="arcade-action-btn spawn-btn"
            onClick={onSpawnOrb}
            title="Spawn Bouncy Orb [Space]"
          >
            <Plus size={14} />
            <span>DROP ORB</span>
          </button>

          <button
            type="button"
            className="arcade-action-btn reset-game-btn"
            onClick={onRestart}
            title="Restart Run [R]"
          >
            <RotateCcw size={13} />
            <span>RESTART</span>
          </button>
        </div>
      </div>

      {isGameOver && (
        <div className="arcade-modal-backdrop">
          <div className="arcade-modal-card">
            <div className="modal-badge">TIME UP</div>
            <h2 className="modal-title">RUN COMPLETE</h2>
            
            <div className="modal-scores-row">
              <div className="modal-score-col">
                <span className="col-label">FINAL SCORE</span>
                <span className="col-val">{score.toLocaleString()}</span>
              </div>
              <div className="modal-score-col">
                <span className="col-label">BEST RUN</span>
                <span className="col-val highlight">{highScore.toLocaleString()}</span>
              </div>
            </div>

            {score >= highScore && score > 0 && (
              <div className="new-record-pill">
                <Trophy size={14} />
                <span>NEW HIGH SCORE ACHIEVED!</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn primary"
                onClick={onRestart}
              >
                <RotateCcw size={15} />
                <span>PLAY AGAIN</span>
              </button>
              <button
                type="button"
                className="modal-btn secondary"
                onClick={onClose}
              >
                <span>RETURN TO GALLERY</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
