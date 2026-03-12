/**
 * Merit Milestones — achievement system for cumulative 功德.
 *
 * When the merit counter crosses a milestone threshold, a celebration
 * event is fired. The DesktopPet renders the celebration overlay.
 */

export interface MeritMilestone {
  /** Merit count threshold */
  threshold: number;
  /** Display label shown during celebration */
  label: string;
  /** Celebration tier — drives visual intensity */
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  /** Emoji for the celebration (displayed in overlay) */
  icon: string;
}

export const MERIT_MILESTONES: MeritMilestone[] = [
  { threshold: 10, label: '初入佛门', tier: 'bronze', icon: '🪷' },
  { threshold: 50, label: '小沙弥', tier: 'bronze', icon: '📿' },
  { threshold: 100, label: '功德圆满·百', tier: 'silver', icon: '🔔' },
  { threshold: 500, label: '禅心初成', tier: 'silver', icon: '🧘' },
  { threshold: 1000, label: '功德千秋', tier: 'gold', icon: '✨' },
  { threshold: 5000, label: '大彻大悟', tier: 'gold', icon: '☀️' },
  { threshold: 10000, label: '万德庄严', tier: 'diamond', icon: '💎' },
  { threshold: 50000, label: '法力无边', tier: 'diamond', icon: '🌟' },
  { threshold: 100000, label: '功德无量', tier: 'diamond', icon: '🏆' },
];

/**
 * Returns the milestone that was just crossed, if any.
 * Only fires once per milestone (when prev < threshold <= current).
 */
export function checkMilestone(
  prevCount: number,
  currentCount: number,
): MeritMilestone | null {
  // Walk milestones in reverse to find the highest one just crossed
  for (let i = MERIT_MILESTONES.length - 1; i >= 0; i--) {
    const m = MERIT_MILESTONES[i];
    if (prevCount < m.threshold && currentCount >= m.threshold) {
      return m;
    }
  }
  return null;
}

/**
 * Returns the highest milestone achieved so far.
 */
export function currentMilestone(count: number): MeritMilestone | null {
  for (let i = MERIT_MILESTONES.length - 1; i >= 0; i--) {
    if (count >= MERIT_MILESTONES[i].threshold) {
      return MERIT_MILESTONES[i];
    }
  }
  return null;
}

/**
 * Returns the next milestone to achieve, or null if all achieved.
 */
export function nextMilestone(count: number): MeritMilestone | null {
  for (const m of MERIT_MILESTONES) {
    if (count < m.threshold) {
      return m;
    }
  }
  return null;
}
