'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Zap, Wrench, Swords } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const WELCOME_STORAGE_KEY = 'gundam-forge.hasSeenWelcome';

interface WelcomeStep {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
}

const WELCOME_STEPS: WelcomeStep[] = [
  {
    number: 1,
    title: 'Browse Cards',
    description: 'Explore 600+ official Gundam Card Game cards with full-text search and filtering.',
    icon: <Zap className="h-12 w-12 text-cobalt-400" />,
    highlights: [
      'Full-text search across card database',
      'Filter by type, color, cost, and keywords',
      'Reference official card rulings and text',
    ],
  },
  {
    number: 2,
    title: 'Build Decks',
    description: 'Create legal decks with real-time validation and synergy scoring in the Forge.',
    icon: <Wrench className="h-12 w-12 text-cobalt-400" />,
    highlights: [
      'Real-time deck validation',
      'Synergy scoring for mechanics',
      'Import/export deck lists',
      'Multiple view modes (list, stacks, grid)',
    ],
  },
  {
    number: 3,
    title: 'Test & Share',
    description: 'Playtest against AI using official GCG rules and share your deck with the community.',
    icon: <Swords className="h-12 w-12 text-cobalt-400" />,
    highlights: [
      'Playtest with full phase sequencing',
      'Official GCG ruleset enforcement',
      'Share decks with tournament-ready metadata',
      'Track deck performance and meta',
    ],
  },
];

export function WelcomeModal(): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen welcome modal before
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < WELCOME_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  if (!isVisible) return null;

  const step = WELCOME_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl overflow-hidden">
        <div className="relative bg-gradient-to-br from-cobalt-900/40 to-cobalt-800/40 p-8 sm:p-12">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-text-subtle hover:text-foreground transition-colors"
            aria-label="Close welcome modal"
          >
            <span className="text-2xl">&times;</span>
          </button>

          {/* Step indicator */}
          <div className="mb-6 flex justify-center gap-2">
            {WELCOME_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-cobalt-400' : 'bg-steel-600'
                }`}
                aria-label={`Step ${index + 1}`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">{step.icon}</div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {step.title}
            </h2>
            <p className="text-lg text-text-secondary mb-6">{step.description}</p>

            {/* Highlights */}
            <ul className="space-y-2 text-sm text-text-secondary">
              {step.highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-center justify-center gap-2">
                  <ChevronRight className="h-4 w-4 text-cobalt-400" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Skip
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              className="w-full sm:w-auto"
            >
              {currentStep === WELCOME_STEPS.length - 1 ? (
                <>
                  Get Started
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Step counter */}
          <div className="mt-6 text-center text-xs text-text-muted">
            Step {currentStep + 1} of {WELCOME_STEPS.length}
          </div>
        </div>
      </Card>
    </div>
  );
}
