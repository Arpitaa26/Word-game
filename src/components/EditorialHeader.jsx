import React, { useState } from 'react';
import { Volume2, VolumeX, Waves, Sparkles } from 'lucide-react';
import { soundEngine } from '../canvas/sound';

export function EditorialHeader({ stats, onTriggerWave, onJiggle }) {
  const [soundEnabled, setSoundEnabled] = useState(false);

  const handleToggleSound = () => {
    const isNowOn = soundEngine.toggle();
    setSoundEnabled(isNowOn);
  };

  return (
    <header className="editorial-header">
      <div className="header-left">
        <div className="brand-group">
          <span className="live-indicator" />
          <h1 className="project-title">LIVING TYPE</h1>
        </div>
        <p className="project-subtitle">
          Interactive Soft Physical Typography
        </p>
      </div>

      <div className="header-right">
        {/* Dynamic Status Indicator */}
        <div className="status-badge" title="Current physical state">
          <span className="status-dot" />
          <span className="status-text">{stats?.state || 'Resting'}</span>
        </div>

        {/* Quick Interactive Triggers */}
        <div className="header-actions">
          <button
            type="button"
            onClick={onTriggerWave}
            className="action-pill-btn"
            title="Send an acoustic kinetic wave across the letters"
          >
            <Waves size={13} />
            <span>Wave</span>
          </button>

          <button
            type="button"
            onClick={onJiggle}
            className="action-pill-btn"
            title="Jiggle letters with elastic impulse"
          >
            <Sparkles size={13} />
            <span>Jiggle</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`icon-btn ${soundEnabled ? 'active' : ''}`}
            title={soundEnabled ? 'Mute physical sound' : 'Enable physical acoustic feedback'}
            aria-label="Toggle sound feedback"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}
