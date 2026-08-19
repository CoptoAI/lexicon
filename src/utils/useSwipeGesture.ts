import { useState, useRef, useEffect, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  maxAxisDrift?: number;
  enableVerticalDrag?: boolean;
}

export interface SwipeGestureState {
  dragOffset: number;
  isDragging: boolean;
}

/**
 * Custom React hook for touch drag and swipe gestures on mobile.
 * Ideal for bottom sheets (drag-down to dismiss) and swipeable cards (swipe right to bookmark/save).
 */
export function useSwipeGesture({
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  maxAxisDrift = 120,
  enableVerticalDrag = false
}: SwipeGestureOptions) {
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const startCoords = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const currentOffset = useRef<number>(0);

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startCoords.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    currentOffset.current = 0;
    if (enableVerticalDrag) {
      setIsDragging(true);
    }
  }, [enableVerticalDrag]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - startCoords.current.y;
    const deltaX = touch.clientX - startCoords.current.x;

    if (enableVerticalDrag) {
      // Only drag downward (deltaY > 0) with a little resistance if dragged up
      if (deltaY > 0) {
        currentOffset.current = deltaY;
        setDragOffset(deltaY);
      } else {
        const resistant = deltaY * 0.2;
        currentOffset.current = resistant;
        setDragOffset(resistant);
      }
    }
  }, [enableVerticalDrag]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - startCoords.current.x;
    const deltaY = touch.clientY - startCoords.current.y;
    const duration = Date.now() - startCoords.current.time;
    const velocityY = deltaY / Math.max(duration, 1);
    const velocityX = deltaX / Math.max(duration, 1);

    if (enableVerticalDrag) {
      setIsDragging(false);
      setDragOffset(0);
      currentOffset.current = 0;

      // Downward swipe or drag past threshold
      if ((deltaY > threshold || (deltaY > 40 && velocityY > 0.4)) && Math.abs(deltaX) < maxAxisDrift) {
        triggerHaptic(15);
        if (onSwipeDown) {
          onSwipeDown();
        }
        return;
      }
    } else {
      // Horizontal swipes (e.g. for flashcard or card actions)
      if (Math.abs(deltaY) < maxAxisDrift) {
        if (deltaX > threshold || (deltaX > 40 && velocityX > 0.3)) {
          triggerHaptic(12);
          if (onSwipeRight) onSwipeRight();
        } else if (deltaX < -threshold || (deltaX < -40 && velocityX < -0.3)) {
          triggerHaptic(12);
          if (onSwipeLeft) onSwipeLeft();
        }
      }
    }
  }, [enableVerticalDrag, threshold, maxAxisDrift, onSwipeDown, onSwipeLeft, onSwipeRight]);

  return {
    dragOffset,
    isDragging,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}
