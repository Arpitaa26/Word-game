import React from 'react';

export function EditorialCorners() {
  return (
    <div className="editorial-corners" aria-hidden="true">
      {/* Top Left corner mark */}
      <div className="corner-mark top-left">
        <span className="crosshair">+</span>
        <span className="corner-text">SYS.01 // ELASTOMER</span>
      </div>

      {/* Top Right corner mark */}
      <div className="corner-mark top-right">
        <span className="corner-text">60 FPS // BUFFER</span>
        <span className="crosshair">+</span>
      </div>

      {/* Bottom Left corner mark */}
      <div className="corner-mark bottom-left">
        <span className="crosshair">+</span>
        <span className="corner-text">FIGMA REF // NODE-3:1414</span>
      </div>

      {/* Bottom Right corner mark */}
      <div className="corner-mark bottom-right">
        <span className="corner-text">DODO PAYMENTS // DESIGN ENG</span>
        <span className="crosshair">+</span>
      </div>
    </div>
  );
}
