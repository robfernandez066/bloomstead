import Phaser from 'phaser';
import { getItemName } from '../data/Items';
import type { ProductionRecipeDefinition } from '../models/ProductionTypes';
import type { ProductionRecipeId } from '../models/ProductionTypes';
import type { ProductionSystem } from '../systems/ProductionSystem';

const BUTTON_HIGHLIGHT_FILL = 0xffe27a;
const PANEL_FILL = 0xf4e6b3;
const READY_FILL = 0xdff0ad;
const BAR_BACK = 0x9ca28e;
const BAR_FILL = 0x6fae57;
const PANEL_STROKE = 0x6f5734;
const TEXT_COLOR = '#2f3b26';
const CHIP_WIDTH = 168;
const CHIP_HEIGHT = 34;
const CHIP_GAP = 6;
const TIMER_WIDTH = 24;

interface ProductionStatusConfig {
  statusX: number;
  statusY: number;
  statusWidth: number;
  statusHeight: number;
  onOpen: (recipeId: ProductionRecipeId) => void;
  highlightRecipeChip?: (recipeId: ProductionRecipeId) => boolean;
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

    this.productionSystem.getActiveRecipes().forEach((recipe, index) => {
      this.renderStatusChip(recipe, index, config);
    });
  }

  private renderStatusChip(
    recipe: ProductionRecipeDefinition,
    index: number,
    config: ProductionStatusConfig
  ): void {
    const state = this.productionSystem.getRecipeState(recipe.id);
    const claimableQuantity = this.productionSystem.getClaimableQuantity(recipe.id);
    const fullyReady = state.status === 'ready';
    const partiallyReady = state.status === 'producing' && claimableQuantity > 0;
    const ready = fullyReady || partiallyReady;
    const highlighted = config.highlightRecipeChip?.(recipe.id) === true;
    const quantity = state.quantity;
    const outputName = getItemName(recipe.outputItemId);
    const remainingQuantity = this.productionSystem.getRemainingQuantity(recipe.id) || quantity;
    const producingLabel = `${recipe.buildingName}: ${outputName} x${remainingQuantity}`;
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
      .setStrokeStyle(highlighted ? 3 : 2, highlighted ? BUTTON_HIGHLIGHT_FILL : PANEL_STROKE)
      .setInteractive({ useHandCursor: true });

    if (highlighted) {
      this.scene.tweens.add({
        targets: chip,
        alpha: 0.7,
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    chip.on('pointerdown', () => {
      config.onOpen(recipe.id);
    });

    this.objects.push(chip);

    if (fullyReady) {
      this.objects.push(
        this.scene.add.text(chipX + 8, chipY + 4, `${recipe.buildingName} Ready`, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold'
        }),
        this.scene.add.text(chipX + 8, chipY + 17, `${outputName} x${claimableQuantity || quantity}`, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold'
        })
      );
      return;
    }

    const remainingSeconds = Math.ceil(this.productionSystem.getNextClaimRemainingMs(recipe.id) / 1000);
    const durationMs = state.durationMs ?? 1;
    const remainingMs = this.productionSystem.getRemainingMs(recipe.id);

    if (partiallyReady) {
      const stillProducingQuantity = Math.max(0, remainingQuantity - claimableQuantity);

      this.objects.push(
        this.scene.add.text(chipX + 8, chipY + 4, `${recipe.buildingName}: Ready ${outputName} x${claimableQuantity}`, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold'
        }),
        this.scene.add.text(chipX + 8, chipY + 17, `Producing x${stillProducingQuantity}`, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold'
        }),
        this.scene.add
          .text(chipX + chipWidth - 8, chipY + 17, `${remainingSeconds}s`, {
            color: TEXT_COLOR,
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            fontStyle: 'bold'
          })
          .setOrigin(1, 0)
      );
      return;
    }

    const progress = Phaser.Math.Clamp(1 - remainingMs / durationMs, 0, 1);
    const barX = chipX + 9;
    const barY = chipY + 24;
    const barWidth = chipWidth - 18 - TIMER_WIDTH;

    this.objects.push(
      this.scene.add.text(chipX + 8, chipY + 4, producingLabel, {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold'
      }),
      this.scene.add
        .text(chipX + chipWidth - 8, chipY + 15, `${remainingSeconds}s`, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold'
        })
        .setOrigin(1, 0),
      this.scene.add
        .rectangle(barX, barY, barWidth, 7, BAR_BACK)
        .setOrigin(0, 0),
      this.scene.add
        .rectangle(barX, barY, Math.max(3, barWidth * progress), 7, BAR_FILL)
        .setOrigin(0, 0)
    );
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }

    this.objects.length = 0;
  }
}
