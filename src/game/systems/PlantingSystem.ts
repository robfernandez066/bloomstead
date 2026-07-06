import type { PlotState } from '../models/PlotTypes';
import type { GameStateSystem } from './GameStateSystem';
import type { PlotStateSystem } from './PlotStateSystem';

export class PlantingSystem {
  private readonly gameState: GameStateSystem;
  private readonly plotState: PlotStateSystem;
  private readonly paintedPlots = new Set<string>();

  constructor(gameState: GameStateSystem, plotState: PlotStateSystem) {
    this.gameState = gameState;
    this.plotState = plotState;
  }

  beginPaint(plot: PlotState): boolean {
    this.paintedPlots.clear();
    return this.tryPlantOnce(plot);
  }

  paintOver(plot: PlotState): boolean {
    return this.tryPlantOnce(plot);
  }

  endPaint(): void {
    this.paintedPlots.clear();
  }

  private tryPlantOnce(plot: PlotState): boolean {
    const plotKey = `${plot.row}:${plot.column}`;

    if (this.paintedPlots.has(plotKey)) {
      return false;
    }

    this.paintedPlots.add(plotKey);
    return this.tryPlant(plot);
  }

  private tryPlant(plot: PlotState): boolean {
    const crop = this.gameState.getSelectedSeed();

    if (!plot.unlocked || plot.plantedCropId !== null) {
      return false;
    }

    if (!this.gameState.isCropUnlocked(crop) || !this.gameState.canAfford(crop.seedCost)) {
      return false;
    }

    if (!this.gameState.spendCoins(crop.seedCost)) {
      return false;
    }

    this.plotState.plantCrop(plot, crop);
    return true;
  }
}
