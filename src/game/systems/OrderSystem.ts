import { MVP_ORDERS } from '../data/Orders';
import type { OrderDefinition, OrderId, OrderRequirements } from '../models/OrderTypes';
import type { FarmXpResult, GameStateSystem } from './GameStateSystem';

export interface OrderCompletionResult {
  order: OrderDefinition;
  xpResult: FarmXpResult;
}

export class OrderSystem {
  private readonly gameState: GameStateSystem;
  private readonly activeOrders: OrderDefinition[];
  private nextOrderIndex = 3;

  constructor(gameState: GameStateSystem) {
    this.gameState = gameState;
    this.activeOrders = MVP_ORDERS.slice(0, 3);
  }

  getActiveOrders(): OrderDefinition[] {
    return this.activeOrders;
  }

  canCompleteOrder(order: OrderDefinition): boolean {
    return this.gameState.hasCropInventory(order.requirements);
  }

  completeOrder(orderId: OrderId): OrderCompletionResult | null {
    const order = this.activeOrders.find((activeOrder) => activeOrder.id === orderId);

    if (order === undefined || !this.canCompleteOrder(order)) {
      return null;
    }

    this.gameState.removeCropInventory(order.requirements);
    this.gameState.addCoins(order.coinReward);
    const xpResult = this.gameState.addFarmXp(order.xpReward);
    this.replaceOrder(order.id);

    return { order, xpResult };
  }

  private replaceOrder(orderId: OrderId): void {
    const activeIndex = this.activeOrders.findIndex((order) => order.id === orderId);

    if (activeIndex === -1) {
      return;
    }

    this.activeOrders[activeIndex] = this.getNextInactiveOrder();
  }

  private getNextInactiveOrder(): OrderDefinition {
    const activeIds = new Set(this.activeOrders.map((order) => order.id));

    for (let attempts = 0; attempts < MVP_ORDERS.length; attempts += 1) {
      const order = MVP_ORDERS[this.nextOrderIndex];

      this.nextOrderIndex = (this.nextOrderIndex + 1) % MVP_ORDERS.length;

      if (!activeIds.has(order.id)) {
        return order;
      }
    }

    return MVP_ORDERS[this.nextOrderIndex];
  }
}
