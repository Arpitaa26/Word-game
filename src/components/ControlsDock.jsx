import React from 'react';

const PRESET_WORDS = ['CREATE', 'ELASTIC', 'KINETIC', 'DODO', 'FORM'];

const MATERIALS = [
  { id: 'silicone', label: 'Silicone' },
  { id: 'fluidInk', label: 'Fluid Gel' },
  { id: 'latexTension', label: 'Tension' },
];

export function ControlsDock({
  text,
  setText,
  materialKey,
  setMaterialKey,
}) {
  return (
    <footer className="minimal-dock" aria-label="Typography controls">
      <div className="instruction-line">
        <span>APPROACH TO ATTRACT</span>
        <span className="instruction-dot">•</span>
        <span>DRAG TO STRETCH</span>
        <span className="instruction-dot">•</span>
        <span>CLICK TO RIPPLE</span>
        <span className="instruction-dot">•</span>
        <span>TYPE TO REMIX</span>
      </div>

      <div className="dock-controls-row">
        <div className="control-group">
          <span className="group-label">WORDS</span>
          <div className="text-options">
            {PRESET_WORDS.map((word) => (
              <button
                key={word}
                type="button"
                className={`text-btn ${text === word ? 'active' : ''}`}
                onClick={() => setText(word)}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span className="group-label">MATERIAL</span>
          <div className="text-options">
            {MATERIALS.map((mat) => (
              <button
                key={mat.id}
                type="button"
                className={`text-btn ${materialKey === mat.id ? 'active' : ''}`}
                onClick={() => setMaterialKey(mat.id)}
              >
                {mat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
