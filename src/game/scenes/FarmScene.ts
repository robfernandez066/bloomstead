import Phaser from 'phaser';
import { SaveSystem } from '../save/SaveSystem';
import { BagSystem } from '../ui/BagSystem';
import { CommunityBoardSystem } from '../ui/CommunityBoardSystem';
import { FeedbackSystem } from '../ui/FeedbackSystem';
import { HudSystem } from '../ui/HudSystem';
import { FARM_LAYOUT } from '../ui/LayoutConfig';
import { MuteToggleSystem } from '../ui/MuteToggleSystem';
import { OrderBoardSystem } from '../ui/OrderBoardSystem';
import { ProductionLandmarkSystem } from '../ui/ProductionLandmarkSystem';
import { ProductionMenuSystem } from '../ui/ProductionMenuSystem';
import { ProductionStatusSystem } from '../ui/ProductionStatusSystem';
import { SeedSelectorSystem } from '../ui/SeedSelectorSystem';
import { TutorialPanelSystem } from '../ui/TutorialPanelSystem';
import { UpgradePanelSystem } from '../ui/UpgradePanelSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { AUDIO_KEYS, DEFERRED_AUDIO_ASSETS } from '../data/AudioConfig';
import { getLevelUnlockSummary } from '../data/LevelProgression';
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
import type { ProductionRecipeId } from '../models/ProductionTypes';
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
    let lastPaintPointerPosition: Phaser.Math.Vector2 | null = null;
    let activeGesturePointerId: number | null = null;
    let suppressPlantingUntil = 0;
    let plotInputLocked = false;

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
    const bagSystem = new BagSystem(this, gameStateSystem, cropSellingSystem);
    const seedSelectorSystem = new SeedSelectorSystem(this, gameStateSystem);
    const orderBoardSystem = new OrderBoardSystem(this, orderSystem);
    const communityBoardSystem = new CommunityBoardSystem(this);
    const upgradePanelSystem = new UpgradePanelSystem(this, upgradeSystem);
    const tutorialPanelSystem = new TutorialPanelSystem(this, tutorialSystem);
    const muteToggleSystem = new MuteToggleSystem(this, audioSystem);
    const productionMenuSystem = new ProductionMenuSystem(this, productionSystem);
    const productionStatusSystem = new ProductionStatusSystem(this, productionSystem);
    const productionLandmarkSystem = new ProductionLandmarkSystem(this, productionSystem);
    const postTutorialGoalObjects: Phaser.GameObjects.GameObject[] = [];
    let gridSystem: GridSystem;

    const clearPostTutorialGoal = (): void => {
      for (const object of postTutorialGoalObjects) {
        object.destroy();
      }

      postTutorialGoalObjects.length = 0;
    };

    const getPostTutorialGoalText = (): string => {
      const { farmLevel } = gameStateSystem.getState();

      if (farmLevel < 2) {
        return 'Next unlock: Level 2 - Carrot and Mill.';
      }

      if (farmLevel === 2) {
        return 'Next unlock: Level 3 - Glowberry and Bakery.';
      }

      if (farmLevel === 3) {
        return 'Next unlock: Level 4 - More advanced orders.';
      }

      if (farmLevel === 4) {
        return 'Next unlock: Level 5 - Village Feast order.';
      }

      return 'Next goal: Optimize crops, production, and village orders.';
    };

    const refreshPostTutorialGoal = (): void => {
      clearPostTutorialGoal();

      if (!tutorialSystem.getState().completed || tutorialSystem.getCurrentStep() !== null) {
        return;
      }

      const bounds = FARM_LAYOUT.tutorialPanel;
      const panel = this.add
        .rectangle(bounds.x, bounds.y, bounds.width, bounds.height, 0xf7edc7)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x6f5734)
        .setDepth(30);
      const label = this.add
        .text(bounds.x + 10, bounds.y + 8, getPostTutorialGoalText(), {
          color: '#2f3b26',
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          lineSpacing: 2,
          wordWrap: { width: bounds.width - 20 }
        })
        .setDepth(31)
        .setResolution(2);

      postTutorialGoalObjects.push(panel, label);
    };

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
      productionMenuSystem.refresh();
      productionLandmarkSystem.refresh();
      bagSystem.refresh();
    };

    const refreshOrderUi = (): void => {
      orderBoardSystem.refresh();
      communityBoardSystem.refresh();
    };

    const refreshTutorialIfAdvanced = (advanced: boolean): void => {
      if (advanced) {
        tutorialPanelSystem.refresh();
        refreshPostTutorialGoal();
      }
    };

    const refreshOnboardingUi = (): void => {
      tutorialPanelSystem.refresh();
      productionStatusSystem.refresh();
      productionLandmarkSystem.refresh();
      bagSystem.refresh();
      refreshPostTutorialGoal();
    };

    const openProductionForRecipe = (recipeId: ProductionRecipeId): void => {
      if (!productionSystem.isRecipeAccessible(recipeId)) {
        audioSystem.playDisabledTap();
        return;
      }

      orderBoardSystem.closeWindow(false);
      bagSystem.closeWindow(false);
      tutorialPanelSystem.refresh();
      communityBoardSystem.refresh();
      audioSystem.playButtonTap();
      productionMenuSystem.openMenu(recipeId);

      if (
        recipeId === MILL_FLOUR_RECIPE_ID &&
        tutorialSystem.recordCraftOpened()
      ) {
        refreshOnboardingUi();
        saveGame();
      }
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

    const syncTutorialWithOrderState = (): boolean => {
      const stepId = tutorialSystem.getCurrentStep()?.id;

      if (stepId !== 'complete-order') {
        return false;
      }

      const sunwheatSackIsActive = orderSystem
        .getActiveOrders()
        .some((order) => order.id === 'sunwheat-sack');

      return !sunwheatSackIsActive && tutorialSystem.recordOrderCompleted();
    };

    const syncTutorialWithUpgradeState = (): boolean => {
      return tutorialSystem.recordFirstPlotUpgradePurchased(
        upgradeSystem.getPurchasedPlotUpgradeCount()
      );
    };

    const syncTutorialWithProductionState = (): boolean => {
      let advanced = false;
      let stepId = tutorialSystem.getCurrentStep()?.id;
      const getMillState = () => productionSystem.getRecipeState(MILL_FLOUR_RECIPE_ID);
      const hasActiveMillJob = () => {
        const millState = getMillState();

        return millState.recipeId === MILL_FLOUR_RECIPE_ID && millState.status !== 'idle';
      };

      if (
        stepId === 'craft-open' &&
        (hasActiveMillJob() || gameStateSystem.getItemCount('flour') > 0)
      ) {
        advanced = tutorialSystem.recordCraftOpened() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (
        stepId === 'craft-start-mill' &&
        hasActiveMillJob()
      ) {
        advanced = tutorialSystem.recordMillStarted() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      const claimableMillQuantity = productionSystem.getClaimableQuantity(MILL_FLOUR_RECIPE_ID);
      const flourCount = gameStateSystem.getItemCount('flour');

      if (
        (stepId === 'craft-start-mill' ||
          stepId === 'craft-wait-flour' ||
          stepId === 'craft-open-ready' ||
          stepId === 'craft-collect-flour') &&
        flourCount > 0 &&
        claimableMillQuantity === 0
      ) {
        advanced = tutorialSystem.recordMillStarted() || advanced;
        advanced = tutorialSystem.recordMillReady() || advanced;
        advanced = tutorialSystem.recordCraftOpened() || advanced;
        advanced = tutorialSystem.recordFlourCollected() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (stepId === 'craft-wait-flour' && getMillState().status === 'ready') {
        advanced = tutorialSystem.recordMillReady() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (
        stepId === 'craft-collect-flour' &&
        flourCount > 0 &&
        productionSystem.getClaimableQuantity(MILL_FLOUR_RECIPE_ID) === 0
      ) {
        advanced = tutorialSystem.recordFlourCollected() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (
        stepId === 'craft-start-second-mill' &&
        hasActiveMillJob()
      ) {
        advanced = tutorialSystem.recordMillStarted() || advanced;
        stepId = tutorialSystem.getCurrentStep()?.id;
      }

      if (stepId === 'craft-close-menu' && !productionMenuSystem.isOpen()) {
        advanced = tutorialSystem.recordProductionMenuClosed() || advanced;
      }

      return advanced;
    };

    const syncTutorialWithSavedGameState = (): boolean => {
      let advanced = false;

      for (let index = 0; index < 4; index += 1) {
        let advancedThisPass = false;

        advancedThisPass = syncTutorialWithCurrentPlotState() || advancedThisPass;
        advancedThisPass = syncTutorialWithOrderState() || advancedThisPass;
        advancedThisPass = syncTutorialWithUpgradeState() || advancedThisPass;
        advancedThisPass = syncTutorialWithProductionState() || advancedThisPass;
        advanced = advancedThisPass || advanced;

        if (!advancedThisPass) {
          break;
        }
      }

      return advanced;
    };

    const handleLevelUp = (previousLevel: number, currentLevel: number): void => {
      orderSystem.refreshActiveOrdersForCurrentLevel();
      refreshOrderUi();
      seedSelectorSystem.refresh();
      refreshProductionUi();
      refreshPostTutorialGoal();
      audioSystem.playLevelUp();
      feedbackSystem.showLevelUp(
        currentLevel,
        getLevelUnlockSummary(previousLevel, currentLevel),
        width / 2,
        height * 0.28,
        () => {
          productionLandmarkSystem.refresh();
          tutorialPanelSystem.refresh();
          refreshPostTutorialGoal();
        }
      );
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

    const renderOrderBoard = (): void => {
      orderBoardSystem.render({
        x: FARM_LAYOUT.orderBoard.x,
        y: FARM_LAYOUT.orderBoard.y,
        width: FARM_LAYOUT.orderBoard.width,
        orderHeight: FARM_LAYOUT.orderBoard.orderHeight,
        gap: FARM_LAYOUT.orderBoard.gap,
        bottomPadding: FARM_LAYOUT.orderBoard.bottomPadding,
        getOwnedItemCount: (itemId) => gameStateSystem.getItemCount(itemId),
        onClose: () => {
          audioSystem.playButtonTap();
          tutorialPanelSystem.refresh();
          communityBoardSystem.refresh();
        },
        onOrderComplete: (order) => {
          const completedOrderBounds = orderBoardSystem.getOrderBounds(order.id);
          const result = orderSystem.completeOrder(order.id);

          if (result === null) {
            audioSystem.playDisabledTap();
            return;
          }

          audioSystem.playButtonTap();
          hudSystem.refresh();
          bagSystem.refresh();
          refreshOrderUi();
          upgradePanelSystem.refresh();
          refreshProductionUi();
          refreshPostTutorialGoal();
          const tutorialAdvanced = tutorialSystem.recordOrderCompleted();
          if (tutorialAdvanced) {
            orderBoardSystem.closeWindow(false);
            communityBoardSystem.refresh();
          }
          refreshTutorialIfAdvanced(tutorialAdvanced);
          if (tutorialAdvanced) {
            upgradePanelSystem.refresh();
          }
          saveGame();
          if (!result.xpResult.leveledUp) {
            audioSystem.playOrderComplete();
          }
          audioSystem.playCoinGain();
          audioSystem.playXpGain();
          const feedbackX = completedOrderBounds?.centerX ?? width / 2;
          const feedbackY = completedOrderBounds?.centerY ?? FARM_LAYOUT.orderBoard.y + 92;

          feedbackSystem.showOrderComplete(feedbackX, feedbackY - 18);
          feedbackSystem.showOrderRewards(
            feedbackX,
            feedbackY + 10,
            result.order.coinReward,
            result.order.xpReward
          );
          feedbackSystem.showOrderRewardFlyEffects(
            feedbackX,
            feedbackY + 24,
            FARM_LAYOUT.hud.x + 58,
            FARM_LAYOUT.hud.y + 20,
            FARM_LAYOUT.hud.x + 48,
            FARM_LAYOUT.hud.y + 58
          );
          hudSystem.playCoinsPulse();
          hudSystem.playXpPulse();

          if (result.xpResult.leveledUp) {
            handleLevelUp(result.xpResult.previousLevel, result.xpResult.currentLevel);
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

    const cancelActivePlotGesture = (): void => {
      activeGesturePointerId = null;
      lastPaintPointerPosition = null;
      flushPendingTapHarvestText();
      plantingSystem.endPaint();
      harvestingSystem.endHarvest();
      dragMode = 'none';
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
      bagSystem.refresh();
      refreshOrderUi();
      upgradePanelSystem.refresh();
      refreshProductionUi();
      refreshPostTutorialGoal();
      refreshTutorialIfAdvanced(tutorialAdvanced);
      saveGame();
      maybeShowCraftGuidance();
      const harvestPosition = gridSystem.getPlotScreenPosition(harvestResult.plot);

      feedbackSystem.showHarvestFeedback(harvestPosition, harvestResult.crop.name, false);
      feedbackSystem.showHarvestToInventory(
        harvestPosition,
        bagSystem.getInventoryTargetPosition(),
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
        handleLevelUp(harvestResult.xpResult.previousLevel, harvestResult.xpResult.currentLevel);
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
      onPlotPressed: (plot, pointer) => {
        if (plotInputLocked || activeGesturePointerId !== null) {
          return;
        }

        activeGesturePointerId = pointer.id;
        lastPaintPointerPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);
        const harvestResult = harvestingSystem.beginHarvest(plot);

        if (harvestResult !== null) {
          dragMode = 'harvest';
          lastPaintPointerPosition = null;
          handleHarvestResult(harvestResult, 'defer-single');
          return;
        }

        if (this.time.now < suppressPlantingUntil) {
          dragMode = 'none';
          lastPaintPointerPosition = null;
          return;
        }

        const plantResult = plantingSystem.beginPaint(plot);

        if (plantResult?.status === 'planted') {
          dragMode = 'plant';
          handlePlantResult(plantResult);
          return;
        }

        if (plantResult?.status === 'insufficient-coins') {
          dragMode = 'plant';
          feedbackSystem.showInsufficientCoins(
            gridSystem.getPlotScreenPosition(plantResult.plot),
            plantResult.crop.seedCost
          );
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playDisabledTap();
        dragMode = 'none';
        lastPaintPointerPosition = null;
      },
      onPlotDraggedOver: (plot, pointer) => {
        if (plotInputLocked) {
          return;
        }

        if (dragMode === 'harvest' && activeGesturePointerId === pointer.id) {
          const harvestResult = harvestingSystem.harvestOver(plot);

          if (harvestResult !== null) {
            handleHarvestResult(harvestResult, 'aggregate');
          }

          return;
        }
      }
    });

    gridSystem.render();

    productionLandmarkSystem.render({
      landmarks: FARM_LAYOUT.productionLandmarks,
      onOpen: openProductionForRecipe,
      onLockedTap: () => audioSystem.playDisabledTap(),
      shouldHighlightLandmark: (recipeId) =>
        recipeId === MILL_FLOUR_RECIPE_ID && tutorialSystem.shouldHighlightCraftButton(),
      shouldHighlightReady: (recipeId) =>
        recipeId === MILL_FLOUR_RECIPE_ID && tutorialSystem.shouldHighlightMillReady()
    });

    hudSystem.render(
      FARM_LAYOUT.hud.x,
      FARM_LAYOUT.hud.y,
      FARM_LAYOUT.hud.width,
      FARM_LAYOUT.hud.height
    );

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

        audioSystem.playProductionStart();
        const tutorialAdvanced =
          recipeId === MILL_FLOUR_RECIPE_ID && tutorialSystem.recordMillStarted();
        refreshProductionUi();
        refreshOrderUi();
        refreshPostTutorialGoal();
        refreshTutorialIfAdvanced(tutorialAdvanced);
        saveGame();
        const inputItemId = Object.keys(result.recipe.input)[0] as ItemId;
        const recipeRowY = FARM_LAYOUT.productionMenu.y + 88;

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

        audioSystem.playProductionCollect();
        const tutorialAdvanced =
          recipeId === MILL_FLOUR_RECIPE_ID && tutorialSystem.recordFlourCollected();
        refreshProductionUi();
        refreshOrderUi();
        refreshPostTutorialGoal();
        refreshTutorialIfAdvanced(tutorialAdvanced);
        saveGame();
        const recipeRowY = FARM_LAYOUT.productionMenu.y + 88;

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
      statusX: FARM_LAYOUT.productionStatus.x,
      statusY: FARM_LAYOUT.productionStatus.y,
      statusWidth: FARM_LAYOUT.productionStatus.width,
      statusHeight: FARM_LAYOUT.productionStatus.height,
      highlightRecipeChip: (recipeId) =>
        recipeId === MILL_FLOUR_RECIPE_ID && tutorialSystem.shouldHighlightMillReady(),
      onOpen: openProductionForRecipe
    });

    upgradePanelSystem.render({
      x: FARM_LAYOUT.plotUpgradePanel.x,
      y: FARM_LAYOUT.plotUpgradePanel.y,
      width: FARM_LAYOUT.plotUpgradePanel.width,
      height: FARM_LAYOUT.plotUpgradePanel.height,
      isLocked: () => !tutorialSystem.canPurchasePlotUpgrade(),
      isPurchaseDisabled: () => plotInputLocked || gridSystem.isPlotUpgradeTransitionActive(),
      isHighlighted: () => tutorialSystem.getCurrentStep()?.id === 'upgrade-plots',
      onPurchase: () => {
        if (plotInputLocked || gridSystem.isPlotUpgradeTransitionActive()) {
          return;
        }

        cancelActivePlotGesture();
        plotInputLocked = true;
        const result = upgradeSystem.purchaseNextPlotUpgrade();

        if (result === null) {
          plotInputLocked = false;
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
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
        gridSystem.playPlotUpgradeTransition(result.plots, () => {
          plotInputLocked = false;
          upgradePanelSystem.refresh();
        });
      }
    });

    renderOrderBoard();

    communityBoardSystem.render({
      x: FARM_LAYOUT.communityBoard.x,
      y: FARM_LAYOUT.communityBoard.y,
      width: FARM_LAYOUT.communityBoard.width,
      height: FARM_LAYOUT.communityBoard.height,
      isReady: () => orderSystem.getActiveOrders().some((order) => orderSystem.canCompleteOrder(order)),
      isHighlighted: () =>
        tutorialSystem.getCurrentStep()?.id === 'complete-order' && !orderBoardSystem.isOpen(),
      onOpen: () => {
        if (orderBoardSystem.isOpen()) {
          return;
        }

        if (productionMenuSystem.isOpen()) {
          productionMenuSystem.closeMenu();
        }

        bagSystem.closeWindow(false);
        audioSystem.playButtonTap();
        orderBoardSystem.openWindow();
        tutorialPanelSystem.refresh();
        communityBoardSystem.refresh();
      }
    });

    bagSystem.render({
      entry: FARM_LAYOUT.bag,
      window: FARM_LAYOUT.bagWindow,
      onOpen: () => {
        if (bagSystem.isOpen()) {
          return;
        }

        orderBoardSystem.closeWindow(false);

        if (productionMenuSystem.isOpen()) {
          productionMenuSystem.closeMenu();
        }

        audioSystem.playButtonTap();
        bagSystem.openWindow();
        tutorialPanelSystem.refresh();
        communityBoardSystem.refresh();
      },
      onClose: () => {
        audioSystem.playButtonTap();
        tutorialPanelSystem.refresh();
      },
      onSellCrop: (crop) => {
        const result = cropSellingSystem.sellCrop(crop.id);

        if (result === null) {
          audioSystem.playDisabledTap();
          return;
        }

        audioSystem.playButtonTap();
        hudSystem.refresh();
        bagSystem.refresh();
        refreshOrderUi();
        upgradePanelSystem.refresh();
        refreshProductionUi();
        refreshPostTutorialGoal();
        const tutorialAdvanced = tutorialSystem.recordCropSold();

        if (tutorialAdvanced) {
          bagSystem.closeWindow(false);
        }

        refreshTutorialIfAdvanced(tutorialAdvanced);
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

    const paintStrokeTo = (pointer: Phaser.Input.Pointer): void => {
      if (
        plotInputLocked ||
        dragMode !== 'plant' ||
        activeGesturePointerId !== pointer.id ||
        lastPaintPointerPosition === null
      ) {
        return;
      }

      const currentPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);

      for (const plot of gridSystem.getPlotsCrossedByScreenSegment(lastPaintPointerPosition, currentPosition)) {
        const plantResult = plantingSystem.paintOver(plot);

        if (plantResult?.status === 'planted') {
          handlePlantResult(plantResult);
        } else if (plantResult?.status === 'insufficient-coins') {
          feedbackSystem.showInsufficientCoins(
            gridSystem.getPlotScreenPosition(plantResult.plot),
            plantResult.crop.seedCost
          );
          audioSystem.playDisabledTap();
        }
      }

      lastPaintPointerPosition = currentPosition;
    };
    const endGesture = (): void => {
      cancelActivePlotGesture();
    };
    const endGestureWithPointer = (pointer: Phaser.Input.Pointer): void => {
      if (activeGesturePointerId !== pointer.id) {
        return;
      }

      if (dragMode === 'plant') {
        paintStrokeTo(pointer);
      }

      endGesture();
    };
    const handlePaintMove = (pointer: Phaser.Input.Pointer): void => {
      if (
        plotInputLocked ||
        dragMode !== 'plant' ||
        activeGesturePointerId !== pointer.id ||
        !pointer.isDown
      ) {
        return;
      }

      paintStrokeTo(pointer);
    };
    const handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
      endGestureWithPointer(pointer);
    };
    const handlePointerUpOutside = (pointer: Phaser.Input.Pointer): void => {
      endGestureWithPointer(pointer);
    };
    const handlePointerCancel = (candidate?: unknown): void => {
      if (candidate instanceof Phaser.Input.Pointer) {
        endGestureWithPointer(candidate);
        return;
      }

      endGesture();
    };
    const handleGameOut = (_timeStamp: number, _event: MouseEvent | TouchEvent): void => {
      endGesture();
    };
    const handleInterrupted = (): void => {
      endGesture();
    };
    const cleanupInput = (): void => {
      plotInputLocked = true;
      gridSystem.cancelPlotUpgradeTransition();
      cancelActivePlotGesture();
      this.input.off('pointermove', handlePaintMove);
      this.input.off('pointerup', handlePointerUp);
      this.input.off('pointerupoutside', handlePointerUpOutside);
      this.input.off('pointercancel', handlePointerCancel);
      this.input.off('gameout', handleGameOut);
      this.game.events.off(Phaser.Core.Events.BLUR, handleInterrupted);
      this.game.events.off(Phaser.Core.Events.HIDDEN, handleInterrupted);
    };

    this.input.on('pointermove', handlePaintMove);
    this.input.on('pointerup', handlePointerUp);
    this.input.on('pointerupoutside', handlePointerUpOutside);
    this.input.on('pointercancel', handlePointerCancel);
    this.input.on('gameout', handleGameOut);
    this.game.events.on(Phaser.Core.Events.BLUR, handleInterrupted);
    this.game.events.on(Phaser.Core.Events.HIDDEN, handleInterrupted);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupInput);

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
            const landmarkBounds = productionLandmarkSystem.getLandmarkBounds(recipe.id);
            feedbackSystem.showProductionReady(
              landmarkBounds.centerX,
              landmarkBounds.y - 2,
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
          return { ...base, y: 548, height: 66 };
        case 'complete-order':
          return { ...base, y: 548, height: 66 };
        case 'craft-open':
          return { ...base, y: 286, height: 66 };
        case 'craft-start-mill':
        case 'craft-wait-flour':
        case 'craft-open-ready':
        case 'craft-collect-flour':
        case 'craft-start-second-mill':
          return { ...base, y: 684, height: 66 };
        case 'craft-close-menu':
          return { ...base, y: 590, height: 58 };
        default:
          return base;
      }
    };

    const getMillActionButtonBounds = () => ({
      x: FARM_LAYOUT.productionMenu.x + FARM_LAYOUT.productionMenu.width - 100,
      y: FARM_LAYOUT.productionMenu.y + 52 + 78 - 14,
      width: 86,
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
          return orderBoardSystem.isOpen()
            ? orderBoardSystem.getOrderBounds('sunwheat-sack')
            : communityBoardSystem.getHitBounds();
        case 'upgrade-plots':
          return FARM_LAYOUT.plotUpgradePanel;
        case 'sell-crop':
          return bagSystem.isOpen()
            ? bagSystem.getSellButtonBounds('sunwheat')
            : bagSystem.getHitBounds();
        case 'craft-open':
          return productionLandmarkSystem.getLandmarkBounds(MILL_FLOUR_RECIPE_ID);
        case 'craft-start-mill':
        case 'craft-collect-flour':
        case 'craft-start-second-mill':
          return productionMenuSystem.isOpen()
            ? getMillActionButtonBounds()
            : productionLandmarkSystem.getLandmarkBounds(MILL_FLOUR_RECIPE_ID);
        case 'craft-open-ready':
          return productionLandmarkSystem.getReadyIndicatorBounds(MILL_FLOUR_RECIPE_ID) ??
            productionLandmarkSystem.getLandmarkBounds(MILL_FLOUR_RECIPE_ID);
        case 'craft-close-menu':
          return null;
        case 'craft-wait-flour':
          return null;
        default:
          return null;
      }
    };

    const shouldUseTutorialArrow = (stepId: TutorialStepId) => {
      return false;
    };

    tutorialPanelSystem.render({
      x: FARM_LAYOUT.tutorialPanel.x,
      y: FARM_LAYOUT.tutorialPanel.y,
      width: FARM_LAYOUT.tutorialPanel.width,
      height: FARM_LAYOUT.tutorialPanel.height,
      getPanelBounds: getTutorialPanelBounds,
      getTargetBounds: getTutorialTargetBounds,
      isVisible: (step) => {
        if (orderBoardSystem.isOpen()) {
          return step.id === 'complete-order';
        }

        if (bagSystem.isOpen()) {
          return step.id === 'sell-crop';
        }

        return true;
      },
      getMessage: (step) => {
        if (step.id === 'complete-order') {
          return orderBoardSystem.isOpen()
            ? 'Complete Sunwheat Sack to earn coins and XP.'
            : 'Tap the Community Board to view Orders.';
        }

        if (step.id === 'sell-crop') {
          return bagSystem.isOpen()
            ? 'Sell one Sunwheat from your Bag to earn seed money.'
            : 'Tap the Bag to view your inventory.';
        }

        return step.message;
      },
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
          refreshPostTutorialGoal();
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
          const advancedFromSavedState = syncTutorialWithSavedGameState();

          tutorialPanelSystem.refresh();
          saveGame();

          if (advancedFromSavedState) {
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
      },
      onResetSave: () => {
        saveSystem.clear();
        this.scene.restart();
      }
    });
    this.startDeferredAudioLoad(audioSystem);

    if (syncTutorialWithSavedGameState()) {
      tutorialPanelSystem.refresh();
      refreshProductionUi();
      saveGame();
    }

    maybeShowCraftGuidance();
    refreshPostTutorialGoal();

    if (saveLoadResult !== null && saveLoadResult.cropsFinishedWhileAway > 0) {
      feedbackSystem.showOfflineSummary(
        saveLoadResult.cropsFinishedWhileAway,
        width / 2,
        FARM_LAYOUT.farmGrid.y + 24
      );
      saveGame();
    }
  }

  private startDeferredAudioLoad(audioSystem: AudioSystem): void {
    audioSystem.startMusic();

    const assetsToLoad = DEFERRED_AUDIO_ASSETS.filter(
      (asset) => !this.cache.audio.exists(asset.key)
    );

    if (assetsToLoad.length === 0) {
      return;
    }

    const handleFileComplete = (key: string): void => {
      if (key === AUDIO_KEYS.music) {
        audioSystem.startMusic();
      }
    };
    const cleanup = (): void => {
      this.load.off(Phaser.Loader.Events.FILE_COMPLETE, handleFileComplete);
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    };

    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, handleFileComplete);
    this.load.once(Phaser.Loader.Events.COMPLETE, cleanup);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

    for (const asset of assetsToLoad) {
      this.load.audio(asset.key, asset.url);
    }

    this.load.start();
  }
}
