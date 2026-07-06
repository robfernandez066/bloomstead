import Phaser from 'phaser';
import type { TutorialSystem } from '../systems/TutorialSystem';

const PANEL_FILL = 0xf7edc7;
const PANEL_STROKE = 0x6f5734;
const BUTTON_FILL = 0x6f5734;
const TEXT_COLOR = '#2f3b26';
const BUTTON_TEXT_COLOR = '#fff4d0';

interface TutorialPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onAcknowledge: () => void;
}

export class TutorialPanelSystem {
  private readonly scene: Phaser.Scene;
  private readonly tutorialSystem: TutorialSystem;
  private config?: TutorialPanelConfig;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, tutorialSystem: TutorialSystem) {
    this.scene = scene;
    this.tutorialSystem = tutorialSystem;
  }

  render(config: TutorialPanelConfig): void {
    this.config = config;
    this.refresh();
  }

  refresh(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearObjects();

    const step = this.tutorialSystem.getCurrentStep();

    if (step === null) {
      return;
    }

    const panel = this.scene.add
      .rectangle(this.config.x, this.config.y, this.config.width, this.config.height, PANEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setDepth(120);

    this.objects.push(panel);

    const textWidth = step.requiresAcknowledgement
      ? this.config.width - 96
      : this.config.width - 20;

    this.objects.push(
      this.scene.add
        .text(this.config.x + 10, this.config.y + 10, step.message, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          lineSpacing: 2,
          wordWrap: { width: textWidth }
        })
        .setDepth(121)
    );

    if (step.requiresAcknowledgement) {
      this.renderAcknowledgeButton(step.id === 'complete' ? 'Done' : 'Start');
    }
  }

  private renderAcknowledgeButton(label: string): void {
    if (this.config === undefined) {
      return;
    }

    const buttonWidth = 66;
    const buttonHeight = 30;
    const buttonX = this.config.x + this.config.width - buttonWidth - 10;
    const buttonY = this.config.y + (this.config.height - buttonHeight) / 2;

    const button = this.scene.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, BUTTON_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(122);

    button.on('pointerdown', () => {
      this.config?.onAcknowledge();
    });

    this.objects.push(
      button,
      this.scene.add
        .text(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, label, {
          color: BUTTON_TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(123)
    );
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
