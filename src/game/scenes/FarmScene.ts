import Phaser from 'phaser';
import { MILL_FLOUR_RECIPE_ID } from '../data/ProductionRecipes';
import { SaveSystem } from '../save/SaveSystem';
import { CropSellPanelSystem } from '../ui/CropSellPanelSystem';
import { DevSaveControlsSystem } from '../ui/DevSaveControlsSystem';
import { FeedbackSystem } from '../ui/FeedbackSystem';
import { HudSystem } from '../ui/HudSystem';
import { FARM_LAYOUT } from '../ui/LayoutConfig';
import { MuteToggleSystem } from '../ui/MuteToggleSystem';
import { OrderBoardSystem } from '../ui/OrderBoardSystem';
import { ProductionMenuSystem } from '../ui/ProductionMenuSystem';
import { ProductionStatusSystem } from '../ui/ProductionStatusSystem';
import { SeedSelectorSystem } from '../ui/SeedSelectorSystem';
import { TutorialPanelSystem } from '../ui/TutorialPanelSystem';
import { UpgradePanelSystem } from '../ui/UpgradePanelSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { CropSellingSystem } from '../systems/CropSellingSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { GridSystem } from '../systems/GridSystem';
import { HarvestingSystem, type HarvestResult } from '../systems/HarvestingSystem';
import { OrderSystem } from '../systems/OrderSystem';
import { PlantingSystem, type PlantResult } from '../systems/PlantingSystem';
import { PlotStateSystem } from '../systems/PlotStateSystem';
import { ProductionSystem } from '../systems/ProductionSystem';
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
    const audioSystem = new AudioSystem(this, savedGameData?.audioState);
    const productionSystem = new ProductionSystem(gameStateSystem, savedGameData?.productionState);
    const feedbackSystem = new FeedbackSystem(this);
    let dragMode: DragMode = 'none';
    let pendingTapHarvest: HarvestResult | null = null;
    let pendingTapHarvestPosition: Phaser.Math.Vector2 | null = null;

    const saveGame = (): void => {
      saveSystem.save(
        gameStateSystem,
        plotStateSystem,
        upgradeSystem,
        orderSystem,
        tutorialSystem,
        audioSystem,
        productionSystem
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
    const muteToggleSystem = new MuteToggleSystem(this, audioSystem);
    const productionMenuSystem = new ProductionMenuSystem(this, productionSystem);
    const productionStatusSystem = new ProductionStatusSystem(this, productionSystem);
    let gridSystem: GridSystem;

    const refreshProductionUi = (): void => {
      productionStatusSystem.refresh();
      productionMenuSystem.refresh();
    };

    const refreshTutorialIfAdvanced = (advanced: boolean): void => {
      if (advanced) {
        tutorialPanelSystem.refresh();
      }
    };

    const syncTutorialWithReadyCrop = (): boolean => {
      const hasReadyCrop = plotStateSystem
        .getPlots()
        .some((plot) => plot.unlocked && plot.plantedCropId !== null && plot.ready);

      return hasReadyCrop && tutorialSystem.recordCropReady();
    };

    const syncTutorialWithExistingSunwheat = (): boolean => {
      const hasPlantedSunwheat = plotStateSystem
        .getPlots()
        .some((plot) => plot.unlocked && plot.plantedCropId === 'sunwheat');

      return hasPlantedSunwheat && tutorialSystem.recordCropPlanted('sunwheat');
    };

    const syncTutorialWithCurrentPlotState = (): boolean => {
      const advancedFromSunwheat = syncTutorialWithExistingSunwheat();
      const advancedFromReadyCrop = syncTutorialWithReadyCrop();

      return advancedFromSunwheat || advancedFromReadyCrop;
    };

    const handleLevelUp = (level: number): void => {
      orderSystem.refreshActiveOrdersForCurrentLevel();
      orderBoardSystem.refresh();
      seedSelectorSystem.refresh();
      audioSystem.playLevelUp();
      feedbackSystem.showLevelUp(level, width / 2, height * 0.28);
    };

    const showAggregateHarvestText = (harvestResult: HarvestResult): void => {
      feedbackSystem.showAggregateHarvestFeedback(
        harvestResult.crop.id,
        harvestResult.crop.name,
        FARM_LAYOUT.farmGrid.x + FARM_LAYOUT.farmGrid.width - 96,
        FARM_LAYOUT.farmGrid.y + 42
      );
    };

    const flushPendingTapHarvestText = (): void => {
      if (pendingTapHarvest !== null && pendingTapHarvestPosition !== null) {
        feedbackSystem.showHarvestText(
          pendingTapHarvestPosition,
          pendingTapHarvest.crop.name
        );
      }

      pendingTapHarvest = null;
      pendingTapHarvestPosition = null;
    };

    const movePendingTapHarvestToAggregate = (): void => {
      if (pendingTapHarvest !== null) {
        showAggregateHarvestText(pendingTapHarvest);
      }

      pendingTapHarvest = null;
      pendingTapHarvestPosition = null;
    };

    const handleHarvestResult = (
      harvestResult: HarvestResult,
      textMode: 'defer-single' | 'aggregate'
    ): void => {
      const tutorialAdvanced = tutorialSystem.recordCropHarvested();

      gridSystem.refreshPlotVisuals();
      gridSystem.playHarvestEffect(harvestResult.plot);
      hudSystem.refresh();
      cropSellPanelSystem.refresh();
      orderBoardSystem.refresh();
      upgradePanelSystem.refresh();
      refreshProductionUi();
      refreshTutorialIfAdvanced(tutorialAdvanced);
      saveGame();
      const harvestPosition = gridSystem.getPlotScreenPosition(harvestResult.plot);

      feedbackSystem.showHarvestFeedback(harvestPosition, harvestResult.crop.name, false);
      feedbackSystem.showHarvestToInventory(
        harvestPosition,
        cropSellPanelSystem.getCropTargetPosition(harvestResult.crop.id),
        harvestResult.crop.id
      );
      audioSystem.playHarvest();
      audioSystem.playXpGain();

      if (textMode === 'defer-single') {
        pendingTapHarvest = harvestResult;
        pendingTapHarvestPosition = harvestPosition;
      } else {
        movePendingTapHarvestToAggregate();
        showAggregateHarvestText(harvestResult);
      }

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
      audioSystem.playPlantSeed();
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
          handleHarvestResult(harvestResult, 'defer-single');
          return;
        }

        const plantResult = plantingSystem.beginPaint(plot);

        if (plantResult !== null) {
          dragMode = 'plant';
          handlePlantResult(plantResult);
          return;
        }

        audioSystem.playDisabledTap();
        dragMode = 'none';
      },
      onPlotDraggedOver: (plot) => {
        if (dragMode === 'harvest') {
          const harvestResult = harvestingSystem.harvestOver(plot);

          if (harvestResult !== null) {
            handleHarvestResult(harvestResult, 'aggregate');
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
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
        hudSystem.refresh();
        cropSellPanelSystem.refresh();
        orderBoardSystem.refresh();
        upgradePanelSystem.refresh();
        refreshProductionUi();
        refreshTutorialIfAdvanced(tutorialSystem.recordCropSold());
        saveGame();
        audioSystem.playSellCrop();
        audioSystem.playCoinGain();
        feedbackSystem.showCropSold(
          width / 2,
          FARM_LAYOUT.hud.y + FARM_LAYOUT.hud.height - 8,
          result.crop.name,
          result.coinValue
        );
      }
    });

    productionMenuSystem.render({
      x: FARM_LAYOUT.productionMenu.x,
      y: FARM_LAYOUT.productionMenu.y,
      width: FARM_LAYOUT.productionMenu.width,
      height: FARM_LAYOUT.productionMenu.height,
      onStart: () => {
        const result = productionSystem.startRecipe(MILL_FLOUR_RECIPE_ID);

        if (result === null) {
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
        refreshProductionUi();
        cropSellPanelSystem.refresh();
        orderBoardSystem.refresh();
        saveGame();
        feedbackSystem.showProductionStarted(width / 2, FARM_LAYOUT.productionStatus.y - 8);
      },
      onCollect: () => {
        const result = productionSystem.collectReadyOutput();

        if (result === null) {
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
        audioSystem.playHarvest();
        refreshProductionUi();
        cropSellPanelSystem.refresh();
        orderBoardSystem.refresh();
        saveGame();
        feedbackSystem.showProductionCollected(
          width / 2,
          FARM_LAYOUT.productionStatus.y - 8,
          result.outputName,
          result.outputAmount
        );
      },
      onClose: () => {
        audioSystem.playButtonTap();
      }
    });

    productionStatusSystem.render({
      buttonX: FARM_LAYOUT.productionButton.x,
      buttonY: FARM_LAYOUT.productionButton.y,
      buttonWidth: FARM_LAYOUT.productionButton.width,
      buttonHeight: FARM_LAYOUT.productionButton.height,
      statusX: FARM_LAYOUT.productionStatus.x,
      statusY: FARM_LAYOUT.productionStatus.y,
      statusWidth: FARM_LAYOUT.productionStatus.width,
      statusHeight: FARM_LAYOUT.productionStatus.height,
      onOpen: () => {
        audioSystem.playButtonTap();
        productionMenuSystem.openMenu();
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
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
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
        audioSystem.playPlotUnlock();
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
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
        hudSystem.refresh();
        cropSellPanelSystem.refresh();
        orderBoardSystem.refresh();
        upgradePanelSystem.refresh();
        refreshProductionUi();
        refreshTutorialIfAdvanced(tutorialSystem.recordOrderCompleted());
        saveGame();
        audioSystem.playOrderComplete();
        audioSystem.playCoinGain();
        audioSystem.playXpGain();
        feedbackSystem.showOrderComplete(width / 2, FARM_LAYOUT.orderBoard.y - 10);
        feedbackSystem.showOrderRewards(
          width / 2,
          FARM_LAYOUT.orderBoard.y + 22,
          result.order.coinReward,
          result.order.xpReward
        );
        feedbackSystem.showOrderRewardFlyEffects(
          width / 2,
          FARM_LAYOUT.orderBoard.y + 42,
          FARM_LAYOUT.hud.x + 58,
          FARM_LAYOUT.hud.y + 20,
          FARM_LAYOUT.hud.x + 48,
          FARM_LAYOUT.hud.y + 58
        );
        hudSystem.playCoinsPulse();
        hudSystem.playXpPulse();

        if (result.xpResult.leveledUp) {
          handleLevelUp(result.xpResult.currentLevel);
        }
      }
    });

    this.input.on('pointerup', () => {
      flushPendingTapHarvestText();
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
        const productionBecameReady = productionSystem.refreshProductionState();
        gridSystem.refreshPlotVisuals();

        if (productionSystem.getState().status === 'producing' || productionBecameReady) {
          refreshProductionUi();
        }

        if (readyStatesChanged) {
          let tutorialAdvanced = false;

          for (const plot of previouslyGrowingPlots) {
            if (plot.ready) {
              gridSystem.playReadyEffect(plot);
              audioSystem.playCropReady();
              tutorialAdvanced = tutorialSystem.recordCropReady() || tutorialAdvanced;
            }
          }

          refreshTutorialIfAdvanced(tutorialAdvanced);
          saveGame();
        }

        if (productionBecameReady) {
          audioSystem.playCropReady();
          feedbackSystem.showProductionReady(width / 2, FARM_LAYOUT.productionStatus.y - 8);
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
        audioSystem.playButtonTap();
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
            audioSystem.playDisabledTap();
            return;
          }

          audioSystem.playButtonTap();
          gameStateSystem.addCoins(result.coinReward);
          hudSystem.refresh();
          hudSystem.playCoinsPulse();
          upgradePanelSystem.refresh();
          tutorialPanelSystem.refresh();
          saveGame();
          audioSystem.playTutorialComplete();
          audioSystem.playCoinGain();
          feedbackSystem.showTutorialCompletionReward(
            FARM_LAYOUT.tutorialPanel.x + FARM_LAYOUT.tutorialPanel.width - 52,
            FARM_LAYOUT.tutorialPanel.y + FARM_LAYOUT.tutorialPanel.height / 2,
            FARM_LAYOUT.hud.x + 58,
            FARM_LAYOUT.hud.y + 20,
            result.coinReward
          );
          return;
        }

        if (tutorialSystem.acknowledgeCurrentStep()) {
          audioSystem.playButtonTap();
          const advancedFromPlotState = syncTutorialWithCurrentPlotState();

          tutorialPanelSystem.refresh();
          saveGame();

          if (advancedFromPlotState) {
            tutorialPanelSystem.refresh();
          }
        }
      }
    });

    muteToggleSystem.render({
      x: FARM_LAYOUT.muteToggle.x,
      y: FARM_LAYOUT.muteToggle.y,
      width: FARM_LAYOUT.muteToggle.width,
      height: FARM_LAYOUT.muteToggle.height,
      onToggle: () => {
        saveGame();
      }
    });

    if (syncTutorialWithCurrentPlotState()) {
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
