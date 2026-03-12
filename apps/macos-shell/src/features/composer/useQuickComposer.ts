import { getRuntimeDeps } from '../../runtime/runtime-deps';
import { habitatStore } from '../habitat/store';

export function useQuickComposer(petId: string) {
  return async (content: string) => {
    if (!petId) {
      return;
    }

    habitatStore.getState().markPetAsThinking(petId, content);

    try {
      await getRuntimeDeps().bridge.sendMessage({
        petId,
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
