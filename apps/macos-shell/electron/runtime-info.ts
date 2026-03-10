export function resolveRuntimeSurface(
  senderId: number,
  windows: {
    petWindowId: number | null;
    panelWindowId: number | null;
  }
) {
  if (senderId === windows.petWindowId) {
    return 'pet' as const;
  }

  if (senderId === windows.panelWindowId) {
    return 'panel' as const;
  }

  return undefined;
}
