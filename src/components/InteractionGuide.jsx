import React from 'react';

export function InteractionGuide({ hasInteracted }) {
  return (
    <footer className={`interaction-guide ${hasInteracted ? 'dimmed' : ''}`}>
      <div className="guide-item">
        <span className="guide-dot" />
        <span>APPROACH TO ATTRACT</span>
      </div>
      <div className="guide-divider">·</div>
      <div className="guide-item">
        <span className="guide-dot" />
        <span>DRAG TO STRETCH & RELEASE</span>
      </div>
      <div className="guide-divider">·</div>
      <div className="guide-item">
        <span className="guide-dot" />
        <span>CLICK / TAP FOR RIPPLE</span>
      </div>
      <div className="guide-divider">·</div>
      <div className="guide-item">
        <span className="guide-dot" />
        <span>TYPE TO REMIX</span>
      </div>
    </footer>
  );
}
