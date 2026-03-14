/**
 * PetRenderer — unified rendering layer for pet characters.
 *
 * Automatically selects the right engine (in priority order):
 *   1. Rive engine: when a .riv file is available for the character
 *   2. Lottie engine: when per-state .json files are available (free alternative)
 *   3. SVG engine: legacy inline SVG with CSS/GSAP animation (fallback)
 *
 * Also manages the merit particle system for the monk character.
 */

import { useState, useCallback } from 'react';
import { resolveEngine } from './pet-engine';
import { RivePetRenderer } from './RivePetRenderer';
import { LottiePetRenderer } from './LottiePetRenderer';
import { SpritePetRenderer } from './SpritePetRenderer';
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
  working: 420,
  waiting: 2100,
  blocked: 2100,
};

export function PetRenderer({ rolePack, activity, className = '' }: PetRendererProps) {
  const engine = resolveEngine(rolePack);
  const [animEngineFailed, setAnimEngineFailed] = useState(false);

  // Merit particles: monk only, during idle/working/waiting/blocked (when tapping)
  const showMerit =
    rolePack === 'monk' &&
    (activity === 'idle' || activity === 'working' || activity === 'waiting' || activity === 'blocked');

  const meritInterval = MERIT_INTERVAL_BY_ACTIVITY[activity] ?? 2100;

  const handleStrike = useCallback(() => {
    // When Rive/Lottie fires a strike event, we could spawn a particle.
    // For now the particle system uses its own interval synced to the animation.
  }, []);

  const handleLoadError = useCallback(() => setAnimEngineFailed(true), []);

  const effectiveType = animEngineFailed ? 'svg' : engine.type;

  const renderEngine = () => {
    switch (effectiveType) {
      case 'rive':
        return (
          <RivePetRenderer
            src={engine.riveSrc!}
            activity={activity}
            onStrike={handleStrike}
            onLoadError={handleLoadError}
            className={className}
          />
        );
      case 'lottie':
        return (
          <LottiePetRenderer
            assets={engine.lottieAssets!}
            activity={activity}
            onStrike={handleStrike}
            onLoadError={handleLoadError}
            className={className}
          />
        );
      case 'sprite':
        return (
          <SpritePetRenderer
            src={engine.spriteSrc!}
            activity={activity}
            className={className}
          />
        );
      case 'svg':
      default:
        return (
          <span
            className={`desktop-pet__role-art-motion desktop-pet__role-art-motion--${rolePack} ${className}`}
          >
            <DesktopPetIllustration rolePack={rolePack} />
          </span>
        );
    }
  };

  return (
    <>
      {renderEngine()}
      <MeritParticles active={showMerit} intervalMs={meritInterval} />
    </>
  );
}
