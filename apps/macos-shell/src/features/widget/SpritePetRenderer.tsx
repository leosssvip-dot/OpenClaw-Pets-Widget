/**
 * SpritePetRenderer — renders a pet character using a single PNG image
 * with GSAP-driven whole-body transform animations.
 *
 * Animation approach:
 *   - idle: gentle floating (translateY) + subtle sway (rotation)
 *   - working: faster rhythmic bobbing + slight forward tilt
 *   - offline: static + grayscale filter
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { PetAnimationActivity } from './pet-animation-state';

type SpriteAnimState = 'idle' | 'working' | 'offline';

function activityToSpriteState(activity: PetAnimationActivity): SpriteAnimState {
  switch (activity) {
    case 'working':
    case 'thinking':
      return 'working';
    case 'blocked':
      return 'offline';
    default:
      return 'idle';
  }
}

interface SpritePetRendererProps {
  src: string;
  activity: PetAnimationActivity;
  className?: string;
}

export function SpritePetRenderer({
  src,
  activity,
  className = '',
}: SpritePetRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spriteState = activityToSpriteState(activity);

  useEffect(() => {
    if (!containerRef.current || spriteState === 'offline') return;

    const el = containerRef.current;
    let timeline: gsap.core.Timeline | null = null;

    const ctx = gsap.context(() => {
      // Reset to base position at start
      gsap.set(el, { y: 0, rotation: 0, scale: 1 });

      if (spriteState === 'idle') {
        // Gentle breathing float + subtle sway
        timeline = gsap.timeline({ repeat: -1 });
        timeline
          .fromTo(
            el,
            { y: 0, rotation: 0 },
            { duration: 1.4, y: -4, rotation: -0.8, ease: 'sine.inOut' }
          )
          .to(el, { duration: 1.4, y: 0, rotation: 0.5, ease: 'sine.inOut' })
          .to(el, { duration: 1.2, y: -2, rotation: 0, ease: 'sine.inOut' })
          .to(el, { duration: 1.0, y: 0, rotation: 0, ease: 'sine.inOut' });
      } else {
        // Working: rhythmic nodding/bobbing
        timeline = gsap.timeline({ repeat: -1 });
        timeline
          .fromTo(
            el,
            { y: 0, rotation: 0, scale: 1 },
            { duration: 0.18, y: -3, rotation: -1.2, scale: 1.01, ease: 'power2.out' }
          )
          .to(el, { duration: 0.12, y: 1.5, rotation: 0.8, scale: 0.99, ease: 'power3.in' })
          .to(el, { duration: 0.12, y: 0, rotation: 0, scale: 1, ease: 'sine.out' });
      }
    }, containerRef);

    return () => {
      timeline?.kill();
      ctx.revert();
    };
  }, [spriteState]);

  const offlineStyle = spriteState === 'offline'
    ? { filter: 'grayscale(0.5) brightness(0.88)' }
    : {};

  return (
    <div
      ref={containerRef}
      className={`desktop-pet__sprite ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        ...offlineStyle,
      }}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
