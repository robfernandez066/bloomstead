import type { GameState } from '../models/GameStateTypes';
import type { OrderId } from '../models/OrderTypes';
import type { PlotState } from '../models/PlotTypes';

export interface SavedPlotState extends PlotState {
  elapsedGrowMs: number | null;
}

export interface SavedOrderState {
  activeOrderIds: OrderId[];
  nextOrderIndex: number;
}

export interface SavedGameData {
  version: 1;
  gameState: GameState;
  plots: SavedPlotState[];
  purchasedPlotUpgradeCount: number;
  orderState?: SavedOrderState;
}
