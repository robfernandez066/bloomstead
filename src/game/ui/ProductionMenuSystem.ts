import Phaser from 'phaser';
import { getItemName } from '../data/Items';
import type { ItemId } from '../models/ItemTypes';
import type { ProductionRecipeDefinition, ProductionRecipeId } from '../models/ProductionTypes';
import type { ProductionSystem } from '../systems/ProductionSystem';
import { createItemIcon } from './ItemIcon';

const OVERLAY_FILL = 0x263522;
const PANEL_FILL = 0xf7edc7;
const PANEL_STROKE = 0x6f5734;
const ENTRY_FILL = 0xf4e6b3;
const READY_FILL = 0xdff0ad;
const DISABLED_FILL = 0x9ca28e;
const TEXT_COLOR = '#2f3b26';
const DISABLED_TEXT = '#ece7d7';
const MUTED_TEXT = '#5f6a4f';
const ITEM_TEXT_COLOR = '#8f6426';
const BUTTON_TEXT = '#263522';
const DEPTH = 130;
const ENTRY_TOP_OFFSET = 52;
const ENTRY_HEIGHT = 98;
const ENTRY_GAP = 8;
const ENTRY_STEP = ENTRY_HEIGHT + ENTRY_GAP;
const ACTION_BUTTON_WIDTH = 78;
const ACTION_BUTTON_HEIGHT = 28;
const ACTION_BUTTON_INSET = 10;

interface ProductionMenuConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onStart: (recipeId: ProductionRecipeId, quantity: number) => void;
  onCollect: (recipeId: ProductionRecipeId) => void;
  onClose: () => void;
  shouldHighlightAction?: (recipeId: ProductionRecipeId, action: 'start' | 'collect') => boolean;
  getForcedBatchQuantity?: (recipeId: ProductionRecipeId) => number | null;
}

export class ProductionMenuSystem {
  private readonly scene: Phaser.Scene;
  private readonly productionSystem: ProductionSystem;
  private config?: ProductionMenuConfig;
  private open = false;
  private readonly selectedQuantities = new Map<ProductionRecipeId, number>();
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
        .text(x + 14, y + 11, 'Production', {
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
    const entryY = this.config.y + ENTRY_TOP_OFFSET + index * ENTRY_STEP;
    const entryWidth = this.config.width - 24;
    const entryHeight = ENTRY_HEIGHT;
    const state = this.productionSystem.getRecipeState(recipe.id);
    const maxCraftable = this.productionSystem.getMaxCraftableQuantity(recipe.id);
    const selectedQuantity = this.getSelectedQuantity(recipe.id);
    const canStart = this.productionSystem.canStartRecipe(recipe.id, selectedQuantity);
    const claimableQuantity = this.productionSystem.getClaimableQuantity(recipe.id);
    const canCollect = claimableQuantity > 0;
    const buttonLabel = canCollect
      ? claimableQuantity > 1
        ? `Collect x${claimableQuantity}`
        : 'Collect'
      : selectedQuantity > 1
        ? `Start x${selectedQuantity}`
        : 'Start';
    const buttonEnabled = canCollect || canStart;
    const buttonAction = canCollect ? 'collect' : 'start';
    const highlighted =
      buttonEnabled && this.config.shouldHighlightAction?.(recipe.id, buttonAction) === true;

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

    this.renderRecipeLine(recipe, entryX + 10, entryY + 34);

    this.objects.push(
      this.scene.add
        .text(entryX + 10, entryY + 53, this.formatStatus(recipe), {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          wordWrap: { width: entryWidth - 100 }
        })
        .setDepth(DEPTH + 3)
    );

    const timerText = this.formatTimer(recipe);

    if (timerText !== null) {
      this.objects.push(
        this.scene.add
          .text(entryX + 10, entryY + 70, timerText, {
            color: MUTED_TEXT,
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            wordWrap: { width: entryWidth - 100 }
          })
          .setDepth(DEPTH + 3)
      );
    }

    if (state.status === 'producing' && !canCollect) {
      return;
    }

    if (state.status === 'idle') {
      this.renderQuantityControls(
        recipe,
        entryX + 10,
        entryY + 78,
        entryWidth - 110,
        selectedQuantity,
        maxCraftable
      );
    }

    const buttonWidth = ACTION_BUTTON_WIDTH;
    const buttonHeight = ACTION_BUTTON_HEIGHT;
    const buttonX = entryX + entryWidth - buttonWidth - ACTION_BUTTON_INSET;
    const buttonY = entryY + 78 - 14;
    const button = this.scene.add
      .rectangle(
        buttonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        buttonEnabled ? READY_FILL : DISABLED_FILL
      )
      .setOrigin(0, 0)
      .setStrokeStyle(highlighted ? 3 : 2, highlighted ? 0xffe27a : PANEL_STROKE)
      .setAlpha(buttonEnabled ? 1 : 0.78)
      .setDepth(DEPTH + 3);

    if (highlighted) {
      this.scene.tweens.add({
        targets: button,
        alpha: 0.72,
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    if (buttonEnabled) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => {
        if (canCollect) {
          this.config?.onCollect(recipe.id);
        } else {
          this.config?.onStart(recipe.id, selectedQuantity);
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
      .rectangle(x, y, 30, 30, DISABLED_FILL)
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
        .text(x + 15, y + 15, 'X', {
          color: DISABLED_TEXT,
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(DEPTH + 3)
    );
  }

  private renderRecipeLine(recipe: ProductionRecipeDefinition, x: number, y: number): void {
    let cursorX = x;

    Object.entries(recipe.input).forEach(([itemId, count], index) => {
      if (index > 0) {
        const comma = this.scene.add.text(cursorX, y - 8, ',', {
          color: TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold'
        }).setDepth(DEPTH + 3);

        this.objects.push(comma);
        cursorX += comma.width + 4;
      }

      cursorX = this.renderRecipeItem(itemId as ItemId, count ?? 0, cursorX, y);
    });

    const arrow = this.scene.add.text(cursorX + 2, y - 8, '->', {
      color: TEXT_COLOR,
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold'
    }).setDepth(DEPTH + 3);

    this.objects.push(arrow);
    this.renderRecipeItem(recipe.outputItemId, recipe.outputAmount, cursorX + arrow.width + 10, y);
  }

  private renderRecipeItem(itemId: ItemId, count: number, x: number, y: number): number {
    const icon = createItemIcon(this.scene, itemId, x + 7, y - 1, 15, { depth: DEPTH + 3 });
    const quantityLabel = this.scene.add.text(x + 17, y - 8, `${count}`, {
      color: TEXT_COLOR,
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold'
    }).setDepth(DEPTH + 3);
    const itemLabel = this.scene.add.text(x + 17 + quantityLabel.width + 4, y - 8, getItemName(itemId), {
      color: ITEM_TEXT_COLOR,
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold'
    }).setDepth(DEPTH + 3);

    this.objects.push(icon, quantityLabel, itemLabel);
    return x + 20 + quantityLabel.width + 4 + itemLabel.width + 8;
  }

  private formatStatus(recipe: ProductionRecipeDefinition): string {
    const state = this.productionSystem.getRecipeState(recipe.id);
    const outputName = getItemName(recipe.outputItemId);
    const outputCount = this.productionSystem.getItemCount(recipe.outputItemId);
    const quantity = state.quantity;
    const claimableQuantity = this.productionSystem.getClaimableQuantity(recipe.id);
    const remainingQuantity = this.productionSystem.getRemainingQuantity(recipe.id);

    if (state.status === 'ready') {
      return `Status: Ready ${outputName} x${claimableQuantity || quantity}`;
    }

    if (state.status === 'producing') {
      const stillProducingQuantity = Math.max(0, remainingQuantity - claimableQuantity);

      if (claimableQuantity > 0 && stillProducingQuantity > 0) {
        return `Status: Ready ${outputName} x${claimableQuantity} | Producing x${stillProducingQuantity}`;
      }

      if (claimableQuantity > 0) {
        return `Status: Ready ${outputName} x${claimableQuantity}`;
      }

      return `Status: Producing ${outputName} x${remainingQuantity || quantity}`;
    }

    return `Status: idle | ${outputName} x${outputCount}`;
  }

  private formatTimer(recipe: ProductionRecipeDefinition): string | null {
    const state = this.productionSystem.getRecipeState(recipe.id);

    if (state.status !== 'producing') {
      return null;
    }

    const nextSeconds = Math.ceil(this.productionSystem.getNextClaimRemainingMs(recipe.id) / 1000);

    if (nextSeconds <= 0) {
      return null;
    }

    return `${nextSeconds}s`;
  }

  private renderQuantityControls(
    recipe: ProductionRecipeDefinition,
    x: number,
    y: number,
    width: number,
    selectedQuantity: number,
    maxCraftable: number
  ): void {
    const forcedQuantity = this.config?.getForcedBatchQuantity?.(recipe.id) ?? null;
    const locked = forcedQuantity !== null;
    const enabled = maxCraftable > 0 && !locked;
    const label = this.scene.add.text(x, y - 8, `Qty x${selectedQuantity}`, {
      color: enabled || locked ? TEXT_COLOR : MUTED_TEXT,
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold'
    }).setDepth(DEPTH + 3);
    const trackX = x + 58;
    const trackY = y;
    const trackWidth = Math.max(56, width - 108);
    const track = this.scene.add
      .rectangle(trackX, trackY, trackWidth, 8, DISABLED_FILL, enabled ? 0.72 : 0.45)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH + 3);
    const progress = maxCraftable <= 0 ? 0 : selectedQuantity / maxCraftable;
    const knob = this.scene.add
      .circle(trackX + trackWidth * Phaser.Math.Clamp(progress, 0, 1), trackY, 6, READY_FILL, enabled ? 1 : 0.65)
      .setStrokeStyle(2, PANEL_STROKE)
      .setDepth(DEPTH + 4);
    const maxButtonWidth = 42;
    const maxButton = this.scene.add
      .rectangle(trackX + trackWidth + 8, y - 14, maxButtonWidth, 28, enabled ? READY_FILL : DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setAlpha(enabled ? 1 : 0.78)
      .setDepth(DEPTH + 3);
    const maxText = this.scene.add.text(trackX + trackWidth + 8 + maxButtonWidth / 2, y, 'Max', {
      color: enabled ? BUTTON_TEXT : DISABLED_TEXT,
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(DEPTH + 4);

    if (enabled) {
      const setQuantityFromPointer = (pointer: Phaser.Input.Pointer): void => {
        const relativeX = Phaser.Math.Clamp(pointer.x - trackX, 0, trackWidth);
        const quantity = Math.round((relativeX / trackWidth) * maxCraftable);

        this.setSelectedQuantity(recipe.id, quantity);
      };

      track.setInteractive({ useHandCursor: true });
      knob.setInteractive({ useHandCursor: true });
      maxButton.setInteractive({ useHandCursor: true });
      track.on('pointerdown', setQuantityFromPointer);
      knob.on('pointerdown', setQuantityFromPointer);
      track.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown) {
          setQuantityFromPointer(pointer);
        }
      });
      knob.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown) {
          setQuantityFromPointer(pointer);
        }
      });
      maxButton.on('pointerdown', () => {
        this.setSelectedQuantity(recipe.id, maxCraftable);
      });
    }

    this.objects.push(label, track, knob, maxButton, maxText);
  }

  private getSelectedQuantity(recipeId: ProductionRecipeId): number {
    const maxCraftable = this.productionSystem.getMaxCraftableQuantity(recipeId);
    const forcedQuantity = this.config?.getForcedBatchQuantity?.(recipeId) ?? null;

    if (maxCraftable <= 0) {
      this.selectedQuantities.delete(recipeId);
      return 0;
    }

    if (forcedQuantity !== null) {
      return Math.min(maxCraftable, forcedQuantity);
    }

    const existingQuantity = this.selectedQuantities.get(recipeId);
    const defaultQuantity = 1;
    const quantity = Math.max(
      0,
      Math.min(maxCraftable, existingQuantity ?? defaultQuantity)
    );

    this.selectedQuantities.set(recipeId, quantity);
    return quantity;
  }

  private setSelectedQuantity(recipeId: ProductionRecipeId, quantity: number): void {
    const maxCraftable = this.productionSystem.getMaxCraftableQuantity(recipeId);

    this.selectedQuantities.set(
      recipeId,
      Math.max(0, Math.min(maxCraftable, Math.round(quantity)))
    );
    this.refresh();
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
