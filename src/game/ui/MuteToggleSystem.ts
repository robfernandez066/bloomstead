import Phaser from 'phaser';
import type { AudioSystem } from '../systems/AudioSystem';

const BUTTON_FILL = 0xe8f0bb;
const MUTED_FILL = 0x9ca28e;
const BUTTON_STROKE = 0x5e6b45;
const TEXT_COLOR = '#263522';
const MUTED_TEXT = '#ece7d7';

interface MuteToggleConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onToggle: () => void;
}

export class MuteToggleSystem {
  private readonly scene: Phaser.Scene;
  private readonly audioSystem: AudioSystem;
  private config?: MuteToggleConfig;
  private button?: Phaser.GameObjects.Rectangle;
  private label?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, audioSystem: AudioSystem) {
    this.scene = scene;
    this.audioSystem = audioSystem;
  }

  render(config: MuteToggleConfig): void {
    this.config = config;

    this.button = this.scene.add
      .rectangle(config.x, config.y, config.width, config.height, BUTTON_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true });

    this.button.on('pointerdown', () => {
      this.audioSystem.playButtonTap();
      this.audioSystem.toggleMuted();
      this.refresh();
      config.onToggle();
    });

    this.label = this.scene.add
      .text(config.x + config.width / 2, config.y + config.height / 2, '', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.refresh();
  }

  refresh(): void {
    if (this.config === undefined) {
      return;
    }

    const muted = this.audioSystem.isMuted();

    this.button?.setFillStyle(muted ? MUTED_FILL : BUTTON_FILL);
    this.button?.setAlpha(muted ? 0.78 : 1);
    this.label?.setText(muted ? 'SFX Off' : 'SFX On');
    this.label?.setColor(muted ? MUTED_TEXT : TEXT_COLOR);
  }
}
