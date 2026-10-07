import React from 'react';

export function EditorialHeader({
  text,
  onTextChange,
  soundEnabled,
  onToggleSound,
  onReset,
  inputRef,
}) {
  const handleChange = (e) => {
    const nextVal = e.target.value.toUpperCase().slice(0, 14);
    onTextChange(nextVal);
  };

  return (
    <header className="editorial-header">
      <div className="brand-group">
        <h1 className="project-title">LIVING TYPE</h1>
        <p className="project-subtitle">An experiment in physical typography.</p>
      </div>

      <div className="header-input-container">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="TYPE SOMETHING"
          maxLength={14}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="editorial-word-input"
          aria-label="Editable custom typography word"
        />
      </div>

      <div className="header-actions">
        <button
          type="button"
          className={`header-text-btn ${soundEnabled ? 'active' : ''}`}
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute acoustic piano feedback' : 'Enable acoustic piano feedback'}
          aria-label="Toggle acoustic sound"
        >
          {soundEnabled ? 'SOUND ON' : 'SOUND OFF'}
        </button>
        <span className="action-sep">•</span>
        <button
          type="button"
          className="header-text-btn reset-text-btn"
          onClick={onReset}
          title="Reset to default resting state [Shift+R]"
          aria-label="Reset experience"
        >
          RESET
        </button>
      </div>
    </header>
  );
}
