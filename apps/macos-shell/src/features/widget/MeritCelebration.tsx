/**
 * MeritCelebration — full-screen overlay shown when a merit milestone is reached.
 *
 * Shows the milestone icon, label, and a burst animation.
 * Auto-dismisses after the animation completes.
 */

import { useEffect, useState } from 'react';
import type { MeritMilestone } from './merit-milestones';

interface MeritCelebrationProps {
  milestone: MeritMilestone | null;
  onDismiss: () => void;
}

const CELEBRATION_DURATION = 3200;

export function MeritCelebration({ milestone, onDismiss }: MeritCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!milestone) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, CELEBRATION_DURATION);

    return () => clearTimeout(timer);
  }, [milestone, onDismiss]);

  if (!visible || !milestone) {
    return null;
  }

  return (
    <div
      className={`merit-celebration merit-celebration--${milestone.tier}`}
      aria-live="polite"
    >
      <div className="merit-celebration__burst" />
      <div className="merit-celebration__content">
        <span className="merit-celebration__icon">{milestone.icon}</span>
        <span className="merit-celebration__label">{milestone.label}</span>
        <span className="merit-celebration__threshold">
          功德 {milestone.threshold.toLocaleString('zh-CN')}
        </span>
      </div>
      {/* Particle ring */}
      <div className="merit-celebration__ring">
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className="merit-celebration__spark"
            style={{
              '--spark-angle': `${i * 45}deg`,
              '--spark-delay': `${i * 0.06}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
