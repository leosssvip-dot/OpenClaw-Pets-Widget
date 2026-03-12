import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';
import { useWidgetStore, widgetStore } from './widget-store';
import { resolvePetAppearance, type PetAppearanceConfig } from './pet-appearance';
import { resolvePetAnimationState } from './pet-animation-state';
import { DesktopPetIllustration } from './DesktopPetIllustration';
import { MeritParticles } from './MeritParticles';
import { PetBubble } from './PetBubble';
import { PetContextMenu } from './PetContextMenu';

// ---------------------------------------------------------------------------
// GSAP monk working timeline (preserved from original)
// ---------------------------------------------------------------------------

function prefersReducedMotion() {
  const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  return mediaQuery?.matches ?? false;
}

function queryElement<T extends Element>(root: HTMLElement, selector: string) {
  return root.querySelector(selector) as T | null;
}

// These anchors match the current monk SVG rig.
// Keeping them explicit prevents the mallet from rotating around stale pivots.
const MONK_ARM_ORIGIN = '97 77';
const MONK_MALLET_ORIGIN = '112 68';

function getMonkTimelineTargets(root: HTMLElement) {
  const stage = queryElement<HTMLElement>(root, '.desktop-pet__stage');
  const roleArt = queryElement<HTMLElement>(root, '.desktop-pet__role-art-motion');
  const halo = queryElement<SVGElement>(root, '.desktop-pet__monk-breath-halo');
  const body = queryElement<SVGElement>(root, '.desktop-pet__monk-body');
  const head = queryElement<SVGElement>(root, '.desktop-pet__monk-head');
  const beads = queryElement<SVGElement>(root, '.desktop-pet__monk-beads');
  const arm = queryElement<SVGElement>(root, '.desktop-pet__monk-arm--right');
  const sleeve = queryElement<SVGElement>(root, '.desktop-pet__monk-sleeve');
  const robeFold = queryElement<SVGElement>(root, '.desktop-pet__monk-robe-fold');
  const mallet = queryElement<SVGElement>(root, '.desktop-pet__mallet');
  const malletTrail = queryElement<SVGElement>(root, '.desktop-pet__mallet-trail');
  const woodfishShell = queryElement<SVGElement>(root, '.desktop-pet__woodfish-shell');
  const woodfishSlot = queryElement<SVGElement>(root, '.desktop-pet__woodfish-slot');
  const impact = queryElement<SVGElement>(root, '.desktop-pet__woodfish-impact');
  const echo = queryElement<SVGElement>(root, '.desktop-pet__woodfish-echo');

  return {
    stage,
    roleArt,
    halo,
    body,
    head,
    beads,
    arm,
    sleeve,
    robeFold,
    mallet,
    malletTrail,
    woodfishShell,
    woodfishSlot,
    impact,
    echo
  };
}

function buildMonkIdleTimeline(root: HTMLElement) {
  const {
    stage,
    roleArt,
    halo,
    body,
    head,
    beads,
    arm,
    sleeve,
    robeFold,
    mallet,
    malletTrail,
    woodfishShell,
    woodfishSlot,
    impact,
    echo
  } = getMonkTimelineTargets(root);

  if (
    !stage ||
    !roleArt ||
    !halo ||
    !body ||
    !head ||
    !beads ||
    !arm ||
    !sleeve ||
    !robeFold ||
    !mallet ||
    !malletTrail ||
    !woodfishShell ||
    !woodfishSlot ||
    !impact ||
    !echo
  ) {
    return null;
  }

  const timeline = gsap.timeline({
    paused: false,
    repeat: -1,
    defaults: {
      ease: 'none'
    }
  });

  timeline
    .set([impact, echo, malletTrail], {
      autoAlpha: 0
    })
    .set([impact, echo], {
      scale: 0.3
    })
    .set([stage, roleArt, body, head, beads, arm, sleeve, robeFold, mallet, halo], {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      autoAlpha: 1
    })
    .addLabel('rest', 0)
    .to(
      [body, head],
      {
        duration: 0.62,
        y: -1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1
      },
      'rest'
    )
    .to(
      halo,
      {
        duration: 0.62,
        autoAlpha: 0.3,
        scale: 1.06,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1
      },
      'rest'
    )
    .to(
      robeFold,
      {
        duration: 0.62,
        x: -0.6,
        rotation: -1.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1
      },
      'rest'
    )
    .addLabel('lift', 0.62)
    .to(
      [stage, roleArt],
      {
        duration: 0.36,
        y: -1.2,
        rotation: -0.9,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      [body, head, beads],
      {
        duration: 0.36,
        x: -0.6,
        y: -1.5,
        rotation: -1.6,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      arm,
      {
        duration: 0.36,
        rotation: -5,
        svgOrigin: MONK_ARM_ORIGIN,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      mallet,
      {
        duration: 0.36,
        rotation: -42,
        svgOrigin: MONK_MALLET_ORIGIN,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      [sleeve, robeFold],
      {
        duration: 0.36,
        x: -1,
        rotation: -3,
        ease: 'power2.out'
      },
      'lift'
    )
    .addLabel('strike', 0.98)
    .to(
      arm,
      {
        duration: 0.12,
        rotation: 0.8,
        svgOrigin: MONK_ARM_ORIGIN,
        ease: 'power3.in'
      },
      'strike'
    )
    .to(
      mallet,
      {
        duration: 0.12,
        rotation: 3.5,
        svgOrigin: MONK_MALLET_ORIGIN,
        ease: 'power3.in'
      },
      'strike'
    )
    .to(
      [body, head, beads],
      {
        duration: 0.12,
        x: 0.4,
        y: 0.4,
        rotation: 0.8,
        ease: 'power3.in'
      },
      'strike'
    )
    .to(
      [stage, roleArt],
      {
        duration: 0.12,
        y: 0.5,
        rotation: 0.6,
        ease: 'power3.in'
      },
      'strike'
    )
    .to(
      woodfishShell,
      {
        duration: 0.1,
        scaleX: 0.96,
        scaleY: 0.92,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      },
      'strike+=0.04'
    )
    .to(
      woodfishSlot,
      {
        duration: 0.1,
        scaleX: 0.94,
        scaleY: 0.84,
        autoAlpha: 0.9,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      },
      'strike+=0.04'
    )
    .to(
      impact,
      {
        duration: 0.12,
        autoAlpha: 0.55,
        scale: 0.84,
        ease: 'sine.out',
        yoyo: true,
        repeat: 1
      },
      'strike+=0.06'
    )
    .to(
      echo,
      {
        duration: 0.2,
        autoAlpha: 0.18,
        scale: 1.16,
        ease: 'sine.out'
      },
      'strike+=0.08'
    )
    .to(
      malletTrail,
      {
        duration: 0.12,
        autoAlpha: 0.14,
        scaleX: 0.96,
        x: 0.8,
        y: -0.8,
        ease: 'power1.out',
        yoyo: true,
        repeat: 1
      },
      'strike'
    )
    .addLabel('settle', 1.28)
    .to(
      [stage, roleArt, body, head, beads, arm, mallet, sleeve, robeFold, halo],
      {
        duration: 0.5,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        autoAlpha: 1,
        ease: 'sine.out'
      },
      'settle'
    )
    .to(
      echo,
      {
        duration: 0.5,
        autoAlpha: 0,
        scale: 1.24,
        ease: 'sine.out'
      },
      'settle'
    );

  return timeline;
}

function buildMonkWorkingTimeline(root: HTMLElement) {
  const {
    stage,
    roleArt,
    halo,
    body,
    head,
    beads,
    arm,
    sleeve,
    robeFold,
    mallet,
    malletTrail,
    woodfishShell,
    woodfishSlot,
    impact,
    echo
  } = getMonkTimelineTargets(root);

  if (
    !stage ||
    !roleArt ||
    !halo ||
    !body ||
    !head ||
    !beads ||
    !arm ||
    !sleeve ||
    !robeFold ||
    !mallet ||
    !malletTrail ||
    !woodfishShell ||
    !woodfishSlot ||
    !impact ||
    !echo
  ) {
    return null;
  }

  const timeline = gsap.timeline({
    paused: false,
    repeat: -1,
    defaults: {
      ease: 'none'
    }
  });

  timeline
    .addLabel('reset')
    .set([impact, echo], {
      autoAlpha: 0,
      scale: 0.35
    })
    .addLabel('lift', 0)
    .to(
      [stage, roleArt],
      {
        duration: 0.18,
        y: -1.5,
        rotation: -1.4,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      [body, head, beads],
      {
        duration: 0.2,
        x: -1,
        y: -1.5,
        rotation: -2,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      arm,
      {
        duration: 0.2,
        rotation: -7,
        svgOrigin: MONK_ARM_ORIGIN,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      mallet,
      {
        duration: 0.2,
        rotation: -52,
        svgOrigin: MONK_MALLET_ORIGIN,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      [sleeve, robeFold],
      {
        duration: 0.2,
        x: -1.5,
        rotation: -4.5,
        ease: 'power2.out'
      },
      'lift'
    )
    .to(
      halo,
      {
        duration: 0.22,
        autoAlpha: 0.3,
        scale: 1.05,
        ease: 'sine.out'
      },
      'lift'
    )
    .to(
      malletTrail,
      {
        duration: 0.1,
        autoAlpha: 0.08,
        scaleX: 0.88,
        x: -1,
        y: -3
      },
      'lift+=0.08'
    )
    .addLabel('strike', 0.24)
    .to(
      arm,
      {
        duration: 0.12,
        rotation: 2.2,
        svgOrigin: MONK_ARM_ORIGIN,
        ease: 'power4.in'
      },
      'strike'
    )
    .to(
      mallet,
      {
        duration: 0.12,
        rotation: 5,
        svgOrigin: MONK_MALLET_ORIGIN,
        ease: 'power4.in'
      },
      'strike'
    )
    .to(
      [sleeve, robeFold],
      {
        duration: 0.12,
        x: 1,
        rotation: 4.5,
        ease: 'power4.in'
      },
      'strike'
    )
    .to(
      [body, head, beads],
      {
        duration: 0.12,
        x: 0.8,
        y: 0.8,
        rotation: 1.4,
        ease: 'power4.in'
      },
      'strike'
    )
    .to(
      [stage, roleArt],
      {
        duration: 0.12,
        y: 0.8,
        rotation: 1.2,
        ease: 'power4.in'
      },
      'strike'
    )
    .to(
      woodfishShell,
      {
        duration: 0.08,
        scaleX: 0.94,
        scaleY: 0.88,
        ease: 'power3.out',
        yoyo: true,
        repeat: 1
      },
      'strike+=0.05'
    )
    .to(
      woodfishSlot,
      {
        duration: 0.08,
        scaleX: 0.9,
        scaleY: 0.72,
        autoAlpha: 0.96,
        ease: 'power3.out',
        yoyo: true,
        repeat: 1
      },
      'strike+=0.05'
    )
    .to(
      impact,
      {
        duration: 0.1,
        autoAlpha: 0.82,
        scale: 0.96,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      },
      'strike+=0.04'
    )
    .to(
      echo,
      {
        duration: 0.18,
        autoAlpha: 0.26,
        scale: 1.22,
        ease: 'sine.out'
      },
      'strike+=0.08'
    )
    .to(
      malletTrail,
      {
        duration: 0.14,
        autoAlpha: 0.28,
        scaleX: 1,
        x: 1,
        y: -1,
        ease: 'power1.out',
        yoyo: true,
        repeat: 1
      },
      'strike'
    )
    .addLabel('recover', 0.48)
    .to(
      [stage, roleArt, body, head, beads, arm, mallet, sleeve, robeFold, halo],
      {
        duration: 0.24,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        autoAlpha: 1,
        ease: 'sine.out'
      },
      'recover'
    )
    .to(
      echo,
      {
        duration: 0.16,
        autoAlpha: 0,
        scale: 1.28,
        ease: 'sine.out'
      },
      'recover'
    );

  return timeline;
}

// ---------------------------------------------------------------------------
// Merit particle interval by activity
// ---------------------------------------------------------------------------

const MERIT_INTERVAL: Record<string, number> = {
  idle: 1780,
  working: 720,
  waiting: 2100,
  blocked: 2100,
};

// ---------------------------------------------------------------------------
// DesktopPet component
// ---------------------------------------------------------------------------

export function DesktopPet({
  petName,
  petId,
  connectionStatus,
  appearance,
  petStatus,
  onSendMessage,
  onCreateTask
}: {
  petName: string;
  petId?: string;
  connectionStatus: ConnectionStatus;
  appearance?: PetAppearanceConfig;
  petStatus?:
    | 'idle'
    | 'thinking'
    | 'working'
    | 'waiting'
    | 'collaborating'
    | 'done'
    | 'blocked'
    | 'disconnected';
  onSendMessage?: (text: string) => void;
  onCreateTask?: (prompt: string) => void;
}) {
  const isPanelOpen = useWidgetStore((state) => state.isPanelOpen);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);
  const [bubbleMode, setBubbleMode] = useState<'input' | 'status' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const petRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    isDragging: false,
    lastWindowX: 0,
    lastWindowY: 0
  });
  const greetingTimeoutRef = useRef<number | null>(null);
  const resolvedAppearance = resolvePetAppearance(appearance);
  const animationState = resolvePetAnimationState({
    petStatus,
    connectionStatus
  });
  const monkGsapMode =
    !resolvedAppearance.avatar && resolvedAppearance.rolePack === 'monk'
      ? animationState.activity === 'idle'
        ? 'idle'
        : animationState.activity === 'working'
          ? 'working'
          : null
      : null;
  const stageClassName = `desktop-pet__stage${resolvedAppearance.rolePack === 'monk' ? ' desktop-pet__stage--roomy' : ''}`;

  // Merit particles: monk only, during tapping states
  const showMerit =
    !resolvedAppearance.avatar &&
    resolvedAppearance.rolePack === 'monk' &&
    (animationState.activity === 'idle' ||
      animationState.activity === 'working' ||
      animationState.activity === 'waiting' ||
      animationState.activity === 'blocked');
  const meritInterval = MERIT_INTERVAL[animationState.activity] ?? 2100;
  const meritInitialDelay =
    animationState.activity === 'idle'
      ? 1060
      : animationState.activity === 'working'
        ? 300
        : 0;

  useEffect(() => {
    return () => {
      if (greetingTimeoutRef.current !== null) {
        window.clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!monkGsapMode || !petRef.current || prefersReducedMotion()) {
      return;
    }

    let timeline: ReturnType<typeof buildMonkIdleTimeline> | ReturnType<typeof buildMonkWorkingTimeline> =
      null;
    const context = gsap.context(() => {
      timeline =
        monkGsapMode === 'idle'
          ? buildMonkIdleTimeline(petRef.current!)
          : buildMonkWorkingTimeline(petRef.current!);
    }, petRef);

    return () => {
      timeline?.kill();
      context.revert();
    };
  }, [monkGsapMode]);

  function triggerGreeting() {
    if (greetingTimeoutRef.current !== null) {
      window.clearTimeout(greetingTimeoutRef.current);
    }

    setIsGreeting(true);
    greetingTimeoutRef.current = window.setTimeout(() => {
      setIsGreeting(false);
      greetingTimeoutRef.current = null;
    }, 900);
  }

  async function togglePanel() {
    const result = await getHabitatDesktopApi()?.togglePanel();

    if (result) {
      widgetStore.getState().setPanelOpen(result.isOpen);
      return;
    }

    widgetStore.getState().togglePanel();
  }

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const handleContextAction = useCallback(
    (actionId: string) => {
      if (actionId === 'chat') {
        setBubbleMode('input');
      } else if (actionId === 'task') {
        setBubbleMode('input');
      } else if (actionId === 'status') {
        setBubbleMode('status');
      } else if (actionId.startsWith('switch:')) {
        // Character switch is handled upstream via appearance config
      }
      setContextMenu(null);
    },
    []
  );

  const handleBubbleSend = useCallback(
    (text: string) => {
      if (onSendMessage) {
        onSendMessage(text);
      }
    },
    [onSendMessage]
  );

  // Status text for bubble
  const statusTextMap: Record<string, string> = {
    idle: 'Idle — ready for a task',
    thinking: 'Thinking...',
    working: 'Working on it...',
    waiting: 'Waiting for input...',
    done: 'Task complete!',
    blocked: 'Something went wrong',
  };

  return (
    <main className="desktop-pet-shell">
      {/* Chat / status bubble */}
      <PetBubble
        mode={bubbleMode}
        statusText={statusTextMap[animationState.activity] ?? ''}
        onSend={handleBubbleSend}
        onClose={() => setBubbleMode(null)}
      />
      <button
        ref={petRef}
        type="button"
        className={`desktop-pet desktop-pet--frameless desktop-pet--${connectionStatus} desktop-pet--state-${animationState.activity} desktop-pet--activity-${animationState.activity} desktop-pet--mood-${animationState.mood} desktop-pet--role-${resolvedAppearance.rolePack}${monkGsapMode ? ` desktop-pet--monk-gsap desktop-pet--monk-gsap-${monkGsapMode}` : ''}${isPanelOpen ? ' desktop-pet--active desktop-pet--interaction-panel-open' : ''}${isHovered ? ' desktop-pet--interaction-hovered' : ''}${isPressed ? ' desktop-pet--interaction-pressed' : ''}${isFocused ? ' desktop-pet--interaction-focused' : ''}${isDragging ? ' desktop-pet--interaction-dragging' : ''}${isGreeting ? ' desktop-pet--interaction-greeting' : ''}`}
        aria-label={`${petName} desktop pet`}
        title="Drag to move. Click to chat. Double-click to open panel. Right-click for menu."
        onContextMenu={handleContextMenu}
        onDoubleClick={() => {
          triggerGreeting();
          void togglePanel();
        }}
        onClick={() => {
          if (!dragStateRef.current.isDragging) {
            setBubbleMode((prev) => (prev === 'input' ? null : 'input'));
          }
        }}
        onFocus={() => {
          setIsFocused(true);
          triggerGreeting();
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            triggerGreeting();
            void togglePanel();
          }
        }}
        onPointerEnter={() => {
          setIsHovered(true);
          triggerGreeting();
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onPointerDown={(event) => {
          setIsPressed(true);
          dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            isDragging: false,
            lastWindowX: 0,
            lastWindowY: 0
          };
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragStateRef.current.pointerId !== event.pointerId) {
            return;
          }

          const movedEnough =
            Math.abs(event.clientX - dragStateRef.current.startX) > 6 ||
            Math.abs(event.clientY - dragStateRef.current.startY) > 6;

          if (!movedEnough) {
            return;
          }

          dragStateRef.current.isDragging = true;
          setIsDragging(true);
          dragStateRef.current.lastWindowX = Math.round(
            event.screenX - dragStateRef.current.startX
          );
          dragStateRef.current.lastWindowY = Math.round(
            event.screenY - dragStateRef.current.startY
          );

          void getHabitatDesktopApi()?.movePetWindow({
            x: dragStateRef.current.lastWindowX,
            y: dragStateRef.current.lastWindowY
          });
        }}
        onPointerUp={(event) => {
          if (dragStateRef.current.pointerId !== event.pointerId) {
            return;
          }

          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture?.(event.pointerId);
          }

          setIsPressed(false);
          setIsDragging(false);

          if (dragStateRef.current.isDragging) {
            void getHabitatDesktopApi()?.persistPetWindowPosition({
              x: dragStateRef.current.lastWindowX,
              y: dragStateRef.current.lastWindowY
            });
          }

          dragStateRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            isDragging: false,
            lastWindowX: 0,
            lastWindowY: 0
          };
        }}
        onPointerCancel={(event) => {
          if (dragStateRef.current.pointerId !== event.pointerId) {
            return;
          }

          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture?.(event.pointerId);
          }

          setIsPressed(false);
          setIsDragging(false);

          dragStateRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            isDragging: false,
            lastWindowX: 0,
            lastWindowY: 0
          };
        }}
      >
        <span className={stageClassName} aria-hidden="true">
          {resolvedAppearance.avatar ? (
            <span className="desktop-pet__custom-art">
              <img className="desktop-pet__avatar" src={resolvedAppearance.avatar} alt="" />
            </span>
          ) : (
            <span
              className={`desktop-pet__role-art-motion desktop-pet__role-art-motion--${resolvedAppearance.rolePack}`}
            >
              <DesktopPetIllustration rolePack={resolvedAppearance.rolePack} />
            </span>
          )}
          {/* Legacy merit badge (used by GSAP working timeline) */}
          {resolvedAppearance.rolePack === 'monk' && monkGsapMode === 'working' ? (
            <span className="desktop-pet__merit-badge">功德+1</span>
          ) : null}
          {/* New merit particle system — floating 功德+1 for idle/working/waiting */}
          <MeritParticles
            active={showMerit}
            petId={petId}
            intervalMs={meritInterval}
            initialDelayMs={meritInitialDelay}
          />
        </span>
        <span className="desktop-pet__label">{petName}</span>
      </button>

      {/* Right-click context menu */}
      {contextMenu ? (
        <PetContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          currentRole={resolvedAppearance.rolePack}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </main>
  );
}
