/**
 * Cross-window state sync via Electron IPC.
 *
 * The panel window publishes habitat events and pet lists.
 * The main process forwards them to the pet window which
 * applies them to its local zustand store.
 */

import type { HabitatEvent } from '@openclaw-habitat/bridge';
import type { HabitatPet } from '../features/habitat/types';
import type { PetAppearanceConfig } from '../features/widget/pet-appearance';
import { getHabitatDesktopApi } from './habitat-api';

export type SyncMessage =
  | { type: 'seedPets'; pets: HabitatPet[] }
  | { type: 'event'; event: HabitatEvent }
  | {
      type: 'uiState';
      selectedPetId: string | null;
      pinnedAgentId: string | null;
      appearances: Record<string, PetAppearanceConfig>;
    };

/** Panel window: send events to other windows via IPC */
export function createHabitatPublisher() {
  const api = getHabitatDesktopApi();

  return {
    publishSeedPets(pets: HabitatPet[]) {
      api?.sendHabitatSync?.({ type: 'seedPets', pets } satisfies SyncMessage);
    },
    publishEvent(event: HabitatEvent) {
      console.log('[bridge] publisher.publishEvent', event.kind, 'hasApi:', !!api, 'hasSendSync:', !!api?.sendHabitatSync);
      api?.sendHabitatSync?.({ type: 'event', event } satisfies SyncMessage);
    },
    dispose() {
      // no-op: IPC listeners are managed by the subscriber
    }
  };
}

/** Pet window: listen for events from the panel via IPC */
export function createHabitatSubscriber(handlers: {
  onSeedPets: (pets: HabitatPet[]) => void;
  onEvent: (event: HabitatEvent) => void;
  onUiState?: (state: {
    selectedPetId: string | null;
    pinnedAgentId: string | null;
    appearances: Record<string, PetAppearanceConfig>;
  }) => void;
}) {
  const api = getHabitatDesktopApi();
  console.log('[bridge] createHabitatSubscriber: hasApi:', !!api, 'hasOnSync:', !!api?.onHabitatSync);
  if (!api?.onHabitatSync) {
    console.log('[bridge] subscriber: no onHabitatSync, returning no-op');
    return { dispose() {} };
  }

  const unsubscribe = api.onHabitatSync((raw: unknown) => {
    const msg = raw as SyncMessage;
    console.log('[bridge] subscriber received:', msg.type, msg.type === 'event' ? (msg as { event: HabitatEvent }).event.kind : '');
    if (msg.type === 'seedPets') {
      handlers.onSeedPets(msg.pets);
    } else if (msg.type === 'event') {
      handlers.onEvent(msg.event);
    } else if (msg.type === 'uiState') {
      handlers.onUiState?.({
        selectedPetId: msg.selectedPetId,
        pinnedAgentId: msg.pinnedAgentId,
        appearances: msg.appearances,
      });
    }
  });

  return {
    dispose() {
      unsubscribe();
    }
  };
}
