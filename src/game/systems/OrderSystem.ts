import { MVP_ORDERS } from '../data/Orders';
import type { OrderDefinition, OrderId } from '../models/OrderTypes';
import type { SavedOrderState } from '../save/SaveTypes';
import type { FarmXpResult, GameStateSystem } from './GameStateSystem';

export interface OrderCompletionResult {
  order: OrderDefinition;
  xpResult: FarmXpResult;
}

export class OrderSystem {
  private readonly gameState: GameStateSystem;
  private readonly activeOrders: OrderDefinition[];
  private nextOrderIndex = 3;

  constructor(gameState: GameStateSystem, savedOrderState?: SavedOrderState) {
    this.gameState = gameState;
    this.activeOrders = this.createInitialActiveOrders(savedOrderState);
    this.nextOrderIndex = savedOrderState?.nextOrderIndex ?? 3;
  }

  getActiveOrders(): OrderDefinition[] {
    return this.activeOrders;
  }

  getSavedOrderState(): SavedOrderState {
    return {
      activeOrderIds: this.activeOrders.map((order) => order.id),
      nextOrderIndex: this.nextOrderIndex
    };
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

  private createInitialActiveOrders(savedOrderState?: SavedOrderState): OrderDefinition[] {
    if (savedOrderState === undefined) {
      return MVP_ORDERS.slice(0, 3);
    }

    const savedOrders = savedOrderState.activeOrderIds
      .map((orderId) => MVP_ORDERS.find((order) => order.id === orderId))
      .filter((order): order is OrderDefinition => order !== undefined);

    if (savedOrders.length !== 3) {
      return MVP_ORDERS.slice(0, 3);
    }

    return savedOrders;
  }
}
