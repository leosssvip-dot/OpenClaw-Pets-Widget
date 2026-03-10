import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('habitat', {
  getRuntimeInfo: () => ipcRenderer.invoke('runtime:getInfo'),
  movePetWindow: (payload: { x: number; y: number }) =>
    ipcRenderer.invoke('window:movePet', payload),
  togglePanel: () => ipcRenderer.invoke('window:togglePanel'),
  snapPetWindow: () => ipcRenderer.invoke('window:snapPet')
});
