import React, { useState } from 'react';
import { Volume2, VolumeX, Type, X } from 'lucide-react';
import { soundEngine } from '../canvas/sound';

export function EditorialHeader({ stats, text, setText }) {
  const [soundEnabled, setSoundEnabled] = useState(false);

  const handleToggleSound = () => {
    const isNowOn = soundEngine.toggle();
    setSoundEnabled(isNowOn);
  };

  const handleTextChange = (e) => {
    const nextVal = e.target.value.toUpperCase().slice(0, 16);
    setText(nextVal);
    if (nextVal.length > text.length) {
      const addedChar = nextVal[nextVal.length - 1];
      soundEngine.playPianoKeyForChar(addedChar, 1);
    }
  };

  return (
    <header className="editorial-header">
      <div className="header-left">
        <div className="brand-group">
          <span className="live-indicator" />
          <h1 className="project-title">LIVING TYPE</h1>
        </div>
      </div>

      <div className="header-center">
        <div className="header-typing-bar">
          <Type size={16} className="typing-bar-icon" />
          <span className="typing-bar-label">TYPE YOUR WORD</span>
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="ENTER WORD..."
            className="header-typing-input"
            maxLength={14}
            autoComplete="off"
            spellCheck="false"
          />
          {text && text !== 'CREATE' && (
            <button
              type="button"
              onClick={() => setText('CREATE')}
              className="typing-reset-btn"
              title="Reset text to CREATE"
              aria-label="Reset text to CREATE"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="telemetry-pill">
          <div className="telemetry-item">
            <span className="telemetry-label">STATE</span>
            <span className="telemetry-val highlight">{stats?.state || 'Resting'}</span>
          </div>
          <div className="telemetry-divider" />
          <div className="telemetry-item">
            <span className="telemetry-label">STRAIN</span>
            <span className="telemetry-val">{stats?.strain || '0.0'}%</span>
          </div>
          <div className="telemetry-divider" />
          <div className="telemetry-item">
            <span className="telemetry-label">FPS</span>
            <span className="telemetry-val">{stats?.fps || 60}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleSound}
          className={`icon-btn ${soundEnabled ? 'active' : ''}`}
          title={soundEnabled ? 'Mute micro-acoustic feedback' : 'Enable physical sound feedback'}
          aria-label="Toggle sound feedback"
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>
    </header>
  );
}
