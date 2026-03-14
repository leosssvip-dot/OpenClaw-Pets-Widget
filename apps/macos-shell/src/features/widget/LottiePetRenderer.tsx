/**
 * LottiePetRenderer — renders a pet character using per-state Lottie JSON files.
 *
 * Each animation state (idle / working / offline) has its own .json file.
 * When the state changes, the component switches to the corresponding animation.
 * Falls back gracefully if the Lottie file fails to load.
 */

import { useEffect, useRef, useState } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import type { LottieAssetSet, LottieAnimationState } from './pet-engine';
import { activityToLottieState } from './pet-engine';
import type { PetAnimationActivity } from './pet-animation-state';

interface LottiePetRendererProps {
  assets: LottieAssetSet;
  activity: PetAnimationActivity;
  onStrike?: () => void;
  onLoadError?: () => void;
  className?: string;
}

export function LottiePetRenderer({
  assets,
  activity,
  onStrike,
  onLoadError,
  className = '',
}: LottiePetRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const currentStateRef = useRef<LottieAnimationState | null>(null);
  const [failed, setFailed] = useState(false);

  const lottieState = activityToLottieState(activity);
  const src = assets[lottieState];

  useEffect(() => {
    if (!containerRef.current || failed) return;

    // Skip if already playing the same state
    if (currentStateRef.current === lottieState && animRef.current) return;

    // Destroy previous animation
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    currentStateRef.current = lottieState;

    try {
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: lottieState !== 'offline',
        autoplay: true,
        path: src,
      });

      anim.addEventListener('data_failed', () => {
        setFailed(true);
        onLoadError?.();
      });

      // Fire strike callback on each loop completion (for merit particles)
      if (onStrike && lottieState !== 'offline') {
        anim.addEventListener('loopComplete', () => {
          onStrike();
        });
      }

      animRef.current = anim;
    } catch {
      setFailed(true);
      onLoadError?.();
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
        currentStateRef.current = null;
      }
    };
  }, [lottieState, src, failed, onLoadError, onStrike]);

  if (failed) return null;

  return (
    <div
      ref={containerRef}
      className={`desktop-pet__lottie-canvas ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
