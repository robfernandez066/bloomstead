import { MVP_PLOT_UPGRADES } from '../data/PlotUpgrades';
import type { PlotUpgradeDefinition } from '../models/UpgradeTypes';
import type { GameStateSystem } from './GameStateSystem';
import type { PlotStateSystem } from './PlotStateSystem';

export interface PlotUpgradeResult {
  upgrade: PlotUpgradeDefinition;
  unlockedPlots: number;
}

export class UpgradeSystem {
  private readonly gameState: GameStateSystem;
  private readonly plotState: PlotStateSystem;
  private nextPlotUpgradeIndex = 0;

  constructor(gameState: GameStateSystem, plotState: PlotStateSystem, purchasedPlotUpgradeCount = 0) {
    this.gameState = gameState;
    this.plotState = plotState;
    this.nextPlotUpgradeIndex = purchasedPlotUpgradeCount;
  }

  getPurchasedPlotUpgradeCount(): number {
    return this.nextPlotUpgradeIndex;
  }

  getNextPlotUpgrade(): PlotUpgradeDefinition | null {
    return MVP_PLOT_UPGRADES[this.nextPlotUpgradeIndex] ?? null;
  }

  canAffordNextPlotUpgrade(): boolean {
    const upgrade = this.getNextPlotUpgrade();

    return upgrade !== null && this.gameState.canAfford(upgrade.coinCost);
  }

  purchaseNextPlotUpgrade(): PlotUpgradeResult | null {
    const upgrade = this.getNextPlotUpgrade();

    if (upgrade === null || !this.gameState.spendCoins(upgrade.coinCost)) {
      return null;
    }

    const unlockedPlots = this.plotState.unlockNextLockedPlots(upgrade.plotsToUnlock);
    this.nextPlotUpgradeIndex += 1;

    return { upgrade, unlockedPlots };
  }
}
