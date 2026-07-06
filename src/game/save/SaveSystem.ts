import type { PlotState } from '../models/PlotTypes';
import type { GameStateSystem } from '../systems/GameStateSystem';
import type { OrderSystem } from '../systems/OrderSystem';
import type { PlotStateSystem } from '../systems/PlotStateSystem';
import type { UpgradeSystem } from '../systems/UpgradeSystem';
import type { SavedGameData, SavedPlotState } from './SaveTypes';

const SAVE_KEY = 'bloomstead.save.v1';

export class SaveSystem {
  load(): SavedGameData | null {
    const rawSave = localStorage.getItem(SAVE_KEY);

    if (rawSave === null) {
      return null;
    }

    try {
      const parsedSave = JSON.parse(rawSave) as SavedGameData;

      if (parsedSave.version !== 1) {
        return null;
      }

      return this.rebaseSavedPlots(parsedSave);
    } catch {
      return null;
    }
  }

  save(
    gameStateSystem: GameStateSystem,
    plotStateSystem: PlotStateSystem,
    upgradeSystem: UpgradeSystem,
    orderSystem: OrderSystem
  ): void {
    const saveData: SavedGameData = {
      version: 1,
      gameState: structuredClone(gameStateSystem.getState()),
      plots: this.createSavedPlots(plotStateSystem.getPlots()),
      purchasedPlotUpgradeCount: upgradeSystem.getPurchasedPlotUpgradeCount(),
      orderState: orderSystem.getSavedOrderState()
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  private createSavedPlots(plots: PlotState[]): SavedPlotState[] {
    const now = Date.now();

    return plots.map((plot) => ({
      ...plot,
      elapsedGrowMs:
        plot.plantedAt === null || plot.growDurationMs === null
          ? null
          : Math.min(now - plot.plantedAt, plot.growDurationMs)
    }));
  }

  private rebaseSavedPlots(saveData: SavedGameData): SavedGameData {
    const now = Date.now();

    return {
      ...saveData,
      plots: saveData.plots.map((plot) => {
        if (
          plot.plantedCropId === null ||
          plot.growDurationMs === null ||
          plot.elapsedGrowMs === null
        ) {
          return {
            ...plot,
            plantedAt: null,
            growDurationMs: plot.growDurationMs,
            ready: false
          };
        }

        const elapsedGrowMs = Math.min(plot.elapsedGrowMs, plot.growDurationMs);

        return {
          ...plot,
          plantedAt: now - elapsedGrowMs,
          ready: elapsedGrowMs >= plot.growDurationMs
        };
      })
    };
  }
}
