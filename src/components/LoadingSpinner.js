import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner({ text = '読み込み中', variant = 1 }) {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${variant === 2 ? 'style-2' : variant === 3 ? 'style-3' : ''}`}></div>
      <div className="loading-text">
        {text}
        <span className="loading-dots"></span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
