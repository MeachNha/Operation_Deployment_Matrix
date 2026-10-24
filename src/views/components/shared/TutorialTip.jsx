import React from 'react';

export const TutorialTip = ({ title, onClick }) => (
  <section className="deployment-guide">
    <button
      type="button"
      className="deployment-guide-trigger"
      aria-haspopup="dialog"
      onClick={onClick}
    >
      <span className="deployment-guide-finger" aria-hidden="true">👆</span>
      <span className="deployment-guide-prompt">
        <strong>{title}</strong>
        <span>Click here to read the tutorial</span>
      </span>
      <span className="deployment-guide-chevron" aria-hidden="true" />
    </button>
  </section>
);
