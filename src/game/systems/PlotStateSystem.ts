import { STARTING_UNLOCKED_PLOTS } from '../data/PlotUnlocks';
import type { CropDefinition } from '../models/CropTypes';
import type { GridPosition } from '../models/GridTypes';
import type { PlotState } from '../models/PlotTypes';

interface PlotStateSystemConfig {
  rows: number;
  columns: number;
  initialPlots?: PlotState[];
}

export class PlotStateSystem {
  private readonly plots: PlotState[];

  constructor(config: PlotStateSystemConfig) {
    this.plots = config.initialPlots ?? this.createInitialPlots(config);
  }

  getPlots(): PlotState[] {
    return this.plots;
  }

  unlockPlots(positions: GridPosition[]): PlotState[] {
    const unlockedPlots: PlotState[] = [];

    for (const position of positions) {
      const plot = this.findPlot(position);

      if (plot === undefined || plot.unlocked) {
        continue;
      }

      plot.unlocked = true;
      unlockedPlots.push(plot);
    }

    return unlockedPlots;
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

  refreshReadyStates(now = Date.now()): boolean {
    let changed = false;

    for (const plot of this.plots) {
      const ready = this.isPlotReady(plot, now);

      if (plot.ready !== ready) {
        changed = true;
        plot.ready = ready;
      }
    }

    return changed;
  }

  isPlotReady(plot: PlotState, now = Date.now()): boolean {
    if (plot.plantedCropId === null || plot.plantedAt === null || plot.growDurationMs === null) {
      return false;
    }

    return now - plot.plantedAt >= plot.growDurationMs;
  }

  private createInitialPlots(config: PlotStateSystemConfig): PlotState[] {
    const plots: PlotState[] = [];
    const startingUnlockedPlotKeys = new Set(
      STARTING_UNLOCKED_PLOTS.map((position) => this.getPlotKey(position))
    );

    for (let row = 0; row < config.rows; row += 1) {
      for (let column = 0; column < config.columns; column += 1) {
        plots.push({
          row,
          column,
          unlocked: startingUnlockedPlotKeys.has(this.getPlotKey({ row, column })),
          plantedCropId: null,
          plantedAt: null,
          growDurationMs: null,
          ready: false
        });
      }
    }

    return plots;
  }

  private findPlot(position: GridPosition): PlotState | undefined {
    return this.plots.find((plot) => plot.row === position.row && plot.column === position.column);
  }

  private getPlotKey(position: GridPosition): string {
    return `${position.row}:${position.column}`;
  }
}
