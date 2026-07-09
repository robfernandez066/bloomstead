import Phaser from 'phaser';
import { AUDIO_ASSETS } from '../data/AudioConfig';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    for (const asset of AUDIO_ASSETS) {
      this.load.audio(asset.key, asset.url);
    }
  }

  create(): void {
    this.scene.start('FarmScene');
  }
}
