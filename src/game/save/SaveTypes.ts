import type { GameState } from '../models/GameStateTypes';
import type { PlotState } from '../models/PlotTypes';

export interface SavedPlotState extends PlotState {
  elapsedGrowMs: number | null;
}

export interface SavedGameData {
  version: 1;
  gameState: GameState;
  plots: SavedPlotState[];
  purchasedPlotUpgradeCount: number;
}
