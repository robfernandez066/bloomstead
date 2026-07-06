import type { GameState } from '../models/GameStateTypes';
import type { OrderId } from '../models/OrderTypes';
import type { PlotState } from '../models/PlotTypes';
import type { TutorialState } from '../models/TutorialTypes';

export interface SavedPlotState extends PlotState {
  elapsedGrowMs: number | null;
}

export interface SavedOrderState {
  activeOrderIds: OrderId[];
  nextOrderIndex: number;
}

export interface SavedGameData {
  version: 1;
  lastPlayedAt?: number;
  gameState: GameState;
  plots: SavedPlotState[];
  purchasedPlotUpgradeCount: number;
  orderState?: SavedOrderState;
  tutorialState?: TutorialState;
}

export interface SaveLoadResult {
  data: SavedGameData;
  cropsFinishedWhileAway: number;
}
