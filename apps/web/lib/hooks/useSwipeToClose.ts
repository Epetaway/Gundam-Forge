/**
 * Custom hook for detecting downward swipes and triggering a close callback
 * Used for mobile-friendly modal dismissal
 */
import { useEffect, useRef } from 'react';

interface SwipeConfig {
  threshold?: number; // minimum swipe distance in pixels (default: 50)
  onClose: () => void;
}

export function useSwipeToClose(containerRef: React.RefObject<HTMLElement>, config: SwipeConfig) {
  const { threshold = 50, onClose } = config;
  const touchStartYRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0]?.clientY ?? 0;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0]?.clientY ?? 0;
      const swipeDistance = touchEndY - touchStartYRef.current;

      // Detect downward swipe with enough distance
      if (swipeDistance > threshold) {
        // Check if we're at or near the top of the scroll container
        const scrollContainer = container.querySelector('[role="dialog"]') || container;
        const isAtTop = scrollContainer.scrollTop === 0;

        if (isAtTop) {
          onClose();
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose, threshold, containerRef]);
}
