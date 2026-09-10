import Phaser from 'phaser';
import type { MountGame } from '../types';
import { AirHockeyScene } from './Scene';
import { TABLE_WIDTH, TABLE_HEIGHT } from './model';

export const mount: MountGame = (parent, onChange) => {
  const scene = new AirHockeyScene(parent, onChange);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: TABLE_WIDTH, height: TABLE_HEIGHT,
    backgroundColor: '#12172b', scene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true }, audio: { noAudio: true },
  });
  return { start: () => scene.start(), pause: () => scene.pause(), restart: () => scene.restart(), destroy: () => game.destroy(true) };
};
