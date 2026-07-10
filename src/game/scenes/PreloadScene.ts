import Phaser from 'phaser';
import { BLOCKING_AUDIO_ASSETS } from '../data/AudioConfig';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const { width, height } = this.scale;
    const barWidth = Math.min(280, width * 0.72);
    const barHeight = 18;
    const barInset = 2;
    const barX = (width - barWidth) / 2;
    const barY = height * 0.61;

    this.add.rectangle(width / 2, height / 2, width, height, 0x8fcf8a);
    this.add
      .text(width / 2, height * 0.42, 'Bloomstead', {
        color: '#fff7cc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
        stroke: '#3f512e',
        strokeThickness: 5
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.54, 'Loading...', {
        color: '#2f3b26',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, barY, barWidth, barHeight, 0xe8f0bb).setStrokeStyle(2, 0x5e6b45);
    const progressFill = this.add.graphics();
    const percentageText = this.add
      .text(width / 2, barY + 34, '0%', {
        color: '#2f3b26',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);

      progressFill.clear();
      progressFill.fillStyle(0x6fae57, 1);
      progressFill.fillRect(
        barX + barInset,
        barY - barHeight / 2 + barInset,
        (barWidth - barInset * 2) * clampedProgress,
        barHeight - barInset * 2
      );
      percentageText.setText(`${Math.round(clampedProgress * 100)}%`);
    });

    for (const asset of BLOCKING_AUDIO_ASSETS) {
      this.load.audio(asset.key, asset.url);
    }
  }

  create(): void {
    this.scene.start('FarmScene');
  }
}
