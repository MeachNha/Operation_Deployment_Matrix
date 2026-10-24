import React, { useCallback, useState } from 'react';
import { DeploymentTutorialModal } from '../deployment/DeploymentTutorialModal';
import { TutorialTip } from './TutorialTip';

export const ScreenTutorial = ({
  tipTitle,
  title,
  intro,
  steps,
  reminder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTutorial = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <TutorialTip title={tipTitle} onClick={() => setIsOpen(true)} />
      <DeploymentTutorialModal
        isOpen={isOpen}
        onClose={closeTutorial}
        title={title}
        intro={intro}
        steps={steps}
        reminder={reminder}
      />
    </>
  );
};
