import React from 'react';

export function InteractionGuide({ hasInteracted }) {
  return (
    <footer className={`interaction-guide ${hasInteracted ? 'dimmed' : ''}`}>
      <span className="guide-text">
        Pull letters to stretch & recoil · Click canvas for shockwave · Sweep to wake · Type to remix
      </span>
    </footer>
  );
}
