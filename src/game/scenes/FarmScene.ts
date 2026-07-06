import Phaser from 'phaser';

export class FarmScene extends Phaser.Scene {
  constructor() {
    super('FarmScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x8fcf8a);
    this.add.rectangle(width / 2, height * 0.72, width * 0.82, height * 0.34, 0x6aa45f);

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
