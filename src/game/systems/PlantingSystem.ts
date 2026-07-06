import type { CropDefinition } from '../models/CropTypes';
import type { PlotState } from '../models/PlotTypes';
import type { GameStateSystem } from './GameStateSystem';
import type { PlotStateSystem } from './PlotStateSystem';

export interface PlantResult {
  crop: CropDefinition;
  plot: PlotState;
  seedCost: number;
}

export class PlantingSystem {
  private readonly gameState: GameStateSystem;
  private readonly plotState: PlotStateSystem;
  private readonly paintedPlots = new Set<string>();

  constructor(gameState: GameStateSystem, plotState: PlotStateSystem) {
    this.gameState = gameState;
    this.plotState = plotState;
  }

  beginPaint(plot: PlotState): PlantResult | null {
    this.paintedPlots.clear();
    return this.tryPlantOnce(plot);
  }

  paintOver(plot: PlotState): PlantResult | null {
    return this.tryPlantOnce(plot);
  }

  endPaint(): void {
    this.paintedPlots.clear();
  }

  private tryPlantOnce(plot: PlotState): PlantResult | null {
    const plotKey = `${plot.row}:${plot.column}`;

    if (this.paintedPlots.has(plotKey)) {
      return null;
    }

    this.paintedPlots.add(plotKey);
    return this.tryPlant(plot);
  }

  private tryPlant(plot: PlotState): PlantResult | null {
    const crop = this.gameState.getSelectedSeed();

    if (!plot.unlocked || plot.plantedCropId !== null) {
      return null;
    }

    if (!this.gameState.isCropUnlocked(crop) || !this.gameState.canAfford(crop.seedCost)) {
      return null;
    }

    if (!this.gameState.spendCoins(crop.seedCost)) {
      return null;
    }

    this.plotState.plantCrop(plot, crop);
    return { crop, plot, seedCost: crop.seedCost };
  }
}
