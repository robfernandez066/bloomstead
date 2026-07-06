import Phaser from 'phaser';
import { SaveSystem } from '../save/SaveSystem';
import { DevSaveControlsSystem } from '../ui/DevSaveControlsSystem';
import { FeedbackSystem } from '../ui/FeedbackSystem';
import { HudSystem } from '../ui/HudSystem';
import { FARM_LAYOUT } from '../ui/LayoutConfig';
import { OrderBoardSystem } from '../ui/OrderBoardSystem';
import { SeedSelectorSystem } from '../ui/SeedSelectorSystem';
import { UpgradePanelSystem } from '../ui/UpgradePanelSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { GridSystem } from '../systems/GridSystem';
import { HarvestingSystem, type HarvestResult } from '../systems/HarvestingSystem';
import { OrderSystem } from '../systems/OrderSystem';
import { PlantingSystem } from '../systems/PlantingSystem';
import { PlotStateSystem } from '../systems/PlotStateSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';

type DragMode = 'none' | 'plant' | 'harvest';

export class FarmScene extends Phaser.Scene {
  constructor() {
    super('FarmScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x8fcf8a);

    const saveSystem = new SaveSystem();
    const savedGameData = saveSystem.load();
    const gameStateSystem = new GameStateSystem(savedGameData?.gameState);
    const plotStateSystem = new PlotStateSystem({
      rows: 6,
      columns: 6,
      initialPlots: savedGameData?.plots
    });
    const plantingSystem = new PlantingSystem(gameStateSystem, plotStateSystem);
    const harvestingSystem = new HarvestingSystem(gameStateSystem, plotStateSystem);
    const orderSystem = new OrderSystem(gameStateSystem, savedGameData?.orderState);
    const upgradeSystem = new UpgradeSystem(
      gameStateSystem,
      plotStateSystem,
      savedGameData?.purchasedPlotUpgradeCount
    );
    const feedbackSystem = new FeedbackSystem(this);
    let dragMode: DragMode = 'none';

    const saveGame = (): void => {
      saveSystem.save(gameStateSystem, plotStateSystem, upgradeSystem, orderSystem);
    };

    const hudSystem = new HudSystem(this, gameStateSystem);
    const seedSelectorSystem = new SeedSelectorSystem(this, gameStateSystem);
    const orderBoardSystem = new OrderBoardSystem(this, orderSystem);
    const upgradePanelSystem = new UpgradePanelSystem(this, upgradeSystem);
    const devSaveControlsSystem = new DevSaveControlsSystem(this);
    let gridSystem: GridSystem;

    const handleLevelUp = (level: number): void => {
      seedSelectorSystem.refresh();
      feedbackSystem.showLevelUp(level, width / 2, height * 0.28);
    };

    const handleHarvestResult = (harvestResult: HarvestResult): void => {
      gridSystem.refreshPlotVisuals();
      hudSystem.refresh();
      orderBoardSystem.refresh();
      upgradePanelSystem.refresh();
      saveGame();
      feedbackSystem.showHarvestFeedback(
        gridSystem.getPlotScreenPosition(harvestResult.plot),
        harvestResult.crop.name
      );

      if (harvestResult.xpResult.leveledUp) {
        handleLevelUp(harvestResult.xpResult.currentLevel);
      }
    };

    gridSystem = new GridSystem(this, {
      tileWidth: FARM_LAYOUT.farmGrid.tileWidth,
      tileHeight: FARM_LAYOUT.farmGrid.tileHeight,
      area: FARM_LAYOUT.farmGrid,
      markerAnchorOffsetY: FARM_LAYOUT.farmGrid.markerAnchorOffsetY,
      debugAnchors: FARM_LAYOUT.farmGrid.debugAnchors
    }, plotStateSystem.getPlots(), {
      onPlotPressed: (plot) => {
        const harvestResult = harvestingSystem.beginHarvest(plot);

        if (harvestResult !== null) {
          dragMode = 'harvest';
          handleHarvestResult(harvestResult);
          return;
        }

        if (plantingSystem.beginPaint(plot)) {
          dragMode = 'plant';
          gridSystem.refreshPlotVisuals();
          hudSystem.refresh();
          upgradePanelSystem.refresh();
          saveGame();
          return;
        }

        dragMode = 'none';
      },
      onPlotDraggedOver: (plot) => {
        if (dragMode === 'harvest') {
          const harvestResult = harvestingSystem.harvestOver(plot);

          if (harvestResult !== null) {
            handleHarvestResult(harvestResult);
          }

          return;
        }

        if (dragMode === 'plant' && plantingSystem.paintOver(plot)) {
          gridSystem.refreshPlotVisuals();
          hudSystem.refresh();
          upgradePanelSystem.refresh();
          saveGame();
        }
      }
    });

    gridSystem.render();

    hudSystem.render(
      FARM_LAYOUT.hud.x,
      FARM_LAYOUT.hud.y,
      FARM_LAYOUT.hud.width,
      FARM_LAYOUT.hud.height
    );

    upgradePanelSystem.render({
      x: FARM_LAYOUT.plotUpgradePanel.x,
      y: FARM_LAYOUT.plotUpgradePanel.y,
      width: FARM_LAYOUT.plotUpgradePanel.width,
      height: FARM_LAYOUT.plotUpgradePanel.height,
      onPurchase: () => {
        const result = upgradeSystem.purchaseNextPlotUpgrade();

        if (result === null) {
          return;
        }

        gridSystem.refreshPlotVisuals();
        hudSystem.refresh();
        upgradePanelSystem.refresh();
        saveGame();
        feedbackSystem.showPlotsUnlocked(width / 2, FARM_LAYOUT.plotUpgradePanel.y - 8);
      }
    });

    orderBoardSystem.render({
      x: FARM_LAYOUT.orderBoard.x,
      y: FARM_LAYOUT.orderBoard.y,
      width: FARM_LAYOUT.orderBoard.width,
      orderHeight: FARM_LAYOUT.orderBoard.orderHeight,
      gap: FARM_LAYOUT.orderBoard.gap,
      bottomPadding: FARM_LAYOUT.orderBoard.bottomPadding,
      onOrderComplete: (order) => {
        const result = orderSystem.completeOrder(order.id);

        if (result === null) {
          return;
        }

        hudSystem.refresh();
        orderBoardSystem.refresh();
        upgradePanelSystem.refresh();
        saveGame();
        feedbackSystem.showOrderComplete(width / 2, FARM_LAYOUT.orderBoard.y - 10);

        if (result.xpResult.leveledUp) {
          handleLevelUp(result.xpResult.currentLevel);
        }
      }
    });

    this.input.on('pointerup', () => {
      plantingSystem.endPaint();
      harvestingSystem.endHarvest();
      dragMode = 'none';
    });

    this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        const readyStatesChanged = plotStateSystem.refreshReadyStates();
        gridSystem.refreshPlotVisuals();

        if (readyStatesChanged) {
          saveGame();
        }
      }
    });

    seedSelectorSystem.render({
      x: FARM_LAYOUT.seedSelector.x,
      y: FARM_LAYOUT.seedSelector.y,
      buttonWidth: FARM_LAYOUT.seedSelector.buttonWidth,
      buttonHeight: FARM_LAYOUT.seedSelector.buttonHeight,
      gap: FARM_LAYOUT.seedSelector.gap,
      onSeedSelected: () => {
        hudSystem.refresh();
        saveGame();
      }
    });

    devSaveControlsSystem.render({
      x: FARM_LAYOUT.devControls.x,
      y: FARM_LAYOUT.devControls.y,
      width: FARM_LAYOUT.devControls.width,
      height: FARM_LAYOUT.devControls.height,
      onResetSave: () => {
        saveSystem.clear();
        this.scene.restart();
      }
    });
  }
}
