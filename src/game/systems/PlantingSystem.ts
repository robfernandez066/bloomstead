import type { CropDefinition } from '../models/CropTypes';
import type { PlotState } from '../models/PlotTypes';
import type { GameStateSystem } from './GameStateSystem';
import type { PlotStateSystem } from './PlotStateSystem';

export interface PlantResult {
  status: 'planted';
  crop: CropDefinition;
  plot: PlotState;
  seedCost: number;
}

export interface InsufficientCoinsPlantResult {
  status: 'insufficient-coins';
  crop: CropDefinition;
  plot: PlotState;
}

export type PlantAttemptResult = PlantResult | InsufficientCoinsPlantResult;

export class PlantingSystem {
  private readonly gameState: GameStateSystem;
  private readonly plotState: PlotStateSystem;
  private readonly paintedPlots = new Set<string>();
  private insufficientCoinsReported = false;

  constructor(gameState: GameStateSystem, plotState: PlotStateSystem) {
    this.gameState = gameState;
    this.plotState = plotState;
  }

  beginPaint(plot: PlotState): PlantAttemptResult | null {
    this.paintedPlots.clear();
    this.insufficientCoinsReported = false;
    return this.tryPlantOnce(plot);
  }

  paintOver(plot: PlotState): PlantAttemptResult | null {
    return this.tryPlantOnce(plot);
  }

  endPaint(): void {
    this.paintedPlots.clear();
    this.insufficientCoinsReported = false;
  }

  private tryPlantOnce(plot: PlotState): PlantAttemptResult | null {
    const plotKey = `${plot.row}:${plot.column}`;

    if (this.paintedPlots.has(plotKey)) {
      return null;
    }

    this.paintedPlots.add(plotKey);
    return this.tryPlant(plot);
  }

  private tryPlant(plot: PlotState): PlantAttemptResult | null {
    const crop = this.gameState.getSelectedSeed();

    if (!plot.unlocked || plot.plantedCropId !== null) {
      return null;
    }

    if (!this.gameState.isCropUnlocked(crop)) {
      return null;
    }

    if (!this.gameState.canAfford(crop.seedCost)) {
      if (this.insufficientCoinsReported) {
        return null;
      }

      this.insufficientCoinsReported = true;
      return { status: 'insufficient-coins', crop, plot };
    }

    if (!this.gameState.spendCoins(crop.seedCost)) {
      return null;
    }

    this.plotState.plantCrop(plot, crop);
    return { status: 'planted', crop, plot, seedCost: crop.seedCost };
  }
}
