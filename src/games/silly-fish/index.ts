import Phaser from 'phaser';
import type { MountGame } from '../types';
import { SillyFishScene } from './Scene';
import { WIDTH, HEIGHT } from './model';

export const mount: MountGame = (parent, onChange) => {
  const scene = new SillyFishScene(parent, onChange);
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: WIDTH, height: HEIGHT, backgroundColor: '#131c35', scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true }, audio: { noAudio: true },
  });
  return { control: (action, pressed) => scene.control(action, pressed), start: () => scene.start(), pause: () => scene.pause(), restart: () => scene.restart(), destroy: () => game.destroy(true) };
};
