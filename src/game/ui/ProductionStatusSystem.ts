import Phaser from 'phaser';
import type { ProductionSystem } from '../systems/ProductionSystem';

const BUTTON_FILL = 0xe8f0bb;
const PANEL_FILL = 0xf4e6b3;
const READY_FILL = 0xdff0ad;
const BAR_BACK = 0x9ca28e;
const BAR_FILL = 0x6fae57;
const PANEL_STROKE = 0x6f5734;
const TEXT_COLOR = '#2f3b26';
const CHIP_WIDTH = 96;
const CHIP_HEIGHT = 30;
const CHIP_GAP = 6;

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

    const config = this.config;

    this.clearObjects();
    this.renderButton(config);

    if (this.productionSystem.getState().status === 'idle') {
      return;
    }

    this.productionSystem.getAvailableRecipes().forEach((recipe, index) => {
      this.renderStatusChip(recipe.buildingName, index, config);
    });
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
        .text(config.buttonX + config.buttonWidth / 2, config.buttonY + config.buttonHeight / 2, 'Craft', {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
    );
  }

  private renderStatusChip(label: string, index: number, config: ProductionStatusConfig): void {
    const state = this.productionSystem.getState();
    const ready = state.status === 'ready';
    const chipX = config.statusX + index * (CHIP_WIDTH + CHIP_GAP);
    const chipY = config.statusY + Math.max(0, (config.statusHeight - CHIP_HEIGHT) / 2);
    const chipWidth = Math.min(CHIP_WIDTH, config.statusX + config.statusWidth - chipX);

    if (chipWidth < 48) {
      return;
    }

    const chip = this.scene.add
      .rectangle(
        chipX,
        chipY,
        chipWidth,
        CHIP_HEIGHT,
        ready ? READY_FILL : PANEL_FILL
      )
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setInteractive({ useHandCursor: true });

    chip.on('pointerdown', () => {
      config.onOpen();
    });

    this.objects.push(chip);

    if (ready) {
      this.objects.push(
        this.scene.add.text(chipX + 8, chipY + 8, `${label} Ready`, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold'
        })
      );
      return;
    }

    const remainingSeconds = Math.ceil(this.productionSystem.getRemainingMs() / 1000);
    const durationMs = state.durationMs ?? 1;
    const remainingMs = this.productionSystem.getRemainingMs();
    const progress = Phaser.Math.Clamp(1 - remainingMs / durationMs, 0, 1);
    const barX = chipX + 8;
    const barY = chipY + 21;
    const barWidth = chipWidth - 16;

    this.objects.push(
      this.scene.add.text(chipX + 8, chipY + 5, `${label} ${remainingSeconds}s`, {
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
