import type { CropDefinition } from '../models/CropTypes';
import type { PlotState } from '../models/PlotTypes';

interface PlotStateSystemConfig {
  rows: number;
  columns: number;
  unlockedTileCount: number;
}

export class PlotStateSystem {
  private readonly plots: PlotState[];

  constructor(config: PlotStateSystemConfig) {
    this.plots = this.createInitialPlots(config);
  }

  getPlots(): PlotState[] {
    return this.plots;
  }

  unlockNextLockedPlots(count: number): number {
    let unlockedCount = 0;

    for (const plot of this.plots) {
      if (plot.unlocked) {
        continue;
      }

      plot.unlocked = true;
      unlockedCount += 1;

      if (unlockedCount >= count) {
        break;
      }
    }

    return unlockedCount;
  }

  plantCrop(plot: PlotState, crop: CropDefinition, plantedAt = Date.now()): void {
    plot.plantedCropId = crop.id;
    plot.plantedAt = plantedAt;
    plot.growDurationMs = crop.growTimeSeconds * 1000;
    plot.ready = this.isPlotReady(plot);
  }

  clearPlot(plot: PlotState): void {
    plot.plantedCropId = null;
    plot.plantedAt = null;
    plot.growDurationMs = null;
    plot.ready = false;
  }

  refreshReadyStates(now = Date.now()): void {
    for (const plot of this.plots) {
      plot.ready = this.isPlotReady(plot, now);
    }
  }

  isPlotReady(plot: PlotState, now = Date.now()): boolean {
    if (plot.plantedCropId === null || plot.plantedAt === null || plot.growDurationMs === null) {
      return false;
    }

    return now - plot.plantedAt >= plot.growDurationMs;
  }

  private createInitialPlots(config: PlotStateSystemConfig): PlotState[] {
    const plots: PlotState[] = [];

    for (let row = 0; row < config.rows; row += 1) {
      for (let column = 0; column < config.columns; column += 1) {
        const tileIndex = row * config.columns + column;

        plots.push({
          row,
          column,
          unlocked: tileIndex < config.unlockedTileCount,
          plantedCropId: null,
          plantedAt: null,
          growDurationMs: null,
          ready: false
        });
      }
    }

    return plots;
  }
}
