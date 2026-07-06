import Phaser from 'phaser';
import { GridSystem } from '../systems/GridSystem';

export class FarmScene extends Phaser.Scene {
  constructor() {
    super('FarmScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x8fcf8a);
    this.add.rectangle(width / 2, height * 0.72, width * 0.82, height * 0.34, 0x6aa45f);

    const gridSystem = new GridSystem(this, {
      rows: 6,
      columns: 6,
      unlockedTileCount: 12,
      tileWidth: 56,
      tileHeight: 28,
      originX: width / 2,
      originY: height * 0.38
    });

    gridSystem.render();

    this.add
      .text(width / 2, height * 0.18, 'Bloomstead Farm Scene Loaded', {
        color: '#243524',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: width * 0.82 }
      })
      .setOrigin(0.5);
  }
}
