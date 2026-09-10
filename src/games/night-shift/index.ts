import Phaser from 'phaser';
import type { MountGame } from '../types';
import { NightShiftScene } from './Scene';
export const mount: MountGame = (parent, onChange) => {
  const scene = new NightShiftScene(parent, onChange);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: 800, height: 560, backgroundColor: '#080c1a', scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: false }, audio: { noAudio: true } });
  return { start: () => scene.start(), pause: () => scene.pause(), restart: () => scene.restart(), control: (action, pressed) => scene.control(action, pressed), destroy: () => game.destroy(true) };
};
