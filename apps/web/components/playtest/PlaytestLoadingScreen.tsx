/**
 * PlaytestLoadingScreen Component
 * Shows progress during deck validation, setup, and game initialization
 */

'use client';

import React, { useEffect, useState } from 'react';

export interface LoadingScreenProps {
  isVisible: boolean;
  title: string;
  message: string;
  progress: number; // 0-100
  substeps?: {
    name: string;
    complete: boolean;
  }[];
  autoHideDelay?: number; // Auto-hide after N ms (0 = never)
}

const PlaytestLoadingScreen: React.FC<LoadingScreenProps> = ({
  isVisible,
  title,
  message,
  progress,
  substeps = [],
  autoHideDelay = 0,
}) => {
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsHiding(false);
      return;
    }

    // Auto-hide after delay if specified
    if (autoHideDelay > 0 && progress === 100) {
      const timer = setTimeout(() => {
        setIsHiding(true);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, progress, autoHideDelay]);

  if (!isVisible || isHiding) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{title}</h2>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">{progress}%</p>
        </div>

        {/* Message */}
        <p className="text-gray-700 text-center mb-6 text-sm min-h-12">{message}</p>

        {/* Substeps */}
        {substeps.length > 0 && (
          <div className="mb-6 space-y-2">
            {substeps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.complete
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                >
                  {step.complete && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    step.complete
                      ? 'text-green-600 line-through'
                      : 'text-gray-600'
                  }`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="animate-spin">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaytestLoadingScreen;

/**
 * Hook for managing loading screen state
 */
export function usePlaytestLoading() {
  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState('Loading');
  const [message, setMessage] = useState('Please wait...');
  const [progress, setProgress] = useState(0);
  const [substeps, setSubsteps] = useState<{ name: string; complete: boolean }[]>([]);

  const startLoading = (
    initialTitle: string,
    initialMessage: string,
    steps: string[] = [],
  ) => {
    setIsVisible(true);
    setTitle(initialTitle);
    setMessage(initialMessage);
    setProgress(0);
    setSubsteps(steps.map((step) => ({ name: step, complete: false })));
  };

  const updateProgress = (percent: number, msg?: string) => {
    setProgress(Math.min(percent, 100));
    if (msg) setMessage(msg);
  };

  const completeStep = (stepIndex: number) => {
    setSubsteps((prev) => {
      const updated = [...prev];
      if (updated[stepIndex]) {
        updated[stepIndex].complete = true;
      }
      return updated;
    });
  };

  const finishLoading = (finalMessage: string = 'Complete!') => {
    setProgress(100);
    setMessage(finalMessage);
    // Auto-hide after 1 second
    setTimeout(() => setIsVisible(false), 1000);
  };

  const stopLoading = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    title,
    message,
    progress,
    substeps,
    startLoading,
    updateProgress,
    completeStep,
    finishLoading,
    stopLoading,
  };
}
