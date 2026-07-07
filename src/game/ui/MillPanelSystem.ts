import Phaser from 'phaser';
import { getItemName } from '../data/Items';
import { MILL_FLOUR_RECIPE_ID } from '../data/ProductionRecipes';
import type { ItemId } from '../models/ItemTypes';
import type { ProductionSystem } from '../systems/ProductionSystem';

const PANEL_FILL = 0xf4e6b3;
const PANEL_STROKE = 0x6f5734;
const READY_FILL = 0xdff0ad;
const DISABLED_FILL = 0x9ca28e;
const TEXT_COLOR = '#2f3b26';
const DISABLED_TEXT = '#ece7d7';
const BUTTON_TEXT = '#263522';

interface MillPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  buttonWidth: number;
  onStart: () => void;
  onCollect: () => void;
}

export class MillPanelSystem {
  private readonly scene: Phaser.Scene;
  private readonly productionSystem: ProductionSystem;
  private config?: MillPanelConfig;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, productionSystem: ProductionSystem) {
    this.scene = scene;
    this.productionSystem = productionSystem;
  }

  render(config: MillPanelConfig): void {
    this.config = config;
    this.refresh();
  }

  refresh(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearObjects();

    const recipe = this.productionSystem.getCurrentRecipe();
    const state = this.productionSystem.getState();
    const canStart = this.productionSystem.canStartRecipe(MILL_FLOUR_RECIPE_ID);
    const statusText = this.formatStatus();

    this.objects.push(
      this.scene.add
        .rectangle(this.config.x, this.config.y, this.config.width, this.config.height, PANEL_FILL)
        .setOrigin(0, 0)
        .setStrokeStyle(2, PANEL_STROKE)
    );

    this.objects.push(
      this.scene.add.text(this.config.x + 10, this.config.y + 5, 'Mill', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
    );

    this.objects.push(
      this.scene.add.text(this.config.x + 58, this.config.y + 5, this.formatRecipe(recipe), {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold'
      })
    );

    this.objects.push(
      this.scene.add.text(this.config.x + 10, this.config.y + 25, statusText, {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px'
      })
    );

    if (state.status === 'producing') {
      return;
    }

    const buttonLabel = state.status === 'ready' ? 'Collect' : 'Start';
    const buttonEnabled = state.status === 'ready' || canStart;
    const buttonX = this.config.x + this.config.width - this.config.buttonWidth - 8;
    const buttonY = this.config.y + 9;

    const button = this.scene.add
      .rectangle(
        buttonX,
        buttonY,
        this.config.buttonWidth,
        this.config.height - 18,
        buttonEnabled ? READY_FILL : DISABLED_FILL
      )
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setAlpha(buttonEnabled ? 1 : 0.78);

    if (buttonEnabled) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => {
        if (state.status === 'ready') {
          this.config?.onCollect();
        } else {
          this.config?.onStart();
        }
      });
    }

    this.objects.push(
      button,
      this.scene.add
        .text(buttonX + this.config.buttonWidth / 2, buttonY + (this.config.height - 18) / 2, buttonLabel, {
          color: buttonEnabled ? BUTTON_TEXT : DISABLED_TEXT,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
    );
  }

  private formatRecipe(recipe: ReturnType<ProductionSystem['getCurrentRecipe']>): string {
    const inputText = Object.entries(recipe.input)
      .map(([itemId, count]) => `${count} ${getItemName(itemId as ItemId)}`)
      .join(', ');

    return `${inputText} -> ${recipe.outputAmount} ${getItemName(recipe.outputItemId)}`;
  }

  private formatStatus(): string {
    const state = this.productionSystem.getState();
    const flourCount = this.productionSystem.getItemCount('flour');

    if (state.status === 'ready') {
      return `Ready: Collect Flour | Flour x${flourCount}`;
    }

    if (state.status === 'producing') {
      return `Producing: ${Math.ceil(this.productionSystem.getRemainingMs() / 1000)}s left | Flour x${flourCount}`;
    }

    return `Idle | Flour x${flourCount}`;
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
