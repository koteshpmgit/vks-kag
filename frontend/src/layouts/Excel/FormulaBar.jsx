import React from 'react';

export default function FormulaBar({ cellRef = 'A1', cellValue = '' }) {
  return (
    <div id="formulabar">
      <span className="cellref" id="cellRef">{cellRef}</span>
      <span>&#402;x</span>
      <span id="cellValue">{cellValue}</span>
    </div>
  );
}
