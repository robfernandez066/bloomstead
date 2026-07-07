import Phaser from 'phaser';
import { getItemName } from '../data/Items';
import { MILL_FLOUR_RECIPE_ID } from '../data/ProductionRecipes';
import type { ItemId } from '../models/ItemTypes';
import type { ProductionRecipeDefinition } from '../models/ProductionTypes';
import type { ProductionSystem } from '../systems/ProductionSystem';

const OVERLAY_FILL = 0x263522;
const PANEL_FILL = 0xf7edc7;
const PANEL_STROKE = 0x6f5734;
const ENTRY_FILL = 0xf4e6b3;
const READY_FILL = 0xdff0ad;
const DISABLED_FILL = 0x9ca28e;
const TEXT_COLOR = '#2f3b26';
const DISABLED_TEXT = '#ece7d7';
const BUTTON_TEXT = '#263522';
const DEPTH = 130;

interface ProductionMenuConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onStart: () => void;
  onCollect: () => void;
  onClose: () => void;
}

export class ProductionMenuSystem {
  private readonly scene: Phaser.Scene;
  private readonly productionSystem: ProductionSystem;
  private config?: ProductionMenuConfig;
  private open = false;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, productionSystem: ProductionSystem) {
    this.scene = scene;
    this.productionSystem = productionSystem;
  }

  render(config: ProductionMenuConfig): void {
    this.config = config;
  }

  isOpen(): boolean {
    return this.open;
  }

  openMenu(): void {
    this.open = true;
    this.refresh();
  }

  closeMenu(): void {
    this.open = false;
    this.clearObjects();
    this.config?.onClose();
  }

  refresh(): void {
    if (this.config === undefined || !this.open) {
      return;
    }

    this.clearObjects();

    const { x, y, width, height } = this.config;

    const overlay = this.scene.add
      .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, OVERLAY_FILL, 0.18)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(DEPTH);

    overlay.on('pointerdown', () => {
      this.closeMenu();
    });

    this.objects.push(overlay);

    this.objects.push(
      this.scene.add
        .rectangle(x, y, width, height, PANEL_FILL)
        .setOrigin(0, 0)
        .setStrokeStyle(2, PANEL_STROKE)
        .setInteractive()
        .setDepth(DEPTH + 1)
    );

    this.objects.push(
      this.scene.add
        .text(x + 14, y + 12, 'Production', {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold'
        })
        .setDepth(DEPTH + 2)
    );

    this.renderCloseButton(x + width - 42, y + 10);

    this.productionSystem.getAvailableRecipes().forEach((recipe, index) => {
      this.renderRecipeEntry(recipe, index);
    });
  }

  private renderRecipeEntry(recipe: ProductionRecipeDefinition, index: number): void {
    if (this.config === undefined) {
      return;
    }

    const entryX = this.config.x + 12;
    const entryY = this.config.y + 52 + index * 118;
    const entryWidth = this.config.width - 24;
    const entryHeight = 104;
    const state = this.productionSystem.getState();
    const canStart = this.productionSystem.canStartRecipe(recipe.id);
    const buttonLabel = state.status === 'ready' ? 'Collect' : 'Start';
    const buttonEnabled = state.status === 'ready' || canStart;

    this.objects.push(
      this.scene.add
        .rectangle(entryX, entryY, entryWidth, entryHeight, ENTRY_FILL)
        .setOrigin(0, 0)
        .setStrokeStyle(2, PANEL_STROKE)
        .setDepth(DEPTH + 2)
    );

    this.objects.push(
      this.scene.add
        .text(entryX + 10, entryY + 8, recipe.buildingName, {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold'
        })
        .setDepth(DEPTH + 3)
    );

    this.objects.push(
      this.scene.add
        .text(entryX + 10, entryY + 31, this.formatRecipe(recipe), {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold'
        })
        .setDepth(DEPTH + 3)
    );

    this.objects.push(
      this.scene.add
        .text(entryX + 10, entryY + 52, this.formatStatus(), {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          wordWrap: { width: entryWidth - 100 }
        })
        .setDepth(DEPTH + 3)
    );

    if (state.status === 'producing') {
      return;
    }

    const buttonWidth = 82;
    const buttonHeight = 30;
    const buttonX = entryX + entryWidth - buttonWidth - 10;
    const buttonY = entryY + entryHeight - buttonHeight - 10;
    const button = this.scene.add
      .rectangle(
        buttonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        buttonEnabled ? READY_FILL : DISABLED_FILL
      )
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setAlpha(buttonEnabled ? 1 : 0.78)
      .setDepth(DEPTH + 3);

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
        .text(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, buttonLabel, {
          color: buttonEnabled ? BUTTON_TEXT : DISABLED_TEXT,
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(DEPTH + 4)
    );
  }

  private renderCloseButton(x: number, y: number): void {
    const button = this.scene.add
      .rectangle(x, y, 28, 28, DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 2);

    button.on('pointerdown', () => {
      this.closeMenu();
    });

    this.objects.push(
      button,
      this.scene.add
        .text(x + 14, y + 14, 'X', {
          color: DISABLED_TEXT,
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(DEPTH + 3)
    );
  }

  private formatRecipe(recipe: ProductionRecipeDefinition): string {
    const inputText = Object.entries(recipe.input)
      .map(([itemId, count]) => `${count} ${getItemName(itemId as ItemId)}`)
      .join(', ');

    return `${inputText} -> ${recipe.outputAmount} ${getItemName(recipe.outputItemId)}`;
  }

  private formatStatus(): string {
    const state = this.productionSystem.getState();
    const flourCount = this.productionSystem.getItemCount('flour');

    if (state.status === 'ready') {
      return `Status: ready | Flour x${flourCount}`;
    }

    if (state.status === 'producing') {
      return `Status: producing | ${Math.ceil(this.productionSystem.getRemainingMs() / 1000)}s left | Flour x${flourCount}`;
    }

    return `Status: idle | Flour x${flourCount}`;
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
