/**
 * Merit Milestones — per-role achievement system for cumulative metrics.
 *
 * When the metric counter crosses a milestone threshold, a celebration
 * event is fired. The DesktopPet renders the celebration overlay.
 */

import type { PetRolePackId } from './pet-appearance';

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

/* ── Monk (功德 — Buddhist themed) ── */

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

/* ── Lobster / Coder Claw (修复 — programming themed) ── */

export const LOBSTER_MILESTONES: MeritMilestone[] = [
  { threshold: 10, label: '初写代码', tier: 'bronze', icon: '🦞' },
  { threshold: 50, label: '修Bug新手', tier: 'bronze', icon: '🐛' },
  { threshold: 100, label: '代码百行', tier: 'silver', icon: '⌨️' },
  { threshold: 500, label: '调试达人', tier: 'silver', icon: '🔧' },
  { threshold: 1000, label: '千行无Bug', tier: 'gold', icon: '🚀' },
  { threshold: 5000, label: '全栈大钳', tier: 'gold', icon: '🦾' },
  { threshold: 10000, label: '万行修炼', tier: 'diamond', icon: '💻' },
  { threshold: 50000, label: '代码之神', tier: 'diamond', icon: '👾' },
  { threshold: 100000, label: '修复无限', tier: 'diamond', icon: '🏆' },
];

/* ── Robot / Ops Bot (巡检 — operations themed) ── */

export const ROBOT_MILESTONES: MeritMilestone[] = [
  { threshold: 10, label: '初次巡检', tier: 'bronze', icon: '🤖' },
  { threshold: 50, label: '运维新兵', tier: 'bronze', icon: '🔩' },
  { threshold: 100, label: '百次巡逻', tier: 'silver', icon: '📡' },
  { threshold: 500, label: '系统卫士', tier: 'silver', icon: '🛡️' },
  { threshold: 1000, label: '千次守护', tier: 'gold', icon: '⚙️' },
  { threshold: 5000, label: '铁壁运维', tier: 'gold', icon: '🏗️' },
  { threshold: 10000, label: '万检无虞', tier: 'diamond', icon: '🔭' },
  { threshold: 50000, label: '永不宕机', tier: 'diamond', icon: '⚡' },
  { threshold: 100000, label: '巡检无疆', tier: 'diamond', icon: '🏆' },
];

/* ── Cat / Planner Cat (规划 — strategy themed) ── */

export const CAT_MILESTONES: MeritMilestone[] = [
  { threshold: 10, label: '初学规划', tier: 'bronze', icon: '🐱' },
  { threshold: 50, label: '便签达人', tier: 'bronze', icon: '📋' },
  { threshold: 100, label: '百策在胸', tier: 'silver', icon: '🗂️' },
  { threshold: 500, label: '运筹帷幄', tier: 'silver', icon: '🎯' },
  { threshold: 1000, label: '千谋百计', tier: 'gold', icon: '📐' },
  { threshold: 5000, label: '全局掌控', tier: 'gold', icon: '🗺️' },
  { threshold: 10000, label: '万事俱备', tier: 'diamond', icon: '👑' },
  { threshold: 50000, label: '谋定天下', tier: 'diamond', icon: '🌐' },
  { threshold: 100000, label: '规划无限', tier: 'diamond', icon: '🏆' },
];

/* ── Role → milestones lookup ── */

export const ROLE_MILESTONES: Record<PetRolePackId, MeritMilestone[]> = {
  monk: MERIT_MILESTONES,
  lobster: LOBSTER_MILESTONES,
  robot: ROBOT_MILESTONES,
  cat: CAT_MILESTONES,
};

/**
 * Returns the milestone that was just crossed, if any.
 * Only fires once per milestone (when prev < threshold <= current).
 */
export function checkMilestone(
  prevCount: number,
  currentCount: number,
  milestones: MeritMilestone[] = MERIT_MILESTONES,
): MeritMilestone | null {
  // Walk milestones in reverse to find the highest one just crossed
  for (let i = milestones.length - 1; i >= 0; i--) {
    const m = milestones[i];
    if (prevCount < m.threshold && currentCount >= m.threshold) {
      return m;
    }
  }
  return null;
}

/**
 * Returns the highest milestone achieved so far.
 */
export function currentMilestone(
  count: number,
  milestones: MeritMilestone[] = MERIT_MILESTONES,
): MeritMilestone | null {
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (count >= milestones[i].threshold) {
      return milestones[i];
    }
  }
  return null;
}

/**
 * Returns the next milestone to achieve, or null if all achieved.
 */
export function nextMilestone(
  count: number,
  milestones: MeritMilestone[] = MERIT_MILESTONES,
): MeritMilestone | null {
  for (const m of milestones) {
    if (count < m.threshold) {
      return m;
    }
  }
  return null;
}
