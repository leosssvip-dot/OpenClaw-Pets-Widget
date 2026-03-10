import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('habitat', {
  getRuntimeInfo: () => ipcRenderer.invoke('runtime:getInfo'),
  prepareGatewayConnection: (profile: GatewayProfile) =>
    ipcRenderer.invoke('gateway:prepareConnection', profile),
  teardownGatewayConnection: () => ipcRenderer.invoke('gateway:teardownConnection'),
  movePetWindow: (payload: { x: number; y: number }) =>
    ipcRenderer.invoke('window:movePet', payload),
  togglePanel: () => ipcRenderer.invoke('window:togglePanel'),
  snapPetWindow: () => ipcRenderer.invoke('window:snapPet')
});
