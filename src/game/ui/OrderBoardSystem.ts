import Phaser from 'phaser';
import { getItemName } from '../data/Items';
import type { ItemId } from '../models/ItemTypes';
import type { OrderDefinition } from '../models/OrderTypes';
import type { OrderSystem } from '../systems/OrderSystem';
import { createItemIcon } from './ItemIcon';

const BOARD_FILL = 0xf4e6b3;
const BOARD_STROKE = 0x6f5734;
const READY_FILL = 0xdff0ad;
const DISABLED_FILL = 0x9ca28e;
const READY_STROKE = 0x496f38;
const TEXT_COLOR = '#2f3b26';
const DISABLED_TEXT = '#ece7d7';
const REWARD_TEXT_WIDTH = 96;

interface OrderBoardConfig {
  x: number;
  y: number;
  width: number;
  orderHeight: number;
  gap: number;
  bottomPadding: number;
  onOrderComplete: (order: OrderDefinition) => void;
}

export class OrderBoardSystem {
  private readonly scene: Phaser.Scene;
  private readonly orderSystem: OrderSystem;
  private config?: OrderBoardConfig;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, orderSystem: OrderSystem) {
    this.scene = scene;
    this.orderSystem = orderSystem;
  }

  render(config: OrderBoardConfig): void {
    this.config = config;
    this.refresh();
  }

  refresh(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearObjects();

    const orders = this.orderSystem.getActiveOrders();
    const boardHeight =
      30 +
      orders.length * this.config.orderHeight +
      (orders.length - 1) * this.config.gap +
      this.config.bottomPadding;

    this.objects.push(
      this.scene.add
        .rectangle(this.config.x, this.config.y, this.config.width, boardHeight, BOARD_FILL)
        .setOrigin(0, 0)
        .setStrokeStyle(2, BOARD_STROKE)
    );

    this.objects.push(
      this.scene.add.text(this.config.x + 12, this.config.y + 7, 'Order Board', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold'
      })
    );

    orders.forEach((order, index) => {
      this.renderOrder(order, index);
    });
  }

  private renderOrder(order: OrderDefinition, index: number): void {
    if (this.config === undefined) {
      return;
    }

    const ready = this.orderSystem.canCompleteOrder(order);
    const x = this.config.x + 10;
    const y = this.config.y + 30 + index * (this.config.orderHeight + this.config.gap);
    const width = this.config.width - 20;
    const fillColor = ready ? READY_FILL : DISABLED_FILL;
    const textColor = ready ? TEXT_COLOR : DISABLED_TEXT;

    const panel = this.scene.add
      .rectangle(x, y, width, this.config.orderHeight, fillColor)
      .setOrigin(0, 0)
      .setStrokeStyle(2, ready ? READY_STROKE : BOARD_STROKE)
      .setAlpha(ready ? 1 : 0.78);

    this.objects.push(panel);

    if (ready) {
      panel.setInteractive({ useHandCursor: true });
      panel.on('pointerdown', () => {
        this.config?.onOrderComplete(order);
      });
    }

    this.objects.push(
      this.scene.add.text(x + 8, y + 5, order.name, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
    );

    this.renderRequirements(order, x + 8, y + 31, width - REWARD_TEXT_WIDTH - 18, textColor, ready ? 1 : 0.78);

    this.objects.push(
      this.scene.add.text(x + width - REWARD_TEXT_WIDTH, y + 25, `${order.coinReward}c  ${order.xpReward} XP`, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold'
      })
    );
  }

  private renderRequirements(
    order: OrderDefinition,
    x: number,
    y: number,
    maxWidth: number,
    textColor: string,
    alpha: number
  ): void {
    let cursorX = x;

    Object.entries(order.requirements).forEach(([itemId, count]) => {
      const typedItemId = itemId as ItemId;
      const label = `${count} ${getItemName(typedItemId)}`;
      const icon = createItemIcon(this.scene, typedItemId, cursorX + 6, y + 2, 13, { alpha });
      const text = this.scene.add.text(cursorX + 15, y - 6, label, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px'
      });
      const entryWidth = 17 + Math.min(text.width, 60) + 5;

      icon.setAlpha(alpha);
      text.setAlpha(alpha);

      if (cursorX + entryWidth > x + maxWidth) {
        text.setText(`${count} ${getItemName(typedItemId).slice(0, 4)}.`);
      }

      this.objects.push(icon, text);
      cursorX += entryWidth;
    });
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
