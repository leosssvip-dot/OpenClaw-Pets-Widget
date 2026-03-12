/**
 * MultiPetShell — renders multiple pet instances on screen simultaneously.
 *
 * Each connected agent gets its own DesktopPet instance with independent
 * animation state, merit counter, and interaction handlers.
 *
 * Layout: pets are arranged horizontally with a stagger offset so they
 * don't overlap but still feel like a group.
 */

import { useCallback } from 'react';
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

interface MultiPetShellProps {
  pets: PetSlot[];
  connectionStatus: ConnectionStatus;
  activePetId: string | null;
  onSendMessage?: (petId: string, text: string) => void;
  onCreateTask?: (petId: string, prompt: string) => void;
  onSelectPet?: (petId: string) => void;
}

export function MultiPetShell({
  pets,
  connectionStatus,
  activePetId,
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

  // Multi-pet layout
  return (
    <div className="multi-pet-shell">
      {pets.map((pet, index) => (
        <div
          key={pet.petId}
          className={`multi-pet-shell__slot${pet.petId === activePetId ? ' multi-pet-shell__slot--active' : ''}`}
          style={{
            '--slot-index': index,
            '--slot-count': pets.length,
          } as React.CSSProperties}
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
      ))}
    </div>
  );
}
