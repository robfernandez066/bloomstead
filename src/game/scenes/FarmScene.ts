import Phaser from 'phaser';
import { SaveSystem } from '../save/SaveSystem';
import { CropSellPanelSystem } from '../ui/CropSellPanelSystem';
import { DevSaveControlsSystem } from '../ui/DevSaveControlsSystem';
import { FeedbackSystem } from '../ui/FeedbackSystem';
import { HudSystem } from '../ui/HudSystem';
import { FARM_LAYOUT } from '../ui/LayoutConfig';
import { OrderBoardSystem } from '../ui/OrderBoardSystem';
import { SeedSelectorSystem } from '../ui/SeedSelectorSystem';
import { TutorialPanelSystem } from '../ui/TutorialPanelSystem';
import { UpgradePanelSystem } from '../ui/UpgradePanelSystem';
import { CropSellingSystem } from '../systems/CropSellingSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { GridSystem } from '../systems/GridSystem';
import { HarvestingSystem, type HarvestResult } from '../systems/HarvestingSystem';
import { OrderSystem } from '../systems/OrderSystem';
import { PlantingSystem, type PlantResult } from '../systems/PlantingSystem';
import { PlotStateSystem } from '../systems/PlotStateSystem';
import { TutorialSystem } from '../systems/TutorialSystem';
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
    const saveLoadResult = saveSystem.load();
    const savedGameData = saveLoadResult?.data;
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
    const cropSellingSystem = new CropSellingSystem(gameStateSystem);
    const tutorialSystem = new TutorialSystem(savedGameData?.tutorialState);
    const feedbackSystem = new FeedbackSystem(this);
    let dragMode: DragMode = 'none';

    const saveGame = (): void => {
      saveSystem.save(
        gameStateSystem,
        plotStateSystem,
        upgradeSystem,
        orderSystem,
        tutorialSystem
      );
    };

    const hudSystem = new HudSystem(this, gameStateSystem);
    const cropSellPanelSystem = new CropSellPanelSystem(
      this,
      gameStateSystem,
      cropSellingSystem
    );
    const seedSelectorSystem = new SeedSelectorSystem(this, gameStateSystem);
    const orderBoardSystem = new OrderBoardSystem(this, orderSystem);
    const upgradePanelSystem = new UpgradePanelSystem(this, upgradeSystem);
    const tutorialPanelSystem = new TutorialPanelSystem(this, tutorialSystem);
    const devSaveControlsSystem = new DevSaveControlsSystem(this);
    let gridSystem: GridSystem;

    const refreshTutorialIfAdvanced = (advanced: boolean): void => {
      if (advanced) {
        tutorialPanelSystem.refresh();
      }
    };

    const syncTutorialWithLoadedReadyCrop = (): boolean => {
      const hasReadyCrop = plotStateSystem
        .getPlots()
        .some((plot) => plot.unlocked && plot.plantedCropId !== null && plot.ready);

      return hasReadyCrop && tutorialSystem.recordCropReady();
    };

    const handleLevelUp = (level: number): void => {
      orderSystem.refreshActiveOrdersForCurrentLevel();
      orderBoardSystem.refresh();
      seedSelectorSystem.refresh();
      feedbackSystem.showLevelUp(level, width / 2, height * 0.28);
    };

    const handleHarvestResult = (harvestResult: HarvestResult): void => {
      const tutorialAdvanced = tutorialSystem.recordCropHarvested();

      gridSystem.refreshPlotVisuals();
      gridSystem.playHarvestEffect(harvestResult.plot);
      hudSystem.refresh();
      cropSellPanelSystem.refresh();
      orderBoardSystem.refresh();
      upgradePanelSystem.refresh();
      refreshTutorialIfAdvanced(tutorialAdvanced);
      saveGame();
      feedbackSystem.showHarvestFeedback(
        gridSystem.getPlotScreenPosition(harvestResult.plot),
        harvestResult.crop.name
      );

      if (harvestResult.xpResult.leveledUp) {
        handleLevelUp(harvestResult.xpResult.currentLevel);
      }
    };

    const handlePlantResult = (plantResult: PlantResult): void => {
      const tutorialAdvanced = tutorialSystem.recordCropPlanted(plantResult.crop.id);

      gridSystem.refreshPlotVisuals();
      gridSystem.playPlantEffect(plantResult.plot);
      hudSystem.refresh();
      upgradePanelSystem.refresh();
      refreshTutorialIfAdvanced(tutorialAdvanced);
      saveGame();
      feedbackSystem.showPlantingFeedback(
        gridSystem.getPlotScreenPosition(plantResult.plot),
        plantResult.seedCost
      );
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

        const plantResult = plantingSystem.beginPaint(plot);

        if (plantResult !== null) {
          dragMode = 'plant';
          handlePlantResult(plantResult);
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

        if (dragMode === 'plant') {
          const plantResult = plantingSystem.paintOver(plot);

          if (plantResult !== null) {
            handlePlantResult(plantResult);
          }
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

    cropSellPanelSystem.render({
      x: FARM_LAYOUT.cropSellPanel.x,
      y: FARM_LAYOUT.cropSellPanel.y,
      buttonWidth: FARM_LAYOUT.cropSellPanel.buttonWidth,
      buttonHeight: FARM_LAYOUT.cropSellPanel.buttonHeight,
      gap: FARM_LAYOUT.cropSellPanel.gap,
      onSellCrop: (crop) => {
        const result = cropSellingSystem.sellCrop(crop.id);

        if (result === null) {
          return;
        }

        hudSystem.refresh();
        cropSellPanelSystem.refresh();
        orderBoardSystem.refresh();
        upgradePanelSystem.refresh();
        refreshTutorialIfAdvanced(tutorialSystem.recordCropSold());
        saveGame();
        feedbackSystem.showCropSold(
          width / 2,
          FARM_LAYOUT.hud.y + FARM_LAYOUT.hud.height - 8,
          result.crop.name,
          result.coinValue
        );
      }
    });

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
        for (const plot of result.plots) {
          gridSystem.playPlotUnlockEffect(plot);
        }
        hudSystem.refresh();
        upgradePanelSystem.refresh();
        refreshTutorialIfAdvanced(
          tutorialSystem.recordFirstPlotUpgradePurchased(
            upgradeSystem.getPurchasedPlotUpgradeCount()
          )
        );
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
        cropSellPanelSystem.refresh();
        orderBoardSystem.refresh();
        upgradePanelSystem.refresh();
        refreshTutorialIfAdvanced(tutorialSystem.recordOrderCompleted());
        saveGame();
        feedbackSystem.showOrderComplete(width / 2, FARM_LAYOUT.orderBoard.y - 10);
        feedbackSystem.showOrderRewards(
          width / 2,
          FARM_LAYOUT.orderBoard.y + 22,
          result.order.coinReward,
          result.order.xpReward
        );

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
        const previouslyGrowingPlots = plotStateSystem
          .getPlots()
          .filter((plot) => plot.plantedCropId !== null && !plot.ready);
        const readyStatesChanged = plotStateSystem.refreshReadyStates();
        gridSystem.refreshPlotVisuals();

        if (readyStatesChanged) {
          let tutorialAdvanced = false;

          for (const plot of previouslyGrowingPlots) {
            if (plot.ready) {
              gridSystem.playReadyEffect(plot);
              tutorialAdvanced = tutorialSystem.recordCropReady() || tutorialAdvanced;
            }
          }

          refreshTutorialIfAdvanced(tutorialAdvanced);
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

    tutorialPanelSystem.render({
      x: FARM_LAYOUT.tutorialPanel.x,
      y: FARM_LAYOUT.tutorialPanel.y,
      width: FARM_LAYOUT.tutorialPanel.width,
      height: FARM_LAYOUT.tutorialPanel.height,
      onAcknowledge: () => {
        if (tutorialSystem.getCurrentStep()?.id === 'complete') {
          const result = tutorialSystem.completeTutorial();

          if (result === null) {
            return;
          }

          gameStateSystem.addCoins(result.coinReward);
          hudSystem.refresh();
          upgradePanelSystem.refresh();
          tutorialPanelSystem.refresh();
          saveGame();
          return;
        }

        if (tutorialSystem.acknowledgeCurrentStep()) {
          tutorialPanelSystem.refresh();
          saveGame();
        }
      }
    });

    if (syncTutorialWithLoadedReadyCrop()) {
      tutorialPanelSystem.refresh();
      saveGame();
    }

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

    if (saveLoadResult !== null && saveLoadResult.cropsFinishedWhileAway > 0) {
      feedbackSystem.showOfflineSummary(
        saveLoadResult.cropsFinishedWhileAway,
        width / 2,
        FARM_LAYOUT.farmGrid.y + 24
      );
      saveGame();
    }
  }
}
