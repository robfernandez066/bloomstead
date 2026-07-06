import { CROPS } from '../data/Crops';
import type { CropDefinition } from '../models/CropTypes';
import type { PlotState } from '../models/PlotTypes';
import type { GameStateSystem } from './GameStateSystem';
import type { PlotStateSystem } from './PlotStateSystem';

export interface HarvestResult {
  crop: CropDefinition;
  plot: PlotState;
}

export class HarvestingSystem {
  private readonly gameState: GameStateSystem;
  private readonly plotState: PlotStateSystem;
  private readonly harvestedPlots = new Set<string>();

  constructor(gameState: GameStateSystem, plotState: PlotStateSystem) {
    this.gameState = gameState;
    this.plotState = plotState;
  }

  beginHarvest(plot: PlotState): HarvestResult | null {
    this.harvestedPlots.clear();
    return this.tryHarvestOnce(plot);
  }

  harvestOver(plot: PlotState): HarvestResult | null {
    return this.tryHarvestOnce(plot);
  }

  endHarvest(): void {
    this.harvestedPlots.clear();
  }

  private tryHarvestOnce(plot: PlotState): HarvestResult | null {
    const plotKey = `${plot.row}:${plot.column}`;

    if (this.harvestedPlots.has(plotKey)) {
      return null;
    }

    this.harvestedPlots.add(plotKey);
    return this.tryHarvest(plot);
  }

  private tryHarvest(plot: PlotState): HarvestResult | null {
    if (!plot.unlocked || plot.plantedCropId === null || !plot.ready) {
      return null;
    }

    const crop = CROPS[plot.plantedCropId];

    this.gameState.addCropToInventory(crop.id, 1);
    this.gameState.addFarmXp(crop.xp);
    this.plotState.clearPlot(plot);

    return { crop, plot };
  }
}
