import { Tray, nativeImage } from 'electron';

export function createHabitatTray() {
  const tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip('OpenClaw Agent Habitat');
  return tray;
}
