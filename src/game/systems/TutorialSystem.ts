import { TUTORIAL_STEP_BY_ID } from '../data/TutorialSteps';
import type { CropId } from '../models/CropTypes';
import type {
  TutorialState,
  TutorialStepDefinition,
  TutorialStepId
} from '../models/TutorialTypes';

const DEFAULT_TUTORIAL_STATE: TutorialState = {
  currentStepId: 'welcome',
  completed: false,
  completionRewardClaimed: false,
  craftHintActive: false,
  craftHintShown: false,
  tutorialSunwheatRequiredPlots: 0,
  tutorialSunwheatHarvested: 0
};

export const TUTORIAL_COMPLETION_REWARD_COINS = 75;

export interface TutorialCompletionResult {
  coinReward: number;
}

export class TutorialSystem {
  private readonly state: TutorialState;

  constructor(initialState?: TutorialState) {
    this.state = this.createInitialState(initialState);
  }

  getState(): TutorialState {
    return this.state;
  }

  getCurrentStep(): TutorialStepDefinition | null {
    if (this.state.completed) {
      if (this.isCraftGuidanceActive()) {
        return TUTORIAL_STEP_BY_ID[this.state.currentStepId] ?? TUTORIAL_STEP_BY_ID['craft-open'];
      }

      return null;
    }

    return TUTORIAL_STEP_BY_ID[this.state.currentStepId] ?? TUTORIAL_STEP_BY_ID.welcome;
  }

  acknowledgeCurrentStep(): boolean {
    if (this.state.completed) {
      return false;
    }

    if (this.state.currentStepId === 'welcome') {
      return this.advanceTo('select-sunwheat');
    }

    return false;
  }

  completeTutorial(): TutorialCompletionResult | null {
    if (
      this.state.completed ||
      this.state.currentStepId !== 'complete' ||
      this.state.completionRewardClaimed
    ) {
      return null;
    }

    this.state.completionRewardClaimed = true;
    this.state.completed = true;
    this.state.craftHintActive = false;
    this.state.craftHintShown = true;
    return { coinReward: TUTORIAL_COMPLETION_REWARD_COINS };
  }

  recordCropPlanted(cropId: CropId): boolean {
    if (cropId !== 'sunwheat') {
      return false;
    }

    return this.recordSunwheatPlantingProgress(1, 1);
  }

  recordSunwheatPlantingProgress(plantedSunwheatCount: number, requiredPlotCount: number): boolean {
    if (
      this.state.completed ||
      (this.state.currentStepId !== 'welcome' &&
        this.state.currentStepId !== 'select-sunwheat')
    ) {
      return false;
    }

    const requiredCount = Math.max(1, requiredPlotCount);
    this.state.tutorialSunwheatRequiredPlots = requiredCount;

    if (plantedSunwheatCount < requiredCount) {
      return this.state.currentStepId === 'welcome' && plantedSunwheatCount > 0
        ? this.advanceTo('select-sunwheat')
        : false;
    }

    return this.advanceTo('wait-for-crop');
  }

  recordCropReady(): boolean {
    if (this.state.currentStepId !== 'wait-for-crop') {
      return false;
    }

    return this.advanceTo('harvest');
  }

  recordCropHarvested(cropId: CropId = 'sunwheat'): boolean {
    if (this.state.currentStepId !== 'harvest') {
      return false;
    }

    if (cropId !== 'sunwheat') {
      return false;
    }

    this.state.tutorialSunwheatHarvested += 1;
    return this.advanceHarvestIfComplete();
  }

  syncHarvestProgress(remainingPlantedSunwheatCount: number): boolean {
    if (this.state.currentStepId !== 'harvest' || remainingPlantedSunwheatCount > 0) {
      return false;
    }

    const requiredCount = Math.max(1, this.state.tutorialSunwheatRequiredPlots);
    this.state.tutorialSunwheatHarvested = Math.max(
      this.state.tutorialSunwheatHarvested,
      requiredCount
    );

    return this.advanceHarvestIfComplete();
  }

  recordOrderCompleted(): boolean {
    if (this.state.currentStepId !== 'complete-order') {
      return false;
    }

    return this.advanceTo('upgrade-plots');
  }

  recordFirstPlotUpgradePurchased(purchasedPlotUpgradeCount: number): boolean {
    if (this.state.currentStepId !== 'upgrade-plots' || purchasedPlotUpgradeCount < 1) {
      return false;
    }

    return this.advanceTo('sell-crop');
  }

  recordCropSold(): boolean {
    if (this.state.currentStepId !== 'sell-crop') {
      return false;
    }

    return this.advanceTo('craft-open');
  }

  activateCraftGuidance(): boolean {
    if (!this.state.completed || this.state.craftHintShown || this.state.craftHintActive) {
      return false;
    }

    this.state.currentStepId = 'craft-open';
    this.state.craftHintActive = true;
    return true;
  }

  recordCraftOpened(): boolean {
    if (this.state.currentStepId === 'craft-open') {
      return this.advanceTo('craft-start-mill');
    }

    if (this.state.currentStepId === 'craft-open-ready') {
      return this.advanceTo('craft-collect-flour');
    }

    return false;
  }

  recordMillStarted(): boolean {
    if (this.state.currentStepId === 'craft-start-mill') {
      return this.advanceTo('craft-wait-flour');
    }

    if (this.state.currentStepId === 'craft-start-second-mill') {
      return this.advanceTo('craft-close-menu');
    }

    return false;
  }

  recordMillReady(): boolean {
    if (this.state.currentStepId !== 'craft-wait-flour') {
      return false;
    }

    return this.advanceTo('craft-open-ready');
  }

  recordFlourCollected(): boolean {
    if (this.state.currentStepId !== 'craft-collect-flour') {
      return false;
    }

    return this.advanceTo('craft-start-second-mill');
  }

  recordProductionMenuClosed(): boolean {
    if (this.state.currentStepId !== 'craft-close-menu') {
      return false;
    }

    return this.advanceTo('complete');
  }

  isCraftGuidanceActive(): boolean {
    return (
      (this.state.craftHintActive && !this.state.craftHintShown) ||
      (!this.state.completed && this.isCraftTutorialStep(this.state.currentStepId))
    );
  }

  canPurchasePlotUpgrade(): boolean {
    return this.state.completed || this.state.currentStepId === 'upgrade-plots';
  }

  shouldHighlightCraftButton(): boolean {
    return this.state.currentStepId === 'craft-open';
  }

  shouldHighlightMillReady(): boolean {
    return this.state.currentStepId === 'craft-open-ready';
  }

  shouldHighlightMillActionButton(): boolean {
    return (
      this.state.currentStepId === 'craft-start-mill' ||
      this.state.currentStepId === 'craft-collect-flour' ||
      this.state.currentStepId === 'craft-start-second-mill'
    );
  }

  private createInitialState(initialState?: TutorialState): TutorialState {
    if (
      initialState === undefined ||
      initialState === null ||
      typeof initialState !== 'object'
    ) {
      return { ...DEFAULT_TUTORIAL_STATE };
    }

    const completed =
      initialState.completed === true || initialState.completionRewardClaimed === true;

    if (
      initialState.currentStepId === undefined ||
      TUTORIAL_STEP_BY_ID[initialState.currentStepId] === undefined
    ) {
      return completed
        ? {
            ...DEFAULT_TUTORIAL_STATE,
            currentStepId: 'complete',
            completed: true,
            completionRewardClaimed: true,
            craftHintShown: true
          }
        : { ...DEFAULT_TUTORIAL_STATE };
    }

    const preserveActiveCraftGuidance =
      completed && initialState.craftHintActive === true && initialState.craftHintShown !== true;
    const currentStepId =
      initialState.currentStepId === 'craft-hint'
        ? 'craft-open'
        : initialState.currentStepId;

    return {
      currentStepId,
      completed,
      completionRewardClaimed: completed,
      craftHintActive: preserveActiveCraftGuidance,
      craftHintShown:
        initialState.craftHintShown === true || (completed && !preserveActiveCraftGuidance),
      tutorialSunwheatRequiredPlots:
        typeof initialState.tutorialSunwheatRequiredPlots === 'number'
          ? initialState.tutorialSunwheatRequiredPlots
          : DEFAULT_TUTORIAL_STATE.tutorialSunwheatRequiredPlots,
      tutorialSunwheatHarvested:
        typeof initialState.tutorialSunwheatHarvested === 'number'
          ? initialState.tutorialSunwheatHarvested
          : DEFAULT_TUTORIAL_STATE.tutorialSunwheatHarvested
    };
  }

  private advanceTo(stepId: TutorialStepId): boolean {
    if (this.state.currentStepId === stepId) {
      return false;
    }

    this.state.currentStepId = stepId;
    return true;
  }

  private advanceHarvestIfComplete(): boolean {
    const requiredCount = Math.max(1, this.state.tutorialSunwheatRequiredPlots);

    if (this.state.tutorialSunwheatHarvested < requiredCount) {
      return false;
    }

    return this.advanceTo('complete-order');
  }

  private isCraftTutorialStep(stepId: TutorialStepId): boolean {
    return (
      stepId === 'craft-open' ||
      stepId === 'craft-start-mill' ||
      stepId === 'craft-wait-flour' ||
      stepId === 'craft-open-ready' ||
      stepId === 'craft-collect-flour' ||
      stepId === 'craft-start-second-mill' ||
      stepId === 'craft-close-menu'
    );
  }
}
