import React, { useEffect, useRef } from 'react';

const TUTORIAL_STEPS = [
  {
    title: 'Create a deployment',
    description:
      'Select + Add Deployment, choose a team, DU, and project, complete the required details, then save.',
  },
  {
    title: 'Find a team or deployment',
    description:
      'Use the filters above the table to narrow the list by team, DU, project, or deployment status.',
  },
  {
    title: 'Manage an active deployment',
    description:
      'Choose Transfer to move a team to another DU or project, End to complete its deployment, or Cancel to cancel it.',
  },
  {
    title: 'Update or restore details',
    description:
      'Choose Edit to update deployment information. Use Undo to remove the current deployment and restore the team’s previous deployment.',
  },
];

export const DeploymentTutorialModal = ({
  isOpen,
  onClose,
  title = 'How to use Team Deployment',
  intro = 'Use this screen to assign teams, track where they are deployed, and manage changes to their assignments.',
  steps = TUTORIAL_STEPS,
  reminder = 'Review the team, DU, project, and dates before saving any changes.',
}) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocusedElement = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal-content tutorial-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header tutorial-modal-header">
          <div>
            <span className="tutorial-modal-eyebrow">QUICK START GUIDE</span>
            <h2 id="tutorial-modal-title">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close"
            aria-label="Close tutorial"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="modal-body tutorial-modal-body">
          <p className="tutorial-intro">
            {intro}
          </p>
          <ol className="tutorial-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="tutorial-step-number">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          {reminder && <div className="tutorial-reminder">{reminder}</div>}
        </div>
      </section>
    </div>
  );
};
