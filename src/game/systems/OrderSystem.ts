import { MVP_ORDERS } from '../data/Orders';
import { CROPS } from '../data/Crops';
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
    this.nextOrderIndex = this.createInitialNextOrderIndex(savedOrderState);
  }

  getActiveOrders(): OrderDefinition[] {
    return this.activeOrders;
  }

  refreshActiveOrdersForCurrentLevel(): void {
    const eligibleOrderIds = new Set(this.getEligibleOrders().map((order) => order.id));
    const activeOrderIds = new Set<OrderId>();

    for (let index = this.activeOrders.length - 1; index >= 0; index -= 1) {
      const orderId = this.activeOrders[index].id;

      if (!eligibleOrderIds.has(orderId) || activeOrderIds.has(orderId)) {
        this.activeOrders.splice(index, 1);
      } else {
        activeOrderIds.add(orderId);
      }
    }

    this.fillActiveOrders();
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

    this.activeOrders.splice(activeIndex, 1);
    const replacementOrder = this.getNextInactiveOrder();

    if (replacementOrder !== null) {
      this.activeOrders.splice(activeIndex, 0, replacementOrder);
    }

    this.fillActiveOrders();
  }

  private getNextInactiveOrder(): OrderDefinition | null {
    const eligibleOrders = this.getEligibleOrders();

    if (eligibleOrders.length === 0) {
      return null;
    }

    const activeIds = new Set(this.activeOrders.map((order) => order.id));

    for (let attempts = 0; attempts < MVP_ORDERS.length; attempts += 1) {
      const order = MVP_ORDERS[this.nextOrderIndex];

      this.nextOrderIndex = (this.nextOrderIndex + 1) % MVP_ORDERS.length;

      if (this.isOrderEligible(order) && !activeIds.has(order.id)) {
        return order;
      }
    }

    return eligibleOrders[0];
  }

  private createInitialActiveOrders(savedOrderState?: SavedOrderState): OrderDefinition[] {
    if (savedOrderState === undefined) {
      return this.getEligibleOrders().slice(0, 3);
    }

    if (!Array.isArray(savedOrderState.activeOrderIds)) {
      return this.getEligibleOrders().slice(0, 3);
    }

    const seenOrderIds = new Set<OrderId>();
    const savedOrders: OrderDefinition[] = [];

    for (const orderId of savedOrderState.activeOrderIds) {
      const order = MVP_ORDERS.find((candidateOrder) => candidateOrder.id === orderId);

      if (order === undefined || seenOrderIds.has(order.id) || !this.isOrderEligible(order)) {
        continue;
      }

      savedOrders.push(order);
      seenOrderIds.add(order.id);
    }

    if (savedOrders.length === 0) {
      return this.getEligibleOrders().slice(0, 3);
    }

    return this.fillOrders(savedOrders);
  }

  private createInitialNextOrderIndex(savedOrderState?: SavedOrderState): number {
    if (
      savedOrderState === undefined ||
      !Number.isInteger(savedOrderState.nextOrderIndex) ||
      savedOrderState.nextOrderIndex < 0
    ) {
      return 3;
    }

    return savedOrderState.nextOrderIndex % MVP_ORDERS.length;
  }

  private fillActiveOrders(): void {
    this.fillOrders(this.activeOrders);
  }

  private fillOrders(orders: OrderDefinition[]): OrderDefinition[] {
    const activeIds = new Set(orders.map((order) => order.id));

    for (const order of this.getEligibleOrders()) {
      if (orders.length >= 3) {
        break;
      }

      if (!activeIds.has(order.id)) {
        orders.push(order);
        activeIds.add(order.id);
      }
    }

    return orders;
  }

  private getEligibleOrders(): OrderDefinition[] {
    return MVP_ORDERS.filter((order) => this.isOrderEligible(order));
  }

  private isOrderEligible(order: OrderDefinition): boolean {
    return Object.keys(order.requirements).every((cropId) => {
      return this.gameState.isCropUnlocked(CROPS[cropId as keyof typeof CROPS]);
    });
  }
}
