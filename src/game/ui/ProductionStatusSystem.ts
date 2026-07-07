import Phaser from 'phaser';
import type { ProductionSystem } from '../systems/ProductionSystem';

const BUTTON_FILL = 0xe8f0bb;
const PANEL_FILL = 0xf4e6b3;
const READY_FILL = 0xdff0ad;
const BAR_BACK = 0x9ca28e;
const BAR_FILL = 0x6fae57;
const PANEL_STROKE = 0x6f5734;
const TEXT_COLOR = '#2f3b26';

interface ProductionStatusConfig {
  buttonX: number;
  buttonY: number;
  buttonWidth: number;
  buttonHeight: number;
  statusX: number;
  statusY: number;
  statusWidth: number;
  statusHeight: number;
  onOpen: () => void;
}

export class ProductionStatusSystem {
  private readonly scene: Phaser.Scene;
  private readonly productionSystem: ProductionSystem;
  private config?: ProductionStatusConfig;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, productionSystem: ProductionSystem) {
    this.scene = scene;
    this.productionSystem = productionSystem;
  }

  render(config: ProductionStatusConfig): void {
    this.config = config;
    this.refresh();
  }

  refresh(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearObjects();
    this.renderButton(this.config);

    const state = this.productionSystem.getState();

    if (state.status === 'idle') {
      return;
    }

    this.renderStatus(this.config);
  }

  private renderButton(config: ProductionStatusConfig): void {
    const button = this.scene.add
      .rectangle(config.buttonX, config.buttonY, config.buttonWidth, config.buttonHeight, BUTTON_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      config.onOpen();
    });

    this.objects.push(
      button,
      this.scene.add
        .text(config.buttonX + config.buttonWidth / 2, config.buttonY + config.buttonHeight / 2, 'Make', {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
    );
  }

  private renderStatus(config: ProductionStatusConfig): void {
    const state = this.productionSystem.getState();
    const ready = state.status === 'ready';
    const panel = this.scene.add
      .rectangle(
        config.statusX,
        config.statusY,
        config.statusWidth,
        config.statusHeight,
        ready ? READY_FILL : PANEL_FILL
      )
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setInteractive({ useHandCursor: true });

    panel.on('pointerdown', () => {
      config.onOpen();
    });

    this.objects.push(panel);

    if (ready) {
      this.objects.push(
        this.scene.add.text(config.statusX + 10, config.statusY + 12, 'Mill Ready', {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold'
        })
      );
      return;
    }

    const remainingSeconds = Math.ceil(this.productionSystem.getRemainingMs() / 1000);
    const durationMs = state.durationMs ?? 1;
    const remainingMs = this.productionSystem.getRemainingMs();
    const progress = Phaser.Math.Clamp(1 - remainingMs / durationMs, 0, 1);
    const barX = config.statusX + 56;
    const barY = config.statusY + 25;
    const barWidth = config.statusWidth - 118;

    this.objects.push(
      this.scene.add.text(config.statusX + 10, config.statusY + 6, 'Mill', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold'
      }),
      this.scene.add.text(config.statusX + config.statusWidth - 52, config.statusY + 6, `${remainingSeconds}s`, {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold'
      }),
      this.scene.add
        .rectangle(barX, barY, barWidth, 8, BAR_BACK)
        .setOrigin(0, 0),
      this.scene.add
        .rectangle(barX, barY, Math.max(3, barWidth * progress), 8, BAR_FILL)
        .setOrigin(0, 0)
    );
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
