/**
 * PetRenderer — unified rendering layer for pet characters.
 *
 * Automatically selects the right engine:
 *   - Rive engine: when a .riv file is available for the character
 *   - SVG engine: legacy inline SVG with CSS/GSAP animation (fallback)
 *
 * Also manages the merit particle system for the monk character.
 */

import { useState, useCallback } from 'react';
import { resolveEngine } from './pet-engine';
import { RivePetRenderer } from './RivePetRenderer';
import { MeritParticles } from './MeritParticles';
import { DesktopPetIllustration } from './DesktopPetIllustration';
import type { PetAnimationActivity } from './pet-animation-state';
import type { PetRolePackId } from './pet-appearance';

interface PetRendererProps {
  rolePack: PetRolePackId;
  activity: PetAnimationActivity;
  className?: string;
}

/** Interval between woodfish strikes for merit particles (matches monk idle/working cycle) */
const MERIT_INTERVAL_BY_ACTIVITY: Partial<Record<PetAnimationActivity, number>> = {
  idle: 2100,
  working: 720,
  waiting: 2100,
  blocked: 2100,
};

export function PetRenderer({ rolePack, activity, className = '' }: PetRendererProps) {
  const engine = resolveEngine(rolePack);
  const [riveFailed, setRiveFailed] = useState(false);

  const useSvg = engine.type === 'svg' || riveFailed;

  // Merit particles: monk only, during idle/working/waiting/blocked (when tapping)
  const showMerit =
    rolePack === 'monk' &&
    (activity === 'idle' || activity === 'working' || activity === 'waiting' || activity === 'blocked');

  const meritInterval = MERIT_INTERVAL_BY_ACTIVITY[activity] ?? 2100;

  const handleRiveStrike = useCallback(() => {
    // When Rive fires a strike event, we could spawn a particle.
    // For now the particle system uses its own interval synced to the animation.
  }, []);

  return (
    <>
      {useSvg ? (
        <span
          className={`desktop-pet__role-art-motion desktop-pet__role-art-motion--${rolePack} ${className}`}
        >
          <DesktopPetIllustration rolePack={rolePack} />
        </span>
      ) : (
        <RivePetRenderer
          src={engine.riveSrc!}
          activity={activity}
          onStrike={handleRiveStrike}
          onLoadError={() => setRiveFailed(true)}
          className={className}
        />
      )}
      <MeritParticles active={showMerit} intervalMs={meritInterval} />
    </>
  );
}
