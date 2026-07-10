import Phaser from 'phaser';
import type { TutorialSystem } from '../systems/TutorialSystem';
import type { TutorialStepId } from '../models/TutorialTypes';

const PANEL_FILL = 0xf7edc7;
const PANEL_STROKE = 0x496d3e;
const PANEL_SHADOW = 0x263b2a;
const PANEL_HEADER_FILL = 0x294f32;
const PANEL_HIGHLIGHT = 0xffe27a;
const BUTTON_FILL = 0x496d3e;
const TEXT_COLOR = '#2f3b26';
const BUTTON_TEXT_COLOR = '#fff4d0';
const HEADER_TEXT_COLOR = '#fff4d0';
const HEADER_HEIGHT = 22;

interface TutorialBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TutorialPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onAcknowledge: () => void;
  getPanelBounds?: (stepId: TutorialStepId) => TutorialBounds;
  getTargetBounds?: (stepId: TutorialStepId) => TutorialBounds | null;
  shouldUseArrow?: (stepId: TutorialStepId) => boolean;
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

    const panelBounds = this.config.getPanelBounds?.(step.id) ?? this.config;
    const targetBounds = this.config.getTargetBounds?.(step.id) ?? null;

    if (targetBounds !== null) {
      this.renderTargetGuidance(panelBounds, targetBounds);
    }

    const shadow = this.scene.add
      .rectangle(panelBounds.x + 3, panelBounds.y + 4, panelBounds.width, panelBounds.height, PANEL_SHADOW, 0.26)
      .setOrigin(0, 0)
      .setDepth(120);
    const panel = this.scene.add
      .rectangle(panelBounds.x, panelBounds.y, panelBounds.width, panelBounds.height, PANEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(3, PANEL_STROKE)
      .setDepth(121);
    const header = this.scene.add
      .rectangle(panelBounds.x, panelBounds.y, panelBounds.width, HEADER_HEIGHT, PANEL_HEADER_FILL)
      .setOrigin(0, 0)
      .setDepth(122);
    const headerText = this.scene.add
      .text(panelBounds.x + 10, panelBounds.y + 4, 'FARM GUIDE', {
        color: HEADER_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        letterSpacing: 1
      })
      .setDepth(123);

    this.objects.push(shadow, panel, header, headerText);

    if (step.id === 'complete') {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0.72,
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const textWidth = step.requiresAcknowledgement
      ? panelBounds.width - 106
      : panelBounds.width - 20;

    this.objects.push(
      this.scene.add
          .text(panelBounds.x + 10, panelBounds.y + HEADER_HEIGHT + 6, step.message, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          lineSpacing: 2,
          wordWrap: { width: textWidth }
        })
        .setDepth(123)
    );

    if (step.requiresAcknowledgement) {
      this.renderAcknowledgeButton(panelBounds, step.id === 'complete' ? 'Complete' : 'Next');
    }
  }

  private renderTargetGuidance(panelBounds: TutorialBounds, targetBounds: TutorialBounds): void {
    const highlight = this.scene.add
      .rectangle(
        targetBounds.x,
        targetBounds.y,
        targetBounds.width,
        targetBounds.height,
        PANEL_HIGHLIGHT,
        0.12
      )
      .setOrigin(0, 0)
      .setStrokeStyle(3, PANEL_HIGHLIGHT)
      .setDepth(118);

    this.scene.tweens.add({
      targets: highlight,
      alpha: 0.32,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.objects.push(highlight);

    const step = this.tutorialSystem.getCurrentStep();

    if (step !== null && this.config?.shouldUseArrow?.(step.id) === true) {
      this.renderArrow(panelBounds, targetBounds);
    }
  }

  private renderArrow(panelBounds: TutorialBounds, targetBounds: TutorialBounds): void {
    const graphics = this.scene.add.graphics().setDepth(119);
    const panelCenterX = panelBounds.x + panelBounds.width / 2;
    const panelCenterY = panelBounds.y + panelBounds.height / 2;
    const targetCenterX = targetBounds.x + targetBounds.width / 2;
    const targetCenterY = targetBounds.y + targetBounds.height / 2;

    graphics.lineStyle(3, PANEL_HIGHLIGHT, 0.95);
    graphics.lineBetween(panelCenterX, panelCenterY, targetCenterX, targetCenterY);
    graphics.fillStyle(PANEL_HIGHLIGHT, 0.95);
    graphics.fillTriangle(
      targetCenterX,
      targetCenterY - 7,
      targetCenterX + 7,
      targetCenterY + 6,
      targetCenterX - 7,
      targetCenterY + 6
    );

    this.objects.push(graphics);
  }

  private renderAcknowledgeButton(bounds: TutorialBounds, label: string): void {
    if (this.config === undefined) {
      return;
    }

    const buttonWidth = label === 'Complete' ? 82 : 66;
    const buttonHeight = 30;
    const buttonX = bounds.x + bounds.width - buttonWidth - 10;
    const buttonY = bounds.y + HEADER_HEIGHT + (bounds.height - HEADER_HEIGHT - buttonHeight) / 2;

    const button = this.scene.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, BUTTON_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(124);

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
        .setDepth(125)
    );
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
