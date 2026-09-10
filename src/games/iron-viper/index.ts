import Phaser from 'phaser';
import type { MountGame } from '../types';
import { IronViperScene } from './Scene';
import { WIDTH, HEIGHT } from './config';
export const mount: MountGame = (parent, onChange) => {
  const scene = new IronViperScene(parent, onChange);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: WIDTH, height: HEIGHT, backgroundColor: '#10182c', scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: false, roundPixels: true }, audio: { noAudio: true } });
  return { start: () => scene.start(), pause: () => scene.pause(), restart: () => scene.restart(), control: (action, pressed) => scene.control(action, pressed), destroy: () => game.destroy(true) };
};
