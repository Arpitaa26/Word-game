import React from 'react';

export function EditorialHeader({ onReset }) {
  return (
    <header className="editorial-header">
      <div className="brand-group">
        <h1 className="project-title">LIVING TYPE</h1>
        <p className="project-subtitle">An experiment in physical typography.</p>
      </div>
      <button
        type="button"
        className="reset-text-btn"
        onClick={onReset}
        title="Reset to default resting state [Shift+R]"
        aria-label="Reset experience"
      >
        RESET
      </button>
    </header>
  );
}
