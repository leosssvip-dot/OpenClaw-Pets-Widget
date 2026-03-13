/**
 * MultiPetShell — renders multiple pet instances on screen simultaneously.
 *
 * Layout: row（一字排开）或 circle（主 agent 居中，其余环绕）。
 * Group 模式下统一缩小约 40%，无 hover 放大。
 */

import type { ConnectionStatus } from '../connection/ConnectionBadge';
import type { PetAppearanceConfig } from './pet-appearance';
import { DesktopPet } from './DesktopPet';

export interface PetSlot {
  petId: string;
  petName: string;
  agentId: string;
  status:
    | 'idle'
    | 'thinking'
    | 'working'
    | 'waiting'
    | 'collaborating'
    | 'done'
    | 'blocked'
    | 'disconnected';
  appearance?: PetAppearanceConfig;
}

export type GroupLayoutMode = 'row' | 'circle';

interface MultiPetShellProps {
  pets: PetSlot[];
  connectionStatus: ConnectionStatus;
  activePetId: string | null;
  layoutMode?: GroupLayoutMode;
  onSendMessage?: (petId: string, text: string) => void;
  onCreateTask?: (petId: string, prompt: string) => void;
  onSelectPet?: (petId: string) => void;
}

const CIRCLE_RADIUS_PX = 72;

export function MultiPetShell({
  pets,
  connectionStatus,
  activePetId,
  layoutMode = 'row',
  onSendMessage,
  onCreateTask,
  onSelectPet,
}: MultiPetShellProps) {
  // If single pet, render directly (no multi layout)
  if (pets.length <= 1) {
    const pet = pets[0];
    if (!pet) return null;

    return (
      <DesktopPet
        petName={pet.petName}
        connectionStatus={connectionStatus}
        appearance={pet.appearance}
        petStatus={pet.status}
        petId={pet.petId}
        onSendMessage={
          onSendMessage
            ? (text: string) => onSendMessage(pet.petId, text)
            : undefined
        }
        onCreateTask={
          onCreateTask
            ? (prompt: string) => onCreateTask(pet.petId, prompt)
            : undefined
        }
      />
    );
  }

  const isCircle = layoutMode === 'circle';
  // 圆形布局：主 agent 居中，其余按角度环绕
  const orderedPets = isCircle && activePetId
    ? (() => {
        const active = pets.find((p) => p.petId === activePetId);
        const others = pets.filter((p) => p.petId !== activePetId);
        return active ? [active, ...others] : pets;
      })()
    : pets;

  return (
    <div
      className={`multi-pet-shell multi-pet-shell--${layoutMode}`}
      data-layout={layoutMode}
    >
      {orderedPets.map((pet, index) => {
        const isActive = pet.petId === activePetId;
        const slotStyle: React.CSSProperties = {
          '--slot-index': index,
          '--slot-count': pets.length,
        } as React.CSSProperties;
        if (isCircle) {
          if (index === 0) {
            (slotStyle as Record<string, string>)['--slot-dx'] = '0';
            (slotStyle as Record<string, string>)['--slot-dy'] = '0';
          } else {
            const n = orderedPets.length - 1;
            const angleDeg = ((index - 1) / Math.max(n, 1)) * 360;
            const angleRad = (angleDeg * Math.PI) / 180;
            const dx = Math.round(CIRCLE_RADIUS_PX * Math.cos(angleRad));
            const dy = Math.round(CIRCLE_RADIUS_PX * Math.sin(angleRad));
            (slotStyle as Record<string, string>)['--slot-dx'] = `${dx}px`;
            (slotStyle as Record<string, string>)['--slot-dy'] = `${dy}px`;
          }
        }
        return (
          <div
            key={pet.petId}
            className={`multi-pet-shell__slot${isActive ? ' multi-pet-shell__slot--active' : ''}`}
            style={slotStyle}
            onClick={() => onSelectPet?.(pet.petId)}
          >
            <DesktopPet
              petName={pet.petName}
              connectionStatus={connectionStatus}
              appearance={pet.appearance}
              petStatus={pet.status}
              petId={pet.petId}
              onSendMessage={
                onSendMessage
                  ? (text: string) => onSendMessage(pet.petId, text)
                  : undefined
              }
              onCreateTask={
                onCreateTask
                  ? (prompt: string) => onCreateTask(pet.petId, prompt)
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}
