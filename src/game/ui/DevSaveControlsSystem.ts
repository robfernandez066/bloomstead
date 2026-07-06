import Phaser from 'phaser';

const BUTTON_FILL = 0x473b35;
const BUTTON_STROKE = 0xf4e6b3;
const TEXT_COLOR = '#fff7cc';

interface DevSaveControlsConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onResetSave: () => void;
}

export class DevSaveControlsSystem {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(config: DevSaveControlsConfig): void {
    const button = this.scene.add
      .rectangle(config.x, config.y, config.width, config.height, BUTTON_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      config.onResetSave();
    });

    this.scene.add
      .text(config.x + config.width / 2, config.y + config.height / 2, 'Dev Reset', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
  }
}
