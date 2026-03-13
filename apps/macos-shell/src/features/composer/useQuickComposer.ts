import { getRuntimeDeps } from '../../runtime/runtime-deps';
import { habitatStore } from '../habitat/store';

export function useQuickComposer(petId: string) {
  return async (content: string) => {
    if (!petId) {
      return;
    }

    const pet = habitatStore.getState().pets[petId];
    habitatStore.getState().markPetAsThinking(petId, content);

    try {
      await getRuntimeDeps().connectionManager.sendMessage({
        petId,
        agentId: pet?.agentId,
        content
      });
    } catch (error) {
      habitatStore.getState().markPetAsBlocked(
        petId,
        error instanceof Error ? error.message : String(error)
      );
    }
  };
}
