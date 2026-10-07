import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../canvas/sound';

export function EditorialHeader({ stats }) {
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
      </div>

      <div className="header-right">
        {/* Real-time Telemetry Pill */}
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

        {/* Audio Feedback Toggle */}
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
