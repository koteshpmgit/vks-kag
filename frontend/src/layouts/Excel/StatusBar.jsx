import React from 'react';

export default function StatusBar({ status }) {
  return (
    <div id="statusbar">
      <span id="statusMsg">{status}</span>
      <span id="statusRight">NUM</span>
    </div>
  );
}
