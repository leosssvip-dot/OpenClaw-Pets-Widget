/**
 * PetRenderer — unified rendering layer for pet characters.
 *
 * Automatically selects the right engine:
 *   1. Rive engine: primary path for built-in characters
 *   2. SVG engine: static fallback when a Rive asset is unavailable or fails
 *
 * Note: MeritParticles are rendered by DesktopPet (the parent), not here,
 * to avoid duplication and to allow petId-based merit tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import { resolveEngine } from './pet-engine';
import { RivePetRenderer } from './RivePetRenderer';
import { DesktopPetIllustration } from './DesktopPetIllustration';
import type { PetAnimationActivity } from './pet-animation-state';
import type { PetRolePackId } from './pet-appearance';

interface PetRendererProps {
  rolePack: PetRolePackId;
  activity: PetAnimationActivity;
  clickSignal?: number;
  isDimmed?: boolean;
  className?: string;
}

export function PetRenderer({
  rolePack,
  activity,
  clickSignal = 0,
  isDimmed = false,
  className = '',
}: PetRendererProps) {
  const engine = resolveEngine(rolePack);
  const [animEngineFailed, setAnimEngineFailed] = useState(false);
  const surfaceClassName = `${className}${isDimmed ? ' desktop-pet__render-surface--dimmed' : ''}`;
  const rendererIdentity = engine.riveSrc ?? rolePack;

  const handleStrike = useCallback(() => {
    // When Rive/Lottie fires a strike event, we could spawn a particle.
    // For now the particle system uses its own interval synced to the animation.
  }, []);

  const handleLoadError = useCallback(() => setAnimEngineFailed(true), []);

  useEffect(() => {
    setAnimEngineFailed(false);
  }, [rendererIdentity]);

  const effectiveType = animEngineFailed ? 'svg' : engine.type;

  switch (effectiveType) {
    case 'rive':
      return (
        <RivePetRenderer
          key={rendererIdentity}
          src={engine.riveSrc!}
          activity={activity}
          clickSignal={clickSignal}
          onStrike={handleStrike}
          onLoadError={handleLoadError}
          className={surfaceClassName}
        />
      );
    case 'svg':
    default:
      return (
        <span
          className={`desktop-pet__role-art-motion desktop-pet__role-art-motion--${rolePack} ${surfaceClassName}`}
        >
          <DesktopPetIllustration rolePack={rolePack} />
        </span>
      );
  }
}
