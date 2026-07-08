import Phaser from 'phaser';
import { getItemName } from '../data/Items';
import type { ItemId } from '../models/ItemTypes';
import type { OrderDefinition, OrderSource } from '../models/OrderTypes';
import type { OrderSystem } from '../systems/OrderSystem';
import { createItemIcon } from './ItemIcon';

const BOARD_FILL = 0xf4e6b3;
const BOARD_STROKE = 0x6f5734;
const READY_FILL = 0xdff0ad;
const DISABLED_FILL = 0xc9ccb2;
const READY_STROKE = 0x496f38;
const TEXT_COLOR = '#2f3b26';
const DISABLED_TEXT = '#4f5a45';
const SOURCE_TEXT_COLOR = '#5e7047';
const DISABLED_SOURCE_TEXT = '#687058';
const ITEM_TEXT_COLOR = '#8f6426';
const DISABLED_ITEM_TEXT_COLOR = '#76552a';
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
      .setAlpha(ready ? 1 : 0.92);

    this.objects.push(panel);

    if (ready) {
      panel.setInteractive({ useHandCursor: true });
      panel.on('pointerdown', () => {
        this.config?.onOrderComplete(order);
      });
    }

    this.renderSource(order.source, x + 8, y + 5, ready ? 1 : 0.9);

    const orderName = this.scene.add
      .text(x + 8, y + 16, order.name, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setResolution(2);

    this.objects.push(orderName);

    this.renderRequirements(order, x + 8, y + 41, width - REWARD_TEXT_WIDTH - 18, textColor, ready ? 1 : 0.9);

    const rewardText = this.scene.add
      .text(x + width - REWARD_TEXT_WIDTH, y + 34, `${order.coinReward}c  ${order.xpReward} XP`, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold'
      })
      .setResolution(2);

    this.objects.push(rewardText);
  }

  private renderSource(source: OrderSource | undefined, x: number, y: number, alpha: number): void {
    if (source === undefined) {
      return;
    }

    const sourceAlpha = alpha === 1 ? 1 : 0.9;
    const icon = this.createSourceIcon(source, x + 5, y + 4, sourceAlpha);
    const label = this.scene.add
      .text(x + 17, y - 1, `From: ${source}`, {
        color: alpha === 1 ? SOURCE_TEXT_COLOR : DISABLED_SOURCE_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold'
      })
      .setResolution(2)
      .setAlpha(sourceAlpha);

    this.objects.push(icon, label);
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
      const itemName = getItemName(typedItemId);
      const icon = createItemIcon(this.scene, typedItemId, cursorX + 6, y + 2, 13, { alpha });
      const quantityText = this.scene.add.text(cursorX + 15, y - 6, `${count}`, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px'
      }).setResolution(2);
      const itemText = this.scene.add.text(cursorX + 15 + quantityText.width + 3, y - 6, itemName, {
        color: alpha === 1 ? ITEM_TEXT_COLOR : DISABLED_ITEM_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px'
      }).setResolution(2);
      const textWidth = quantityText.width + 3 + itemText.width;
      const entryWidth = 17 + Math.min(textWidth, 64) + 5;

      icon.setAlpha(alpha);
      quantityText.setAlpha(alpha);
      itemText.setAlpha(alpha);

      if (cursorX + entryWidth > x + maxWidth) {
        itemText.setText(`${itemName.slice(0, 4)}.`);
      }

      this.objects.push(icon, quantityText, itemText);
      cursorX += entryWidth;
    });
  }

  private createSourceIcon(
    source: OrderSource,
    x: number,
    y: number,
    alpha: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y).setAlpha(alpha);
    const graphics = this.scene.add.graphics();

    container.add(graphics);

    switch (source) {
      case 'Farm Stand':
        this.drawFarmStandIcon(graphics);
        break;
      case 'Baker':
        this.drawBakerIcon(graphics);
        break;
      case 'Village Market':
        this.drawMarketIcon(graphics);
        break;
      case 'Village Cook':
        this.drawCookIcon(graphics);
        break;
      case 'Lantern Guild':
        this.drawLanternIcon(graphics);
        break;
    }

    return container;
  }

  private drawFarmStandIcon(graphics: Phaser.GameObjects.Graphics): void {
    graphics.lineStyle(1.3, 0x5f7f35, 1);
    graphics.lineBetween(0, 4, 0, -4);
    graphics.lineBetween(-3, 4, -2, -2);
    graphics.lineBetween(3, 4, 2, -2);
    graphics.fillStyle(0xf3c64a, 1);
    graphics.fillEllipse(0, -5, 3, 5);
    graphics.fillEllipse(-3, -1, 3, 5);
    graphics.fillEllipse(3, -1, 3, 5);
  }

  private drawBakerIcon(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0xc98035, 1);
    graphics.fillEllipse(0, 1, 13, 8);
    graphics.fillStyle(0xe8ad5a, 1);
    graphics.fillEllipse(0, -1, 10, 5);
    graphics.lineStyle(1, 0x8f5428, 0.8);
    graphics.lineBetween(-3, -2, -1, 2);
    graphics.lineBetween(2, -2, 3, 2);
  }

  private drawMarketIcon(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0xb48756, 1);
    graphics.fillRect(-5, -2, 10, 7);
    graphics.lineStyle(1, 0x6f5734, 1);
    graphics.strokeRect(-5, -2, 10, 7);
    graphics.lineBetween(-5, 1, 5, 1);
    graphics.lineBetween(0, -2, 0, 5);
  }

  private drawCookIcon(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0xf5ead0, 1);
    graphics.fillEllipse(0, 2, 13, 6);
    graphics.fillStyle(0x8f7448, 1);
    graphics.fillEllipse(0, 1, 9, 3);
    graphics.lineStyle(1, 0x6f5734, 1);
    graphics.arc(0, -1, 6, 0.15, Math.PI - 0.15);
  }

  private drawLanternIcon(graphics: Phaser.GameObjects.Graphics): void {
    graphics.lineStyle(1, 0x6f5734, 1);
    graphics.strokeRoundedRect(-4, -4, 8, 9, 2);
    graphics.lineBetween(-2, -5, 2, -5);
    graphics.fillStyle(0x8c58d8, 1);
    graphics.fillCircle(0, 1, 3);
    graphics.fillStyle(0xd8b7ff, 0.9);
    graphics.fillCircle(-1, 0, 1);
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
