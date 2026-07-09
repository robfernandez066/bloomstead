import Phaser from 'phaser';
import type { AudioSystem } from '../systems/AudioSystem';

const BUTTON_FILL = 0xe8f0bb;
const PANEL_FILL = 0xf7edc7;
const DISABLED_FILL = 0x9ca28e;
const OVERLAY_FILL = 0x263522;
const BUTTON_STROKE = 0x5e6b45;
const TEXT_COLOR = '#263522';
const MUTED_TEXT = '#5f6a4f';
const DANGER_FILL = 0x473b35;
const DANGER_TEXT = '#fff7cc';
const DEPTH = 150;

interface MuteToggleConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onToggle: () => void;
  onResetSave: () => void;
}

export class MuteToggleSystem {
  private readonly scene: Phaser.Scene;
  private readonly audioSystem: AudioSystem;
  private config?: MuteToggleConfig;
  private button?: Phaser.GameObjects.Rectangle;
  private label?: Phaser.GameObjects.Text;
  private panelOpen = false;
  private confirmingReset = false;
  private resetInProgress = false;
  private readonly panelObjects: Phaser.GameObjects.GameObject[] = [];

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
      this.openPanel();
    });

    this.label = this.scene.add
      .text(config.x + config.width / 2, config.y + config.height / 2, 'Settings', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
  }

  refresh(): void {
    if (this.panelOpen) {
      this.renderPanel();
    }
  }

  private openPanel(): void {
    this.panelOpen = true;
    this.renderPanel();
  }

  private closePanel(): void {
    this.panelOpen = false;
    this.confirmingReset = false;
    this.clearPanelObjects();
  }

  private renderPanel(): void {
    if (this.config === undefined || !this.panelOpen) {
      return;
    }

    this.clearPanelObjects();

    const panelX = 46;
    const panelY = 156;
    const panelWidth = 298;
    const panelHeight = 184;

    const overlay = this.scene.add
      .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, OVERLAY_FILL, 0.2)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(DEPTH);

    overlay.on('pointerdown', () => {
      this.audioSystem.playButtonTap();
      this.closePanel();
    });

    const panel = this.scene.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, PANEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive()
      .setDepth(DEPTH + 1);

    const title = this.scene.add
      .text(panelX + 14, panelY + 12, 'Settings', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold'
      })
      .setDepth(DEPTH + 2);

    this.panelObjects.push(overlay, panel, title);
    this.renderCloseButton(panelX + panelWidth - 42, panelY + 10);

    if (this.confirmingReset) {
      this.renderResetConfirmation(panelX, panelY, panelWidth);
      return;
    }

    this.renderVolumeSlider('Music', this.audioSystem.getMusicVolume(), panelX + 18, panelY + 58, (volume) => {
      this.audioSystem.setMusicVolume(volume);
    });
    this.renderVolumeSlider('Sound', this.audioSystem.getSfxVolume(), panelX + 18, panelY + 104, (volume) => {
      this.audioSystem.setSfxVolume(volume);
    });
    this.renderResetButton(panelX + 18, panelY + 142, panelWidth - 36, 28);
  }

  private renderCloseButton(x: number, y: number): void {
    const button = this.scene.add
      .rectangle(x, y, 30, 30, DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 2);

    button.on('pointerdown', () => {
      this.audioSystem.playButtonTap();
      this.closePanel();
    });

    const text = this.scene.add
      .text(x + 15, y + 15, 'X', {
        color: '#ece7d7',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 3);

    this.panelObjects.push(button, text);
  }

  private renderVolumeSlider(
    label: string,
    value: number,
    x: number,
    y: number,
    onChange: (volume: number) => void
  ): void {
    const labelText = this.scene.add
      .text(x, y - 16, `${label}: ${Math.round(value * 100)}%`, {
        color: value > 0 ? TEXT_COLOR : MUTED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold'
      })
      .setDepth(DEPTH + 2);
    const trackX = x + 76;
    const trackY = y;
    const trackWidth = 168;
    const track = this.scene.add
      .rectangle(trackX, trackY, trackWidth, 9, DISABLED_FILL, 0.55)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 2);
    const fill = this.scene.add
      .rectangle(trackX, trackY, trackWidth * value, 9, BUTTON_FILL, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH + 3);
    const knob = this.scene.add
      .circle(trackX + trackWidth * value, trackY, 7, BUTTON_FILL, 1)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 4);

    const updateVisuals = (volume: number): void => {
      labelText.setText(`${label}: ${Math.round(volume * 100)}%`);
      labelText.setColor(volume > 0 ? TEXT_COLOR : MUTED_TEXT);
      fill.setSize(trackWidth * volume, 9);
      knob.setX(trackX + trackWidth * volume);
    };

    const setVolumeFromPointer = (pointer: Phaser.Input.Pointer): void => {
      const volume = Phaser.Math.Clamp((pointer.x - trackX) / trackWidth, 0, 1);

      onChange(volume);
      this.config?.onToggle();
      updateVisuals(volume);
    };

    track.on('pointerdown', setVolumeFromPointer);
    knob.on('pointerdown', setVolumeFromPointer);
    track.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        setVolumeFromPointer(pointer);
      }
    });
    knob.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        setVolumeFromPointer(pointer);
      }
    });

    this.panelObjects.push(labelText, track, fill, knob);
  }

  private renderResetButton(x: number, y: number, width: number, height: number): void {
    const button = this.scene.add
      .rectangle(x, y, width, height, DANGER_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 2);

    button.on('pointerdown', () => {
      this.audioSystem.playButtonTap();
      this.confirmingReset = true;
      this.renderPanel();
    });

    const text = this.scene.add
      .text(x + width / 2, y + height / 2, 'Dev Reset', {
        color: DANGER_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 3);

    this.panelObjects.push(button, text);
  }

  private renderResetConfirmation(panelX: number, panelY: number, panelWidth: number): void {
    const warning = this.scene.add
      .text(panelX + 18, panelY + 64, 'Reset all progress?', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold'
      })
      .setDepth(DEPTH + 2);
    const details = this.scene.add
      .text(panelX + 18, panelY + 92, 'Your farm, inventory, and upgrades will be lost.', {
        color: MUTED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        wordWrap: { width: panelWidth - 36 }
      })
      .setDepth(DEPTH + 2);

    this.panelObjects.push(warning, details);
    this.renderConfirmationButton(panelX + 18, panelY + 134, 124, 'Yes', DANGER_FILL, DANGER_TEXT, () => {
      if (this.resetInProgress) {
        return;
      }

      this.resetInProgress = true;
      this.audioSystem.playButtonTap();
      this.config?.onResetSave();
    });
    this.renderConfirmationButton(panelX + panelWidth - 142, panelY + 134, 124, 'No', BUTTON_FILL, TEXT_COLOR, () => {
      this.audioSystem.playButtonTap();
      this.confirmingReset = false;
      this.renderPanel();
    });
  }

  private renderConfirmationButton(
    x: number,
    y: number,
    width: number,
    label: string,
    fillColor: number,
    textColor: string,
    onClick: () => void
  ): void {
    const button = this.scene.add
      .rectangle(x, y, width, 32, fillColor)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 2);

    button.on('pointerdown', onClick);

    const text = this.scene.add
      .text(x + width / 2, y + 16, label, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 3);

    this.panelObjects.push(button, text);
  }

  private clearPanelObjects(): void {
    for (const object of this.panelObjects) {
      object.destroy();
    }

    this.panelObjects.length = 0;
  }
}
