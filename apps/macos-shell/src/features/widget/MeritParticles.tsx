/**
 * MeritParticles — floating "功德+1" text particles + cumulative merit counter + milestone celebrations.
 *
 * Each particle spawns at a random horizontal offset, floats upward
 * with a scale pop, then fades out. Particles are self-cleaning
 * via onAnimationEnd.
 *
 * The component also increments the persistent merit counter on each strike,
 * displays the total, and triggers celebrations at milestone thresholds.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { meritStore, useMeritStore } from './merit-store';
import { checkMilestone, currentMilestone, nextMilestone, type MeritMilestone } from './merit-milestones';
import { MeritCelebration } from './MeritCelebration';

interface MeritParticle {
  id: number;
  xOffset: number;
  scale: number;
}

interface MeritParticlesProps {
  /** When true, particles spawn on a recurring interval (tied to woodfish strike rhythm). */
  active: boolean;
  /** Pet id for tracking per-pet merit. */
  petId?: string;
  /** Spawn interval in ms — should match the woodfish strike cycle. */
  intervalMs?: number;
  /** Delay before the first particle so text can align with the actual strike moment. */
  initialDelayMs?: number;
  /** Text to display. Defaults to "功德+1". */
  text?: string;
  /** Label for the persistent counter badge. Defaults to "功德". */
  counterLabel?: string;
  /** Whether milestone celebrations should be shown for this metric. */
  celebrationEnabled?: boolean;
}

let nextId = 0;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function formatMerit(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
  return n.toLocaleString('zh-CN');
}

export function MeritParticles({
  active,
  petId,
  intervalMs = 2100,
  initialDelayMs = 0,
  text = '功德+1',
  counterLabel = '功德',
  celebrationEnabled = true,
}: MeritParticlesProps) {
  const [particles, setParticles] = useState<MeritParticle[]>([]);
  const [celebration, setCelebration] = useState<MeritMilestone | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef<number>(0);
  const totalMerit = useMeritStore((state) => {
    if (!petId) return 0;
    return state.counts[petId] ?? 0;
  });

  // Track the previous count to detect milestone crossings
  useEffect(() => {
    prevCountRef.current = totalMerit;
  }, []); // Only on mount — subsequent updates are tracked via spawnParticle

  const spawnParticle = useCallback(() => {
    setParticles((prev) => [
      ...prev,
      {
        id: nextId++,
        xOffset: randomBetween(-12, 12),
        scale: randomBetween(0.94, 1.04),
      },
    ]);
    // Increment persistent merit counter
    if (petId) {
      const prevCount = meritStore.getState().counts[petId] ?? 0;
      const newCount = meritStore.getState().increment(petId);
      // Check for milestone crossing
      const milestone = checkMilestone(prevCount, newCount);
      if (celebrationEnabled && milestone) {
        setCelebration(milestone);
      }
    }
  }, [celebrationEnabled, petId]);

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  useEffect(() => {
    if (!active) {
      if (initialTimeoutRef.current !== null) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const startInterval = () => {
      spawnParticle();
      intervalRef.current = setInterval(spawnParticle, intervalMs);
    };

    if (initialDelayMs > 0) {
      initialTimeoutRef.current = setTimeout(() => {
        initialTimeoutRef.current = null;
        startInterval();
      }, initialDelayMs);
    } else {
      startInterval();
    }

    return () => {
      if (initialTimeoutRef.current !== null) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, initialDelayMs, intervalMs, spawnParticle]);

  const achieved = currentMilestone(totalMerit);
  const next = nextMilestone(totalMerit);

  return (
    <>
      <span className="merit-particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="merit-particles__item"
            style={
              {
                '--merit-x': `${p.xOffset}px`,
                '--merit-scale': p.scale,
              } as React.CSSProperties
            }
            onAnimationEnd={() => removeParticle(p.id)}
          >
            {text}
          </span>
        ))}
        {totalMerit > 0 ? (
          <span
            className={`merit-particles__counter${achieved ? ` merit-particles__counter--${achieved.tier}` : ''}`}
            title={
              celebrationEnabled && next
                ? `下一个成就: ${next.label} (${next.threshold.toLocaleString('zh-CN')})`
                : `${counterLabel}累计`
            }
          >
            {celebrationEnabled && achieved ? `${achieved.icon} ` : ''}{counterLabel} {formatMerit(totalMerit)}
          </span>
        ) : null}
      </span>
      {celebrationEnabled ? (
        <MeritCelebration milestone={celebration} onDismiss={dismissCelebration} />
      ) : null}
    </>
  );
}
