import Phaser from 'phaser';
import { getItemName } from '../data/Items';
import type { ItemId } from '../models/ItemTypes';
import type { OrderDefinition, OrderId, OrderSource } from '../models/OrderTypes';
import type { OrderSystem } from '../systems/OrderSystem';
import { createItemIcon } from './ItemIcon';

const OVERLAY_FILL = 0x263522;
const BOARD_FILL = 0xf7edc7;
const BOARD_STROKE = 0x6f5734;
const CARD_FILL = 0xf4e6b3;
const READY_FILL = 0xdff0ad;
const DISABLED_FILL = 0xc9ccb2;
const READY_STROKE = 0x496f38;
const TEXT_COLOR = '#2f3b26';
const DISABLED_TEXT = '#4f5a45';
const SOURCE_TEXT_COLOR = '#5e7047';
const ITEM_TEXT_COLOR = '#8f6426';
const DEPTH = 110;
const HEADER_HEIGHT = 44;
const ACTION_WIDTH = 84;
const ACTION_HEIGHT = 26;

interface OrderBoardConfig {
  x: number;
  y: number;
  width: number;
  orderHeight: number;
  gap: number;
  bottomPadding: number;
  getOwnedItemCount: (itemId: ItemId) => number;
  onOrderComplete: (order: OrderDefinition) => void;
  onClose?: () => void;
}

export class OrderBoardSystem {
  private readonly scene: Phaser.Scene;
  private readonly orderSystem: OrderSystem;
  private config?: OrderBoardConfig;
  private open = false;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly orderBounds = new Map<OrderId, Phaser.Geom.Rectangle>();

  constructor(scene: Phaser.Scene, orderSystem: OrderSystem) {
    this.scene = scene;
    this.orderSystem = orderSystem;
  }

  render(config: OrderBoardConfig): void {
    this.config = config;
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
    this.clearObjects();

    if (notify) {
      this.config?.onClose?.();
    }
  }

  refresh(): void {
    if (this.config === undefined || !this.open) {
      return;
    }

    this.clearObjects();

    const orders = this.orderSystem.getActiveOrders();
    const { x, y, width } = this.config;
    const bodyHeight = orders.length === 0
      ? 94
      : orders.length * this.config.orderHeight + Math.max(0, orders.length - 1) * this.config.gap;
    const windowHeight = HEADER_HEIGHT + bodyHeight + this.config.bottomPadding;
    const overlay = this.scene.add
      .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, OVERLAY_FILL, 0.42)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(DEPTH);

    overlay.on('pointerdown', () => this.closeWindow());

    const panel = this.scene.add
      .rectangle(x, y, width, windowHeight, BOARD_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(3, BOARD_STROKE)
      .setInteractive()
      .setDepth(DEPTH + 1);

    panel.on('pointerdown', (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData
    ) => event.stopPropagation());

    const title = this.scene.add
      .text(x + 14, y + 11, 'Orders', {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold'
      })
      .setDepth(DEPTH + 2);

    this.objects.push(overlay, panel, title);
    this.renderCloseButton(x + width - 42, y + 7);

    if (orders.length === 0) {
      this.objects.push(
        this.scene.add
          .text(x + width / 2, y + HEADER_HEIGHT + 30, 'No village requests are available right now.\nKeep farming!', {
            color: DISABLED_TEXT,
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            align: 'center',
            lineSpacing: 4
          })
          .setOrigin(0.5, 0)
          .setDepth(DEPTH + 2)
      );
      return;
    }

    orders.forEach((order, index) => this.renderOrder(order, index));
  }

  getOrderBounds(orderId: OrderId): Phaser.Geom.Rectangle | null {
    return this.orderBounds.get(orderId) ?? null;
  }

  private renderOrder(order: OrderDefinition, index: number): void {
    if (this.config === undefined) {
      return;
    }

    const ready = this.orderSystem.canCompleteOrder(order);
    const x = this.config.x + 10;
    const y = this.config.y + HEADER_HEIGHT + index * (this.config.orderHeight + this.config.gap);
    const width = this.config.width - 20;
    const bounds = new Phaser.Geom.Rectangle(x, y, width, this.config.orderHeight);
    const card = this.scene.add
      .rectangle(x, y, width, this.config.orderHeight, ready ? READY_FILL : CARD_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, ready ? READY_STROKE : BOARD_STROKE)
      .setAlpha(ready ? 1 : 0.94)
      .setDepth(DEPTH + 2);

    this.orderBounds.set(order.id, bounds);
    this.objects.push(card);
    this.renderSource(order.source, x + 8, y + 5, ready ? 1 : 0.82);

    const orderName = this.scene.add
      .text(x + 8, y + 17, order.name, {
        color: ready ? TEXT_COLOR : DISABLED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setResolution(2)
      .setDepth(DEPTH + 3);
    const rewardText = this.scene.add
      .text(x + width - 8, y + 7, `${order.coinReward}c  ${order.xpReward} XP`, {
        color: ready ? TEXT_COLOR : DISABLED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(1, 0)
      .setResolution(2)
      .setDepth(DEPTH + 3);

    this.objects.push(orderName, rewardText);
    this.renderRequirements(order, x + 8, y + 50, width - ACTION_WIDTH - 26, ready ? 1 : 0.82);
    this.renderAction(order, x + width - ACTION_WIDTH - 8, y + 34, ready);
  }

  private renderAction(order: OrderDefinition, x: number, y: number, ready: boolean): void {
    const button = this.scene.add
      .rectangle(x, y, ACTION_WIDTH, ACTION_HEIGHT, ready ? READY_FILL : DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, ready ? READY_STROKE : BOARD_STROKE)
      .setAlpha(ready ? 1 : 0.8)
      .setDepth(DEPTH + 3);

    if (ready) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.config?.onOrderComplete(order));
    }

    const label = this.scene.add
      .text(x + ACTION_WIDTH / 2, y + ACTION_HEIGHT / 2, ready ? 'Complete' : 'Need items', {
        color: ready ? TEXT_COLOR : DISABLED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 4);

    this.objects.push(button, label);
  }

  private renderRequirements(order: OrderDefinition, x: number, y: number, maxWidth: number, alpha: number): void {
    if (this.config === undefined) {
      return;
    }

    const requirements = Object.entries(order.requirements);
    const slotWidth = maxWidth / Math.max(1, requirements.length);

    requirements.forEach(([itemId, requiredCount], index) => {
      const typedItemId = itemId as ItemId;
      const itemName = getItemName(typedItemId);
      const ownedCount = this.config?.getOwnedItemCount(typedItemId) ?? 0;
      const entryX = x + index * slotWidth;
      const icon = createItemIcon(this.scene, typedItemId, entryX + 6, y + 1, 13, {
        alpha,
        depth: DEPTH + 3
      });
      const label = this.scene.add
        .text(entryX + 15, y - 6, `${ownedCount}/${requiredCount ?? 0} ${itemName}`, {
          color: alpha === 1 ? ITEM_TEXT_COLOR : DISABLED_TEXT,
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold'
        })
        .setResolution(2)
        .setAlpha(alpha)
        .setDepth(DEPTH + 3);

      if (label.width > slotWidth - 18) {
        label.setText(`${ownedCount}/${requiredCount ?? 0} ${itemName.slice(0, 4)}.`);
      }

      this.objects.push(icon, label);
    });
  }

  private renderSource(source: OrderSource | undefined, x: number, y: number, alpha: number): void {
    if (source === undefined) {
      return;
    }

    const icon = this.createSourceIcon(source, x + 5, y + 4, alpha);
    const label = this.scene.add
      .text(x + 17, y - 1, `From: ${source}`, {
        color: SOURCE_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold'
      })
      .setResolution(2)
      .setAlpha(alpha)
      .setDepth(DEPTH + 3);

    this.objects.push(icon, label);
  }

  private renderCloseButton(x: number, y: number): void {
    const button = this.scene.add
      .rectangle(x, y, 32, 30, DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BOARD_STROKE)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 2);

    button.on('pointerdown', () => this.closeWindow());
    const label = this.scene.add
      .text(x + 16, y + 15, 'X', {
        color: DISABLED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 3);

    this.objects.push(button, label);
  }

  private createSourceIcon(source: OrderSource, x: number, y: number, alpha: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y).setAlpha(alpha).setDepth(DEPTH + 3);
    const graphics = this.scene.add.graphics();

    container.add(graphics);

    switch (source) {
      case 'Farm Stand':
        graphics.lineStyle(1.3, 0x5f7f35, 1);
        graphics.lineBetween(0, 4, 0, -4);
        graphics.lineBetween(-3, 4, -2, -2);
        graphics.lineBetween(3, 4, 2, -2);
        graphics.fillStyle(0xf3c64a, 1);
        graphics.fillEllipse(0, -5, 3, 5);
        graphics.fillEllipse(-3, -1, 3, 5);
        graphics.fillEllipse(3, -1, 3, 5);
        break;
      case 'Baker':
        graphics.fillStyle(0xc98035, 1);
        graphics.fillEllipse(0, 1, 13, 8);
        graphics.fillStyle(0xe8ad5a, 1);
        graphics.fillEllipse(0, -1, 10, 5);
        break;
      case 'Village Market':
        graphics.fillStyle(0xb48756, 1);
        graphics.fillRect(-5, -2, 10, 7);
        graphics.lineStyle(1, 0x6f5734, 1);
        graphics.strokeRect(-5, -2, 10, 7);
        break;
      case 'Village Cook':
        graphics.fillStyle(0xf5ead0, 1);
        graphics.fillEllipse(0, 2, 13, 6);
        graphics.fillStyle(0x8f7448, 1);
        graphics.fillEllipse(0, 1, 9, 3);
        break;
      case 'Lantern Guild':
        graphics.lineStyle(1, 0x6f5734, 1);
        graphics.strokeRoundedRect(-4, -4, 8, 9, 2);
        graphics.fillStyle(0x8c58d8, 1);
        graphics.fillCircle(0, 1, 3);
        break;
    }

    return container;
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }

    this.objects.length = 0;
    this.orderBounds.clear();
  }
}
