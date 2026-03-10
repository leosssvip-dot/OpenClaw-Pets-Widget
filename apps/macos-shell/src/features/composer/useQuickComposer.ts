import { getRuntimeDeps } from '../../runtime/runtime-deps';
import { habitatStore } from '../habitat/store';

export function useQuickComposer(petId: string) {
  return async (content: string) => {
    if (!petId) {
      return;
    }

    await getRuntimeDeps().bridge.sendMessage({
      petId,
      content
    });
    habitatStore.getState().markPetAsThinking(petId, content);
  };
}
