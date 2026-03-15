/**
 * SvgBonePetRenderer — renders a grouped SVG pet with GSAP bone-based animation.
 *
 * Expects an SVG file with named <g> groups for each body part.
 * Supports two monk rigs:
 *   - monk-bone: "head", "body", "left arm", "righ arm", "Wooden stick", "Wooden Fish"
 *   - monk-3 / monk-4: 英文 id（monk-root, monk-body, head, leftArm, rightArm, stick, fish）
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { PetAnimationActivity } from './pet-animation-state';

type BoneAnimState = 'idle' | 'working' | 'offline';
type MonkRig = 'monk-bone' | 'monk-svg';

function activityToBoneState(activity: PetAnimationActivity): BoneAnimState {
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

function getMonkRig(src: string): MonkRig {
  return src.includes('monk-3') || src.includes('monk-4') ? 'monk-svg' : 'monk-bone';
}

interface SvgBonePetRendererProps {
  src: string;
  activity: PetAnimationActivity;
  className?: string;
}

// ---------------------------------------------------------------------------
// 和尚敲木鱼 — 按《桌宠三态动画设计》常量（节奏、幅度、原点）
// ---------------------------------------------------------------------------

/** 工作中：lift → strike → recover，周期约 0.42s */
const WORK = {
  LIFT_DUR: 0.12,
  STRIKE_DUR: 0.08,
  RECOVER_DUR: 0.22,
  CYCLE: 0.42,
  ARM_LIFT_DEG: 15,
  ARM_STRIKE_DEG: -2,
  STICK_LIFT_DEG: 20,
  STICK_STRIKE_DEG: -3,
  HEAD_NOD_DEG: 2,
  HEAD_STRIKE_DEG: -1.5,
  BODY_LEAN_DEG: 1,
  FISH_SQUASH_Y: 0.9,
  FISH_SQUASH_X: 1.06,
  STAGGER_AFTER_ARM: 0.02,
  STAGGER_BODY: 0.02,
} as const;

/** monk-4：棍子在左臂、木鱼在右，左臂+棍子需向木鱼方向摆，角度加大才能敲到 */
const WORK_MONK_SVG = {
  ...WORK,
  ARM_LIFT_DEG: -22,
  ARM_STRIKE_DEG: 38,
  STICK_LIFT_DEG: -28,
  STICK_STRIKE_DEG: 42,
} as const;

/** 空闲：慢敲 + 呼吸，周期约 3s */
const IDLE = {
  FLOAT_DUR: 1.5,
  FLOAT_Y: -5,
  ARM_LIFT_DUR: 1.2,
  ARM_TAP_DUR: 0.6,
  ARM_LIFT_DEG: 10,
  STICK_LIFT_DEG: 12,
  HEAD_SWAY_LO: -2,
  HEAD_SWAY_HI: 1.5,
  LEFT_ARM_SWAY: -2,
  FISH_SQUASH_Y: 0.93,
  FISH_SQUASH_X: 1.04,
  FISH_TAP_TIME: 2.0,
} as const;

/** monk-svg 空闲：敲击臂用左臂，幅度加大以够到木鱼 */
const IDLE_MONK_SVG = {
  ...IDLE,
  ARM_LIFT_DEG: -18,
  STICK_LIFT_DEG: -22,
  FISH_TAP_TIME: 2.0,
} as const;

/** 旋转/缩放原点 (svgOrigin)，monk-bone / monk-3 共用 1024 坐标系 */
const O_BONE = {
  head: '513 490',
  body: '502 500',
  rightArm: '370 496',
  leftArm: '650 497',
  stick: '300 438',
  fish: '686 839',
};

const O_MONK3 = {
  head: '513 490',
  body: '502 677',
  rightArm: '370 496',
  leftArm: '650 497',
  stick: '287 438',
  fish: '686 839',
};

/** monk-4 旋转中心：左臂/棍子绕肩/腕，使棍子能摆到木鱼位置（viewBox 1024） */
const O_MONK4 = {
  head: '513 490',
  body: '502 677',
  rightArm: '370 496',
  leftArm: '640 500',
  stick: '620 560',
  fish: '720 700',
};

function getMonkBoneElements(container: HTMLElement) {
  return {
    head: container.querySelector('#head'),
    body: container.querySelector('#body'),
    leftArm: container.querySelector('[id="left arm"]'),
    rightArm: container.querySelector('[id="righ arm"]'),
    stick: container.querySelector('[id="Wooden stick"]'),
    fish: container.querySelector('[id="Wooden Fish"]'),
    root: container.querySelector('[id="monk 1"]') || container,
  };
}

/** monk-3 英文 id（推荐）：在 SVG 里把分组改成这些 id 后，动画最稳定 */
const MONK3_EN_IDS = {
  root: 'monk-root',
  body: 'monk-body',
  head: 'head',
  leftArm: 'leftArm',
  rightArm: 'rightArm',
  stick: 'stick',
  fish: 'fish',
} as const;

function queryById(scope: Element, id: string): Element | null {
  try {
    return scope.querySelector(`[id="${id.replace(/"/g, '\\"')}"]`);
  } catch {
    return null;
  }
}

function getMonk3Elements(container: HTMLElement) {
  const svg = container.querySelector('svg') || container;
  const doc = container.ownerDocument;

  const byEn = (id: string): Element | null => {
    const el = queryById(svg, id);
    if (el) return el;
    const docEl = doc.getElementById(id);
    return docEl && svg.contains(docEl) ? docEl : null;
  };

  const root = byEn(MONK3_EN_IDS.root) || svg || container;
  return {
    head: byEn(MONK3_EN_IDS.head),
    body: byEn(MONK3_EN_IDS.body),
    leftArm: byEn(MONK3_EN_IDS.leftArm),
    rightArm: byEn(MONK3_EN_IDS.rightArm),
    stick: byEn(MONK3_EN_IDS.stick),
    fish: byEn(MONK3_EN_IDS.fish),
    root: root as HTMLElement,
  };
}

function getElements(container: HTMLElement, rig: MonkRig) {
  return rig === 'monk-svg' ? getMonk3Elements(container) : getMonkBoneElements(container);
}

function getOrigins(rig: MonkRig) {
  return rig === 'monk-svg' ? O_MONK4 : O_BONE;
}

/**
 * 空闲 — 慢节奏敲木鱼 + 呼吸；monk-svg 用左臂+棍子敲，幅度加大。
 */
function buildMonkIdleTimeline(container: HTMLElement, rig: MonkRig): gsap.core.Timeline {
  const el = getElements(container, rig);
  const O = getOrigins(rig);
  const tl = gsap.timeline({ repeat: -1 });
  const I = rig === 'monk-svg' ? IDLE_MONK_SVG : IDLE;

  tl.fromTo(el.root, { y: 0 }, { duration: I.FLOAT_DUR, y: I.FLOAT_Y, ease: 'sine.inOut' }, 0);
  tl.fromTo(el.root, { y: I.FLOAT_Y }, { duration: I.FLOAT_DUR, y: 0, ease: 'sine.inOut' }, I.FLOAT_DUR);

  if (el.head) {
    tl.fromTo(el.head, { rotation: 0, svgOrigin: O.head }, { duration: I.FLOAT_DUR, rotation: I.HEAD_SWAY_LO, svgOrigin: O.head, ease: 'sine.inOut' }, 0);
    tl.fromTo(el.head, { rotation: I.HEAD_SWAY_LO, svgOrigin: O.head }, { duration: I.FLOAT_DUR, rotation: I.HEAD_SWAY_HI, svgOrigin: O.head, ease: 'sine.inOut' }, I.FLOAT_DUR);
  }

  const tapArm = rig === 'monk-svg' ? el.leftArm : el.rightArm;
  const tapArmOrigin = rig === 'monk-svg' ? O.leftArm : O.rightArm;
  if (tapArm) {
    tl.fromTo(tapArm, { rotation: 0, svgOrigin: tapArmOrigin }, { duration: I.ARM_LIFT_DUR, rotation: I.ARM_LIFT_DEG, svgOrigin: tapArmOrigin, ease: 'sine.inOut' }, 0.2);
    tl.fromTo(tapArm, { rotation: I.ARM_LIFT_DEG, svgOrigin: tapArmOrigin }, { duration: I.ARM_TAP_DUR, rotation: 0, svgOrigin: tapArmOrigin, ease: 'power2.in' }, 0.2 + I.ARM_LIFT_DUR);
  }
  if (el.stick && rig !== 'monk-svg') {
    tl.fromTo(el.stick, { rotation: 0, svgOrigin: O.stick }, { duration: I.ARM_LIFT_DUR, rotation: I.STICK_LIFT_DEG, svgOrigin: O.stick, ease: 'sine.inOut' }, 0.2);
    tl.fromTo(el.stick, { rotation: I.STICK_LIFT_DEG, svgOrigin: O.stick }, { duration: I.ARM_TAP_DUR, rotation: 0, svgOrigin: O.stick, ease: 'power2.in' }, 0.2 + I.ARM_LIFT_DUR);
  }

  if (el.fish) {
    tl.fromTo(el.fish, { scaleY: 1, scaleX: 1, svgOrigin: O.fish }, { duration: 0.06, scaleY: I.FISH_SQUASH_Y, scaleX: I.FISH_SQUASH_X, svgOrigin: O.fish, ease: 'power2.in' }, I.FISH_TAP_TIME);
    tl.fromTo(el.fish, { scaleY: I.FISH_SQUASH_Y, scaleX: I.FISH_SQUASH_X, svgOrigin: O.fish }, { duration: 0.4, scaleY: 1, scaleX: 1, svgOrigin: O.fish, ease: 'elastic.out(1, 0.4)' }, I.FISH_TAP_TIME + 0.06);
  }

  const swayArm = rig === 'monk-svg' ? el.rightArm : el.leftArm;
  const swayArmOrigin = rig === 'monk-svg' ? O.rightArm : O.leftArm;
  if (swayArm) {
    tl.fromTo(swayArm, { rotation: 0, svgOrigin: swayArmOrigin }, { duration: I.FLOAT_DUR, rotation: I.LEFT_ARM_SWAY, svgOrigin: swayArmOrigin, ease: 'sine.inOut' }, 0);
    tl.fromTo(swayArm, { rotation: I.LEFT_ARM_SWAY, svgOrigin: swayArmOrigin }, { duration: I.FLOAT_DUR, rotation: 0, svgOrigin: swayArmOrigin, ease: 'sine.inOut' }, I.FLOAT_DUR);
  }

  return tl;
}

/**
 * 工作中 — 快节奏敲木鱼（文档：lift → strike → recover 周期约 0.42s）
 * monk-svg：棍子在左臂、木鱼在右，用左臂+棍子向木鱼方向摆，角度加大；monk-bone 用右臂+棍子。
 */
function buildMonkWorkingTimeline(container: HTMLElement, rig: MonkRig): gsap.core.Timeline {
  const el = getElements(container, rig);
  const O = getOrigins(rig);
  const tl = gsap.timeline({ repeat: -1 });
  const T = rig === 'monk-svg' ? WORK_MONK_SVG : WORK;

  const stickStart = T.STAGGER_AFTER_ARM;
  const bodyStart = stickStart + T.STAGGER_BODY;
  const impactTime = T.LIFT_DUR + T.STRIKE_DUR;

  const strikeArm = rig === 'monk-svg' ? el.leftArm : el.rightArm;
  const strikeArmOrigin = rig === 'monk-svg' ? O.leftArm : O.rightArm;

  // monk-svg：棍子已在 leftArm 内，只动左臂，棍子随臂一起动，不脱手
  if (strikeArm) {
    tl.fromTo(strikeArm, { rotation: 0, svgOrigin: strikeArmOrigin }, { duration: T.LIFT_DUR, rotation: T.ARM_LIFT_DEG, svgOrigin: strikeArmOrigin, ease: 'power2.out' }, 0);
    tl.fromTo(strikeArm, { rotation: T.ARM_LIFT_DEG, svgOrigin: strikeArmOrigin }, { duration: T.STRIKE_DUR, rotation: T.ARM_STRIKE_DEG, svgOrigin: strikeArmOrigin, ease: 'power3.in' }, T.LIFT_DUR);
    tl.fromTo(strikeArm, { rotation: T.ARM_STRIKE_DEG, svgOrigin: strikeArmOrigin }, { duration: T.RECOVER_DUR, rotation: 0, svgOrigin: strikeArmOrigin, ease: 'sine.out' }, T.LIFT_DUR + T.STRIKE_DUR);
  }
  if (el.stick && rig !== 'monk-svg') {
    tl.fromTo(el.stick, { rotation: 0, svgOrigin: O.stick }, { duration: T.LIFT_DUR, rotation: T.STICK_LIFT_DEG, svgOrigin: O.stick, ease: 'power2.out' }, stickStart);
    tl.fromTo(el.stick, { rotation: T.STICK_LIFT_DEG, svgOrigin: O.stick }, { duration: T.STRIKE_DUR, rotation: T.STICK_STRIKE_DEG, svgOrigin: O.stick, ease: 'power3.in' }, stickStart + T.LIFT_DUR);
    tl.fromTo(el.stick, { rotation: T.STICK_STRIKE_DEG, svgOrigin: O.stick }, { duration: T.RECOVER_DUR, rotation: 0, svgOrigin: O.stick, ease: 'sine.out' }, stickStart + T.LIFT_DUR + T.STRIKE_DUR);
  }
  if (el.body) {
    tl.fromTo(el.body, { rotation: 0, svgOrigin: O.body }, { duration: T.LIFT_DUR, rotation: T.BODY_LEAN_DEG, svgOrigin: O.body, ease: 'power2.out' }, bodyStart);
    tl.fromTo(el.body, { rotation: T.BODY_LEAN_DEG, svgOrigin: O.body }, { duration: T.STRIKE_DUR + T.RECOVER_DUR - bodyStart, rotation: 0, svgOrigin: O.body, ease: 'sine.out' }, bodyStart + T.LIFT_DUR);
  }
  if (el.head) {
    tl.fromTo(el.head, { rotation: 0, svgOrigin: O.head }, { duration: 0.1, rotation: T.HEAD_NOD_DEG, svgOrigin: O.head, ease: 'power2.out' }, 0);
    tl.fromTo(el.head, { rotation: T.HEAD_NOD_DEG, svgOrigin: O.head }, { duration: 0.1, rotation: T.HEAD_STRIKE_DEG, svgOrigin: O.head, ease: 'power2.in' }, T.LIFT_DUR);
    tl.fromTo(el.head, { rotation: T.HEAD_STRIKE_DEG, svgOrigin: O.head }, { duration: T.RECOVER_DUR, rotation: 0, svgOrigin: O.head, ease: 'sine.out' }, T.LIFT_DUR + T.STRIKE_DUR);
  }
  if (el.fish) {
    tl.fromTo(el.fish, { scaleY: 1, scaleX: 1, svgOrigin: O.fish }, { duration: 0.04, scaleY: T.FISH_SQUASH_Y, scaleX: T.FISH_SQUASH_X, svgOrigin: O.fish, ease: 'power2.in' }, impactTime - 0.01);
    tl.fromTo(el.fish, { scaleY: T.FISH_SQUASH_Y, scaleX: T.FISH_SQUASH_X, svgOrigin: O.fish }, { duration: 0.25, scaleY: 1, scaleX: 1, svgOrigin: O.fish, ease: 'elastic.out(1, 0.3)' }, impactTime + 0.03);
  }

  return tl;
}

export function SvgBonePetRenderer({
  src,
  activity,
  className = '',
}: SvgBonePetRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const boneState = activityToBoneState(activity);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up previous
    timelineRef.current?.kill();
    ctxRef.current?.revert();
    container.innerHTML = '';

    // Load SVG inline so we can access internal groups
    let cancelled = false;
    fetch(src)
      .then((res) => res.text())
      .then((svgText) => {
        if (cancelled) return;

        container.innerHTML = svgText;
        const svgEl = container.querySelector('svg');
        if (svgEl) {
          svgEl.style.width = '100%';
          svgEl.style.height = '100%';
        }

        if (boneState === 'offline') {
          container.style.filter = 'grayscale(0.5) brightness(0.88)';
          return;
        }
        container.style.filter = '';

        const rig = getMonkRig(src);
        const ctx = gsap.context(() => {
          const tl = boneState === 'working'
            ? buildMonkWorkingTimeline(container, rig)
            : buildMonkIdleTimeline(container, rig);
          timelineRef.current = tl;
        }, container);
        ctxRef.current = ctx;
      });

    return () => {
      cancelled = true;
      timelineRef.current?.kill();
      ctxRef.current?.revert();
      container.innerHTML = '';
    };
  }, [src, boneState]);

  return (
    <div
      ref={containerRef}
      className={`desktop-pet__svg-bone ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
