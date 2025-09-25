import React, { useState } from 'react';
import { Modal, Button } from './ui';

const OnboardingGuide: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to DriveTheory Pro!",
      content: "Let's take a quick tour of the features that will help you ace your theory test.",
    },
    {
      title: "Your Dashboard",
      content: "This is your main hub. You can start challenges, track your progress, and see how you rank on the leaderboards.",
    },
    {
      title: "The Study Hub",
      content: "Ready to dive deeper? The Study Hub is where you'll find topic tests, road sign libraries, hazard perception clips, and more.",
    },
    {
      title: "Ready to Start?",
      content: "You're all set! Practice consistently, challenge your friends, and you'll be on the road in no time. Good luck!",
    },
  ];

  const currentStep = steps[step];

  return (
    <Modal title={currentStep.title} onClose={() => {}} size="lg">
      <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
        {currentStep.content}
      </p>
      <div className="mt-6 flex justify-between items-center">
        <div className="flex gap-2">
            {steps.map((_, index) => (
                <div key={index} className={`h-2 w-2 rounded-full transition-colors ${index === step ? 'bg-teal-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
            ))}
        </div>
        <div>
            {step < steps.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)}>Next</Button>
            ) : (
                <Button onClick={onComplete}>Get Started!</Button>
            )}
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingGuide;