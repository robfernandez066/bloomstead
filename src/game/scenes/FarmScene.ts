import Phaser from 'phaser';
import { SaveSystem } from '../save/SaveSystem';
import { CropSellPanelSystem } from '../ui/CropSellPanelSystem';
import { DevSaveControlsSystem } from '../ui/DevSaveControlsSystem';
import { FeedbackSystem } from '../ui/FeedbackSystem';
import { HudSystem } from '../ui/HudSystem';
import { FARM_LAYOUT } from '../ui/LayoutConfig';
import { MuteToggleSystem } from '../ui/MuteToggleSystem';
import { OrderBoardSystem } from '../ui/OrderBoardSystem';
import { ProcessedGoodsStripSystem } from '../ui/ProcessedGoodsStripSystem';
import { ProductionMenuSystem } from '../ui/ProductionMenuSystem';
import { ProductionStatusSystem } from '../ui/ProductionStatusSystem';
import { SeedSelectorSystem } from '../ui/SeedSelectorSystem';
import { TutorialPanelSystem } from '../ui/TutorialPanelSystem';
import { UpgradePanelSystem } from '../ui/UpgradePanelSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { MILL_FLOUR_RECIPE_ID } from '../data/ProductionRecipes';
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
import type { ItemId } from '../models/ItemTypes';
import type { TutorialStepId } from '../models/TutorialTypes';

type DragMode = 'none' | 'plant' | 'harvest';

const PLANT_SUPPRESSION_AFTER_HARVEST_MS = 400;

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
    let suppressPlantingUntil = 0;

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
    const processedGoodsStripSystem = new ProcessedGoodsStripSystem(this, gameStateSystem);
    let gridSystem: GridSystem;

    const getUnlockedPlotCount = (): number => {
      return plotStateSystem.getPlots().filter((plot) => plot.unlocked).length;
    };

    const getPlantedSunwheatCount = (): number => {
      return plotStateSystem
        .getPlots()
        .filter((plot) => plot.unlocked && plot.plantedCropId === 'sunwheat').length;
    };

    const refreshProductionUi = (): void => {
      productionStatusSystem.refresh();
      processedGoodsStripSystem.refresh();
      productionMenuSystem.refresh();
    };

    const refreshTutorialIfAdvanced = (advanced: boolean): void => {
      if (advanced) {
        tutorialPanelSystem.refresh();
      }
    };

    const refreshOnboardingUi = (): void => {
      tutorialPanelSystem.refresh();
      productionStatusSystem.refresh();
      processedGoodsStripSystem.refresh();
    };

    const maybeShowCraftGuidance = (): void => {
      const craftIsRelevant =
        gameStateSystem.getState().farmLevel >= 2 ||
        productionSystem.canStartRecipe(MILL_FLOUR_RECIPE_ID);

      if (!craftIsRelevant || !tutorialSystem.activateCraftGuidance()) {
        return;
      }

      refreshOnboardingUi();
      saveGame();
    };

    const syncTutorialWithReadyCrop = (): boolean => {
      const hasReadyCrop = plotStateSystem
        .getPlots()
        .some((plot) => plot.unlocked && plot.plantedCropId === 'sunwheat' && plot.ready);

      return hasReadyCrop && tutorialSystem.recordCropReady();
    };

    const syncTutorialWithExistingSunwheat = (): boolean => {
      return tutorialSystem.recordSunwheatPlantingProgress(
        getPlantedSunwheatCount(),
        getUnlockedPlotCount()
      );
    };

    const syncTutorialWithCurrentPlotState = (): boolean => {
      let advanced = false;

      const advancedFromSunwheat = syncTutorialWithExistingSunwheat();
      const advancedFromReadyCrop = syncTutorialWithReadyCrop();
      const advancedFromHarvest = tutorialSystem.syncHarvestProgress(getPlantedSunwheatCount());

      return advanced || advancedFromSunwheat || advancedFromReadyCrop || advancedFromHarvest;
    };

    const syncTutorialWithProductionState = (): boolean => {
      const millState = productionSystem.getRecipeState(MILL_FLOUR_RECIPE_ID);
      let advanced = false;
      let stepId = tutorialSystem.getCurrentStep()?.id;

      if (
        stepId === 'craft-start-mill' &&
        millState.recipeId === MILL_FLOUR_RECIPE_ID &&
        millState.status !== 'idle'
      ) {
        advanced = tutorialSystem.recordMillStarted() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (stepId === 'craft-wait-flour' && millState.status === 'ready') {
        advanced = tutorialSystem.recordMillReady() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (
        stepId === 'craft-collect-flour' &&
        gameStateSystem.getItemCount('flour') > 0 &&
        productionSystem.getClaimableQuantity(MILL_FLOUR_RECIPE_ID) === 0
      ) {
        advanced = tutorialSystem.recordFlourCollected() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (
        stepId === 'craft-start-second-mill' &&
        millState.recipeId === MILL_FLOUR_RECIPE_ID &&
        millState.status !== 'idle'
      ) {
        advanced = tutorialSystem.recordMillStarted() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (stepId === 'craft-close-menu' && !productionMenuSystem.isOpen()) {
        advanced = tutorialSystem.recordProductionMenuClosed() || advanced;
      }

      return advanced;
    };

    const handleLevelUp = (level: number): void => {
      orderSystem.refreshActiveOrdersForCurrentLevel();
      orderBoardSystem.refresh();
      seedSelectorSystem.refresh();
      audioSystem.playLevelUp();
      feedbackSystem.showLevelUp(level, width / 2, height * 0.28);
      maybeShowCraftGuidance();
    };

    const showAggregateHarvestText = (harvestResult: HarvestResult): void => {
      feedbackSystem.showAggregateHarvestFeedback(
        harvestResult.crop.id,
        harvestResult.crop.name,
        FARM_LAYOUT.farmGrid.x + FARM_LAYOUT.farmGrid.width - 96,
        FARM_LAYOUT.farmGrid.y + 42
      );
    };

    const getOrderBoardY = (): number => {
      return upgradeSystem.getNextPlotUpgrade() === null && upgradePanelSystem.isCompletionHidden()
        ? FARM_LAYOUT.plotUpgradePanel.y
        : FARM_LAYOUT.orderBoard.y;
    };

    const renderOrderBoard = (): void => {
      orderBoardSystem.render({
        x: FARM_LAYOUT.orderBoard.x,
        y: getOrderBoardY(),
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
          const tutorialAdvanced = tutorialSystem.recordOrderCompleted();
          refreshTutorialIfAdvanced(tutorialAdvanced);
          if (tutorialAdvanced) {
            upgradePanelSystem.refresh();
          }
          saveGame();
          audioSystem.playOrderComplete();
          audioSystem.playCoinGain();
          audioSystem.playXpGain();
          feedbackSystem.showOrderComplete(width / 2, getOrderBoardY() - 10);
          feedbackSystem.showOrderRewards(
            width / 2,
            getOrderBoardY() + 22,
            result.order.coinReward,
            result.order.xpReward
          );
          feedbackSystem.showOrderRewardFlyEffects(
            width / 2,
            getOrderBoardY() + 42,
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
      suppressPlantingUntil = Math.max(
        suppressPlantingUntil,
        this.time.now + PLANT_SUPPRESSION_AFTER_HARVEST_MS
      );

      const tutorialAdvanced =
        tutorialSystem.recordCropHarvested(harvestResult.crop.id) ||
        tutorialSystem.syncHarvestProgress(getPlantedSunwheatCount());

      gridSystem.refreshPlotVisuals();
      gridSystem.playHarvestEffect(harvestResult.plot);
      hudSystem.refresh();
      cropSellPanelSystem.refresh();
      orderBoardSystem.refresh();
      upgradePanelSystem.refresh();
      refreshProductionUi();
      refreshTutorialIfAdvanced(tutorialAdvanced);
      saveGame();
      maybeShowCraftGuidance();
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
      const tutorialAdvanced =
        plantResult.crop.id === 'sunwheat' &&
        tutorialSystem.recordSunwheatPlantingProgress(
          getPlantedSunwheatCount(),
          getUnlockedPlotCount()
        );

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

        if (this.time.now < suppressPlantingUntil) {
          dragMode = 'none';
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
          if (this.time.now < suppressPlantingUntil) {
            return;
          }

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
      onStart: (recipeId, quantity) => {
        const result = productionSystem.startRecipe(recipeId, quantity);

        if (result === null) {
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
        const tutorialAdvanced =
          recipeId === MILL_FLOUR_RECIPE_ID && tutorialSystem.recordMillStarted();
        refreshProductionUi();
        cropSellPanelSystem.refresh();
        orderBoardSystem.refresh();
        refreshTutorialIfAdvanced(tutorialAdvanced);
        saveGame();
        const inputItemId = Object.keys(result.recipe.input)[0] as ItemId;
        const recipeIndex = productionSystem
          .getAvailableRecipes()
          .findIndex((recipe) => recipe.id === result.recipe.id);
        const recipeRowY = FARM_LAYOUT.productionMenu.y + 86 + Math.max(0, recipeIndex) * 100;

        feedbackSystem.showProductionStarted(
          { x: FARM_LAYOUT.productionMenu.x + 68, y: recipeRowY },
          {
            x: FARM_LAYOUT.productionStatus.x + 56,
            y: FARM_LAYOUT.productionStatus.y + FARM_LAYOUT.productionStatus.height / 2
          },
          result.recipe.buildingName,
          inputItemId
        );

        if (tutorialAdvanced && tutorialSystem.getCurrentStep()?.id === 'craft-wait-flour') {
          productionMenuSystem.closeMenu();
        }
      },
      onCollect: (recipeId) => {
        const result = productionSystem.collectReadyOutput(recipeId);

        if (result === null) {
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
        audioSystem.playHarvest();
        const tutorialAdvanced =
          recipeId === MILL_FLOUR_RECIPE_ID && tutorialSystem.recordFlourCollected();
        refreshProductionUi();
        cropSellPanelSystem.refresh();
        orderBoardSystem.refresh();
        refreshTutorialIfAdvanced(tutorialAdvanced);
        saveGame();
        const recipeIndex = productionSystem
          .getAvailableRecipes()
          .findIndex((recipe) => recipe.id === result.recipe.id);
        const recipeRowY = FARM_LAYOUT.productionMenu.y + 86 + Math.max(0, recipeIndex) * 100;

        feedbackSystem.showProductionCollected(
          { x: FARM_LAYOUT.productionMenu.x + FARM_LAYOUT.productionMenu.width - 62, y: recipeRowY },
          {
            x: FARM_LAYOUT.productionStatus.x + FARM_LAYOUT.productionStatus.width - 90,
            y: FARM_LAYOUT.productionStatus.y + FARM_LAYOUT.productionStatus.height / 2
          },
          result.recipe.outputItemId,
          result.outputName,
          result.outputAmount
        );
      },
      onClose: () => {
        audioSystem.playButtonTap();
        refreshTutorialIfAdvanced(tutorialSystem.recordProductionMenuClosed());
        saveGame();
      },
      shouldHighlightAction: (recipeId, action) => {
        if (recipeId !== MILL_FLOUR_RECIPE_ID) {
          return false;
        }

        const stepId = tutorialSystem.getCurrentStep()?.id;

        return (
          (action === 'start' &&
            (stepId === 'craft-start-mill' || stepId === 'craft-start-second-mill')) ||
          (action === 'collect' && stepId === 'craft-collect-flour')
        );
      },
      getForcedBatchQuantity: (recipeId) => {
        if (recipeId !== MILL_FLOUR_RECIPE_ID || tutorialSystem.getState().completed) {
          return null;
        }

        return 1;
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
      highlightButton: () => tutorialSystem.shouldHighlightCraftButton(),
      highlightRecipeChip: (recipeId) =>
        recipeId === MILL_FLOUR_RECIPE_ID && tutorialSystem.shouldHighlightMillReady(),
      onOpen: () => {
        audioSystem.playButtonTap();
        productionMenuSystem.openMenu();
        if (tutorialSystem.recordCraftOpened()) {
          refreshOnboardingUi();
          saveGame();
        }
      }
    });

    processedGoodsStripSystem.render({
      x: FARM_LAYOUT.productionStatus.x,
      y: FARM_LAYOUT.productionStatus.y,
      width: FARM_LAYOUT.productionStatus.width,
      height: FARM_LAYOUT.productionStatus.height,
      isVisible: () => {
        const { farmLevel, processedGoodInventory } = gameStateSystem.getState();

        return (
          processedGoodInventory.flour > 0 ||
          processedGoodInventory.bread > 0 ||
          farmLevel >= 2 ||
          tutorialSystem.getState().completed
        );
      },
      getActiveProductionChipCount: () => productionSystem.getActiveRecipes().length
    });

    upgradePanelSystem.render({
      x: FARM_LAYOUT.plotUpgradePanel.x,
      y: FARM_LAYOUT.plotUpgradePanel.y,
      width: FARM_LAYOUT.plotUpgradePanel.width,
      height: FARM_LAYOUT.plotUpgradePanel.height,
      onCompletionHidden: renderOrderBoard,
      isLocked: () => !tutorialSystem.canPurchasePlotUpgrade(),
      isHighlighted: () => tutorialSystem.getCurrentStep()?.id === 'upgrade-plots',
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

    renderOrderBoard();

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
        const productionReadyRecipes = productionSystem.refreshProductionState();
        gridSystem.refreshPlotVisuals();

        if (productionSystem.hasProducingJobs() || productionReadyRecipes.length > 0) {
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

        if (productionReadyRecipes.length > 0) {
          let tutorialAdvanced = false;

          for (const recipe of productionReadyRecipes) {
            audioSystem.playCropReady();
            feedbackSystem.showProductionReady(
              width / 2,
              FARM_LAYOUT.productionStatus.y - 8,
              recipe.outputItemId
            );

            if (recipe.id === MILL_FLOUR_RECIPE_ID) {
              tutorialAdvanced = tutorialSystem.recordMillReady() || tutorialAdvanced;
            }
          }
          refreshTutorialIfAdvanced(tutorialAdvanced);
          refreshProductionUi();
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

    const getTutorialPanelBounds = (stepId: TutorialStepId) => {
      const base = FARM_LAYOUT.tutorialPanel;

      switch (stepId) {
        case 'welcome':
        case 'select-sunwheat':
        case 'wait-for-crop':
        case 'harvest':
          return { ...base, y: 396, height: 66 };
        case 'upgrade-plots':
          return { ...base, y: 334, height: 62 };
        case 'sell-crop':
          return { ...base, y: 168, height: 62 };
        case 'complete-order':
          return { ...base, y: 650, height: 66 };
        case 'craft-open':
          return { ...base, y: 286, height: 66 };
        case 'craft-start-mill':
        case 'craft-wait-flour':
        case 'craft-open-ready':
        case 'craft-collect-flour':
        case 'craft-start-second-mill':
          return { ...base, y: 492, height: 66 };
        case 'craft-close-menu':
          return { ...base, y: 590, height: 58 };
        default:
          return base;
      }
    };

    const getMillActionButtonBounds = () => ({
      x: FARM_LAYOUT.productionMenu.x + FARM_LAYOUT.productionMenu.width - 104,
      y: FARM_LAYOUT.productionMenu.y + 52 + 86 - 30 - 8,
      width: 82,
      height: 30
    });

    const getTutorialTargetBounds = (stepId: TutorialStepId) => {
      switch (stepId) {
        case 'welcome':
        case 'select-sunwheat':
        case 'wait-for-crop':
        case 'harvest':
          return gridSystem.getVisiblePlotScreenBounds();
        case 'complete-order':
          return {
            x: FARM_LAYOUT.orderBoard.x + 10,
            y: FARM_LAYOUT.orderBoard.y + 30,
            width: FARM_LAYOUT.orderBoard.width - 20,
            height: FARM_LAYOUT.orderBoard.orderHeight
          };
        case 'upgrade-plots':
          return FARM_LAYOUT.plotUpgradePanel;
        case 'sell-crop':
          return {
            x: FARM_LAYOUT.cropSellPanel.x,
            y: FARM_LAYOUT.cropSellPanel.y,
            width:
              FARM_LAYOUT.cropSellPanel.buttonWidth * 3 +
              FARM_LAYOUT.cropSellPanel.gap * 2,
            height: FARM_LAYOUT.cropSellPanel.buttonHeight
          };
        case 'craft-open':
          return FARM_LAYOUT.productionButton;
        case 'craft-start-mill':
        case 'craft-collect-flour':
        case 'craft-start-second-mill':
          return productionMenuSystem.isOpen()
            ? getMillActionButtonBounds()
            : FARM_LAYOUT.productionButton;
        case 'craft-open-ready':
          return {
            x: FARM_LAYOUT.productionStatus.x,
            y: FARM_LAYOUT.productionStatus.y,
            width: 108,
            height: FARM_LAYOUT.productionStatus.height
          };
        case 'craft-close-menu':
          return {
            x: 18,
            y: FARM_LAYOUT.productionMenu.y + FARM_LAYOUT.productionMenu.height + 8,
            width: 76,
            height: 48
          };
        case 'craft-wait-flour':
          return null;
        default:
          return null;
      }
    };

    const shouldUseTutorialArrow = (stepId: TutorialStepId) => {
      return stepId === 'craft-close-menu';
    };

    tutorialPanelSystem.render({
      x: FARM_LAYOUT.tutorialPanel.x,
      y: FARM_LAYOUT.tutorialPanel.y,
      width: FARM_LAYOUT.tutorialPanel.width,
      height: FARM_LAYOUT.tutorialPanel.height,
      getPanelBounds: getTutorialPanelBounds,
      getTargetBounds: getTutorialTargetBounds,
      shouldUseArrow: shouldUseTutorialArrow,
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
          const completionPanel = getTutorialPanelBounds('complete');
          feedbackSystem.showTutorialCompletionReward(
            completionPanel.x + completionPanel.width - 52,
            completionPanel.y + completionPanel.height / 2,
            FARM_LAYOUT.hud.x + 58,
            FARM_LAYOUT.hud.y + 20,
            result.coinReward
          );
          maybeShowCraftGuidance();
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

    if (syncTutorialWithCurrentPlotState() || syncTutorialWithProductionState()) {
      tutorialPanelSystem.refresh();
      refreshProductionUi();
      saveGame();
    }

    maybeShowCraftGuidance();

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
