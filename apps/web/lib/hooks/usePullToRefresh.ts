/**
 * Custom hook for pull-to-refresh gesture detection
 * Triggers a refresh callback when user pulls down from the top
 */
import { useEffect, useRef } from 'react';

interface PullToRefreshConfig {
  threshold?: number; // minimum pull distance in pixels (default: 80)
  onRefresh: () => Promise<void>;
}

export function usePullToRefresh(containerRef: React.RefObject<HTMLElement>, config: PullToRefreshConfig) {
  const { threshold = 80, onRefresh } = config;
  const touchStartYRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull-to-refresh if we're at the very top of the scroll container
      if (container.scrollTop === 0) {
        touchStartYRef.current = e.touches[0]?.clientY ?? 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Allow native pull-to-refresh behavior on iOS by allowing default
      // We just track position for fallback refresh indicator
      if (container.scrollTop === 0 && touchStartYRef.current > 0) {
        const currentY = e.touches[0]?.clientY ?? 0;
        const pullDistance = currentY - touchStartYRef.current;
        
        // Dispatch custom event for UI indication (if needed)
        if (pullDistance > threshold && !isRefreshingRef.current) {
          container.dispatchEvent(
            new CustomEvent('pulltorefresh:trigger', {
              detail: { pullDistance },
            })
          );
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;

      const touchEndY = e.changedTouches[0]?.clientY ?? 0;
      const pullDistance = touchEndY - touchStartYRef.current;

      if (pullDistance > threshold && container.scrollTop === 0) {
        isRefreshingRef.current = true;
        onRefresh()
          .finally(() => {
            isRefreshingRef.current = false;
            touchStartYRef.current = 0;
          });
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, containerRef]);
}
