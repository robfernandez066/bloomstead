import Phaser from 'phaser';
import { getItemName } from '../data/Items';
import type { ProcessedGoodId } from '../models/ItemTypes';
import type { GameStateSystem } from '../systems/GameStateSystem';
import { createItemIcon } from './ItemIcon';

const PANEL_FILL = 0xe8f0bb;
const PANEL_STROKE = 0x5e6b45;
const TEXT_COLOR = '#263522';
const CHIP_HEIGHT = 34;
const CHIP_GAP = 6;
const PRODUCTION_CHIP_WIDTH = 168;
const PRODUCTION_CHIP_GAP = 6;
const DEPTH = 12;
const GOODS: ProcessedGoodId[] = ['flour', 'bread'];

interface ProcessedGoodsStripConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: () => boolean;
  getActiveProductionChipCount: () => number;
}

export class ProcessedGoodsStripSystem {
  private readonly scene: Phaser.Scene;
  private readonly gameState: GameStateSystem;
  private config?: ProcessedGoodsStripConfig;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, gameState: GameStateSystem) {
    this.scene = scene;
    this.gameState = gameState;
  }

  render(config: ProcessedGoodsStripConfig): void {
    this.config = config;
    this.refresh();
  }

  refresh(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearObjects();

    if (!this.config.isVisible()) {
      return;
    }

    const activeChipCount = this.config.getActiveProductionChipCount();

    if (activeChipCount >= 2) {
      return;
    }

    const offsetX = activeChipCount * (PRODUCTION_CHIP_WIDTH + PRODUCTION_CHIP_GAP);
    const x = this.config.x + offsetX;
    const width = this.config.width - offsetX;

    if (width < 150) {
      return;
    }

    const y = this.config.y + Math.max(0, (this.config.height - CHIP_HEIGHT) / 2);
    const itemWidth = (width - CHIP_GAP) / GOODS.length;

    GOODS.forEach((itemId, index) => {
      this.renderGood(itemId, x + index * (itemWidth + CHIP_GAP), y, itemWidth);
    });
  }

  private renderGood(itemId: ProcessedGoodId, x: number, y: number, width: number): void {
    const count = this.gameState.getState().processedGoodInventory[itemId];

    const panel = this.scene.add
      .rectangle(x, y, width, CHIP_HEIGHT, PANEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setDepth(DEPTH);
    const icon = createItemIcon(this.scene, itemId, x + 12, y + CHIP_HEIGHT / 2, 14, {
      depth: DEPTH + 1
    });
    const label = this.scene.add.text(x + 23, y + 10, `${getItemName(itemId)} x${count}`, {
      color: TEXT_COLOR,
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold'
    }).setDepth(DEPTH + 1);

    this.objects.push(panel, icon, label);
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
