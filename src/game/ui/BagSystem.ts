import Phaser from 'phaser';
import { PROCESSED_GOODS } from '../data/ProcessedGoods';
import type { CropDefinition, CropId } from '../models/CropTypes';
import type { ProcessedGoodId } from '../models/ItemTypes';
import type { CropSellingSystem } from '../systems/CropSellingSystem';
import type { GameStateSystem } from '../systems/GameStateSystem';
import { createItemIcon } from './ItemIcon';

const LANDMARK_DEPTH = 18;
const HIT_DEPTH = LANDMARK_DEPTH + 3;
const WINDOW_DEPTH = 110;
const OVERLAY_FILL = 0x263522;
const PANEL_FILL = 0xf7edc7;
const PANEL_STROKE = 0x6f5734;
const ROW_FILL = 0xf4e6b3;
const ENABLED_FILL = 0xdff0ad;
const DISABLED_FILL = 0xc9ccb2;
const ENABLED_STROKE = 0x496f38;
const TEXT_COLOR = '#2f3b26';
const MUTED_TEXT = '#5f6a4f';
const ITEM_TEXT_COLOR = '#8f6426';
const SATCHEL_FILL = 0xa86f3d;
const SATCHEL_DARK = 0x684326;
const SATCHEL_LIGHT = 0xd6a061;
const HEADER_HEIGHT = 44;
const SECTION_HEIGHT = 24;
const SECTION_GAP = 8;
const ACTION_WIDTH = 70;
const ACTION_HEIGHT = 28;

interface BagConfig {
  entry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  window: {
    x: number;
    y: number;
    width: number;
    cropRowHeight: number;
    goodRowHeight: number;
    gap: number;
    bottomPadding: number;
  };
  onOpen: () => void;
  onClose?: () => void;
  onSellCrop: (crop: CropDefinition) => void;
}

export class BagSystem {
  private readonly scene: Phaser.Scene;
  private readonly gameState: GameStateSystem;
  private readonly cropSellingSystem: CropSellingSystem;
  private config?: BagConfig;
  private open = false;
  private readonly entryObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly windowObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly sellButtonBounds = new Map<CropId, Phaser.Geom.Rectangle>();

  constructor(
    scene: Phaser.Scene,
    gameState: GameStateSystem,
    cropSellingSystem: CropSellingSystem
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.cropSellingSystem = cropSellingSystem;
  }

  render(config: BagConfig): void {
    this.config = config;
    this.renderEntry();
  }

  isOpen(): boolean {
    return this.open;
  }

  openWindow(): void {
    if (this.config === undefined) {
      return;
    }

    this.open = true;
    this.refresh();
  }

  closeWindow(notify = true): void {
    if (!this.open) {
      return;
    }

    this.open = false;
    this.clearWindowObjects();

    if (notify) {
      this.config?.onClose?.();
    }
  }

  refresh(): void {
    if (!this.open || this.config === undefined) {
      return;
    }

    this.renderWindow();
  }

  getHitBounds(): Phaser.Geom.Rectangle {
    if (this.config === undefined) {
      return new Phaser.Geom.Rectangle();
    }

    const { x, y, width, height } = this.config.entry;
    return new Phaser.Geom.Rectangle(x, y, width, height);
  }

  getInventoryTargetPosition(): Phaser.Math.Vector2 {
    const bounds = this.getHitBounds();
    return new Phaser.Math.Vector2(bounds.centerX, bounds.centerY);
  }

  getSellButtonBounds(cropId: CropId): Phaser.Geom.Rectangle | null {
    return this.sellButtonBounds.get(cropId) ?? null;
  }

  private renderEntry(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearEntryObjects();

    const { x, y, width, height } = this.config.entry;
    const centerX = x + width / 2;
    const shadow = this.scene.add
      .ellipse(centerX, y + height - 5, width - 12, 12, 0x355b35, 0.3)
      .setDepth(LANDMARK_DEPTH - 1);
    const handle = this.scene.add
      .ellipse(centerX, y + 22, 48, 32, 0x000000, 0)
      .setStrokeStyle(6, SATCHEL_DARK)
      .setDepth(LANDMARK_DEPTH);
    const body = this.scene.add
      .rectangle(x + 12, y + 23, width - 24, 45, SATCHEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(3, SATCHEL_DARK)
      .setDepth(LANDMARK_DEPTH + 1);
    const flap = this.scene.add
      .triangle(centerX, y + 26, -30, 0, 30, 0, 0, 21, SATCHEL_LIGHT)
      .setStrokeStyle(2, SATCHEL_DARK)
      .setDepth(LANDMARK_DEPTH + 2);
    const clasp = this.scene.add
      .rectangle(centerX, y + 45, 10, 12, 0xf4e6b3)
      .setStrokeStyle(2, SATCHEL_DARK)
      .setDepth(LANDMARK_DEPTH + 3);
    const labelPanel = this.scene.add
      .rectangle(centerX, y + 66, 48, 21, PANEL_FILL)
      .setStrokeStyle(2, PANEL_STROKE)
      .setDepth(LANDMARK_DEPTH + 3);
    const label = this.scene.add
      .text(centerX, y + 66, 'Bag', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(LANDMARK_DEPTH + 4);
    const hitArea = this.scene.add
      .rectangle(x, y, width, height, 0xffffff, 0.001)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(HIT_DEPTH);

    hitArea.on('pointerdown', () => this.config?.onOpen());
    this.entryObjects.push(shadow, handle, body, flap, clasp, labelPanel, label, hitArea);
  }

  private renderWindow(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearWindowObjects();

    const crops = this.gameState.getCrops();
    const goods = Object.values(PROCESSED_GOODS);
    const { x, y, width, cropRowHeight, goodRowHeight, gap, bottomPadding } = this.config.window;
    const cropRowsHeight = crops.length * cropRowHeight + Math.max(0, crops.length - 1) * gap;
    const goodRowsHeight = goods.length * goodRowHeight + Math.max(0, goods.length - 1) * gap;
    const windowHeight =
      HEADER_HEIGHT +
      SECTION_HEIGHT +
      cropRowsHeight +
      SECTION_GAP +
      SECTION_HEIGHT +
      goodRowsHeight +
      bottomPadding;
    const overlay = this.scene.add
      .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, OVERLAY_FILL, 0.42)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(WINDOW_DEPTH);

    overlay.on('pointerdown', () => this.closeWindow());

    const panel = this.scene.add
      .rectangle(x, y, width, windowHeight, PANEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(3, PANEL_STROKE)
      .setInteractive()
      .setDepth(WINDOW_DEPTH + 1);

    panel.on('pointerdown', (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData
    ) => event.stopPropagation());

    const title = this.scene.add
      .text(x + 14, y + 11, 'Bag', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold'
      })
      .setDepth(WINDOW_DEPTH + 2);

    this.windowObjects.push(overlay, panel, title);
    this.renderCloseButton(x + width - 42, y + 7);

    let cursorY = y + HEADER_HEIGHT;
    this.renderSectionLabel(x + 12, cursorY + 4, 'Crops');
    cursorY += SECTION_HEIGHT;

    crops.forEach((crop, index) => {
      this.renderCropRow(crop, x + 10, cursorY + index * (cropRowHeight + gap), width - 20, cropRowHeight);
    });

    cursorY += cropRowsHeight + SECTION_GAP;
    this.renderSectionLabel(x + 12, cursorY + 4, 'Processed goods');
    cursorY += SECTION_HEIGHT;

    goods.forEach((good, index) => {
      this.renderGoodRow(
        good.id,
        good.name,
        x + 10,
        cursorY + index * (goodRowHeight + gap),
        width - 20,
        goodRowHeight
      );
    });
  }

  private renderCropRow(crop: CropDefinition, x: number, y: number, width: number, height: number): void {
    const count = this.gameState.getItemCount(crop.id);
    const canSell = this.cropSellingSystem.canSell(crop.id);
    const row = this.scene.add
      .rectangle(x, y, width, height, ROW_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setDepth(WINDOW_DEPTH + 2);
    const icon = createItemIcon(this.scene, crop.id, x + 15, y + height / 2, 17, {
      depth: WINDOW_DEPTH + 3
    });
    const name = this.scene.add
      .text(x + 29, y + 7, `${crop.name} x${count}`, {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold'
      })
      .setDepth(WINDOW_DEPTH + 3);
    const value = this.scene.add
      .text(x + 29, y + 24, `Sell value: ${crop.sellValue} coins`, {
        color: ITEM_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold'
      })
      .setDepth(WINDOW_DEPTH + 3);
    const buttonX = x + width - ACTION_WIDTH - 8;
    const buttonY = y + (height - ACTION_HEIGHT) / 2;
    const button = this.scene.add
      .rectangle(buttonX, buttonY, ACTION_WIDTH, ACTION_HEIGHT, canSell ? ENABLED_FILL : DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, canSell ? ENABLED_STROKE : PANEL_STROKE)
      .setAlpha(canSell ? 1 : 0.78)
      .setDepth(WINDOW_DEPTH + 3);

    if (canSell) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.config?.onSellCrop(crop));
    }

    const buttonLabel = this.scene.add
      .text(buttonX + ACTION_WIDTH / 2, buttonY + ACTION_HEIGHT / 2, `Sell +${crop.sellValue}c`, {
        color: canSell ? TEXT_COLOR : MUTED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(WINDOW_DEPTH + 4);

    this.sellButtonBounds.set(crop.id, new Phaser.Geom.Rectangle(buttonX, buttonY, ACTION_WIDTH, ACTION_HEIGHT));
    this.windowObjects.push(row, icon, name, value, button, buttonLabel);
  }

  private renderGoodRow(
    itemId: ProcessedGoodId,
    itemName: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const count = this.gameState.getItemCount(itemId);
    const row = this.scene.add
      .rectangle(x, y, width, height, ROW_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setDepth(WINDOW_DEPTH + 2);
    const icon = createItemIcon(this.scene, itemId, x + 15, y + height / 2, 17, {
      depth: WINDOW_DEPTH + 3
    });
    const name = this.scene.add
      .text(x + 29, y + 7, `${itemName} x${count}`, {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold'
      })
      .setDepth(WINDOW_DEPTH + 3);
    const status = this.scene.add
      .text(x + 29, y + 24, 'Collected inventory', {
        color: MUTED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold'
      })
      .setDepth(WINDOW_DEPTH + 3);
    const readOnly = this.scene.add
      .text(x + width - 12, y + height / 2, 'Read only', {
        color: MUTED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(1, 0.5)
      .setDepth(WINDOW_DEPTH + 3);

    this.windowObjects.push(row, icon, name, status, readOnly);
  }

  private renderSectionLabel(x: number, y: number, label: string): void {
    this.windowObjects.push(
      this.scene.add
        .text(x, y, label, {
          color: MUTED_TEXT,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold'
        })
        .setDepth(WINDOW_DEPTH + 2)
    );
  }

  private renderCloseButton(x: number, y: number): void {
    const button = this.scene.add
      .rectangle(x, y, 32, 30, DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(WINDOW_DEPTH + 2);

    button.on('pointerdown', () => this.closeWindow());
    const label = this.scene.add
      .text(x + 16, y + 15, 'X', {
        color: MUTED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(WINDOW_DEPTH + 3);

    this.windowObjects.push(button, label);
  }

  private clearEntryObjects(): void {
    for (const object of this.entryObjects) {
      object.destroy();
    }

    this.entryObjects.length = 0;
  }

  private clearWindowObjects(): void {
    for (const object of this.windowObjects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }

    this.windowObjects.length = 0;
    this.sellButtonBounds.clear();
  }
}
