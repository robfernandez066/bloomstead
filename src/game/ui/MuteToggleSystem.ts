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
  gap?: number;
  onToggle: () => void;
}

export class MuteToggleSystem {
  private readonly scene: Phaser.Scene;
  private readonly audioSystem: AudioSystem;
  private config?: MuteToggleConfig;
  private musicButton?: Phaser.GameObjects.Rectangle;
  private musicLabel?: Phaser.GameObjects.Text;
  private soundButton?: Phaser.GameObjects.Rectangle;
  private soundLabel?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, audioSystem: AudioSystem) {
    this.scene = scene;
    this.audioSystem = audioSystem;
  }

  render(config: MuteToggleConfig): void {
    this.config = config;
    const gap = config.gap ?? 4;

    this.musicButton = this.scene.add
      .rectangle(config.x, config.y, config.width, config.height, BUTTON_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true });

    this.musicButton.on('pointerdown', () => {
      this.audioSystem.playButtonTap();
      this.audioSystem.toggleMusic();
      this.refresh();
      config.onToggle();
    });

    this.musicLabel = this.scene.add
      .text(config.x + config.width / 2, config.y + config.height / 2, '', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.soundButton = this.scene.add
      .rectangle(config.x, config.y + config.height + gap, config.width, config.height, BUTTON_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true });

    this.soundButton.on('pointerdown', () => {
      const sfxOn = this.audioSystem.toggleSfx();

      if (sfxOn) {
        this.audioSystem.playButtonTap();
      }

      this.refresh();
      config.onToggle();
    });

    this.soundLabel = this.scene.add
      .text(config.x + config.width / 2, config.y + config.height + gap + config.height / 2, '', {
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

    const musicOn = this.audioSystem.isMusicOn();
    const sfxOn = this.audioSystem.isSfxOn();

    this.musicButton?.setFillStyle(musicOn ? BUTTON_FILL : MUTED_FILL);
    this.musicButton?.setAlpha(musicOn ? 1 : 0.45);
    this.musicLabel?.setText('Music');
    this.musicLabel?.setColor(musicOn ? TEXT_COLOR : MUTED_TEXT);

    this.soundButton?.setFillStyle(sfxOn ? BUTTON_FILL : MUTED_FILL);
    this.soundButton?.setAlpha(sfxOn ? 1 : 0.45);
    this.soundLabel?.setText('Sound');
    this.soundLabel?.setColor(sfxOn ? TEXT_COLOR : MUTED_TEXT);
  }
}
