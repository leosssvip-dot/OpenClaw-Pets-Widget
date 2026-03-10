import { habitatStore } from '../habitat/store';

export function useQuickComposer(petId: string) {
  return (content: string) => {
    if (!petId) {
      return;
    }

    habitatStore.getState().markPetAsThinking(petId, content);
  };
}
