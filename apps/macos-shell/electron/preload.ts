import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { contextBridge, ipcRenderer } from 'electron';
import type { GatewaySessionAuth } from '../src/runtime/gateway-session-auth';

contextBridge.exposeInMainWorld('habitat', {
  getRuntimeInfo: () => ipcRenderer.invoke('runtime:getInfo'),
  sendHabitatSync: (msg: unknown) => ipcRenderer.send('habitat:sync', msg),
  onHabitatSync: (callback: (msg: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, msg: unknown) => callback(msg);
    ipcRenderer.on('habitat:sync', handler);
    return () => { ipcRenderer.removeListener('habitat:sync', handler); };
  },
  prepareGatewayConnection: (input: {
    profile: GatewayProfile;
    sessionAuth?: GatewaySessionAuth;
  }) => ipcRenderer.invoke('gateway:prepareConnection', input),
  teardownGatewayConnection: () => ipcRenderer.invoke('gateway:teardownConnection'),
  movePetWindow: (payload: { x: number; y: number }) =>
    ipcRenderer.invoke('window:movePet', payload),
  persistPetWindowPosition: (payload: { x: number; y: number }) =>
    ipcRenderer.invoke('window:persistPetPosition', payload),
  setPetWindowSize: (size: { width: number; height: number }) =>
    ipcRenderer.invoke('window:setPetWindowSize', size),
  togglePanel: () => ipcRenderer.invoke('window:togglePanel'),
  showPetContextMenu: (items: Array<{ id: string; label: string; type?: string; enabled?: boolean; checked?: boolean }>) =>
    ipcRenderer.invoke('window:showPetContextMenu', { items }) as Promise<string | null>,
  storeSecret: (key: string, value: string) =>
    ipcRenderer.invoke('secrets:store', { key, value }),
  retrieveSecret: (key: string) =>
    ipcRenderer.invoke('secrets:retrieve', { key }) as Promise<string | null>,
  deleteSecret: (key: string) =>
    ipcRenderer.invoke('secrets:delete', { key }),
  readSettings: () =>
    ipcRenderer.invoke('settings:read') as Promise<string | null>,
  writeSettings: (data: string) =>
    ipcRenderer.invoke('settings:write', { data })
});
