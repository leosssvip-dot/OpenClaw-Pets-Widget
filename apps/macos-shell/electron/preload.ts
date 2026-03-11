import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { contextBridge, ipcRenderer } from 'electron';
import type { GatewaySessionAuth } from '../src/runtime/gateway-session-auth';

contextBridge.exposeInMainWorld('habitat', {
  getRuntimeInfo: () => ipcRenderer.invoke('runtime:getInfo'),
  prepareGatewayConnection: (input: {
    profile: GatewayProfile;
    sessionAuth?: GatewaySessionAuth;
  }) => ipcRenderer.invoke('gateway:prepareConnection', input),
  teardownGatewayConnection: () => ipcRenderer.invoke('gateway:teardownConnection'),
  movePetWindow: (payload: { x: number; y: number }) =>
    ipcRenderer.invoke('window:movePet', payload),
  togglePanel: () => ipcRenderer.invoke('window:togglePanel'),
  snapPetWindow: () => ipcRenderer.invoke('window:snapPet'),
  storeSecret: (key: string, value: string) =>
    ipcRenderer.invoke('secrets:store', { key, value }),
  retrieveSecret: (key: string) =>
    ipcRenderer.invoke('secrets:retrieve', { key }) as Promise<string | null>,
  deleteSecret: (key: string) =>
    ipcRenderer.invoke('secrets:delete', { key })
});
