import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { FarmScene } from './game/scenes/FarmScene';
import { PreloadScene } from './game/scenes/PreloadScene';
import './style.css';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#7fbf7a',
  width: 390,
  height: 844,
  scene: [BootScene, PreloadScene, FarmScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844
  }
};

new Phaser.Game(gameConfig);
