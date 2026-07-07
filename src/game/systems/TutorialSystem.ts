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
  craftHintShown: false
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
        return TUTORIAL_STEP_BY_ID['craft-hint'];
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
    return { coinReward: TUTORIAL_COMPLETION_REWARD_COINS };
  }

  recordCropPlanted(cropId: CropId): boolean {
    if (
      (this.state.currentStepId !== 'welcome' &&
        this.state.currentStepId !== 'select-sunwheat') ||
      cropId !== 'sunwheat'
    ) {
      return false;
    }

    return this.advanceTo('wait-for-crop');
  }

  recordCropReady(): boolean {
    if (this.state.currentStepId !== 'wait-for-crop') {
      return false;
    }

    return this.advanceTo('harvest');
  }

  recordCropHarvested(): boolean {
    if (this.state.currentStepId !== 'harvest') {
      return false;
    }

    return this.advanceTo('complete-order');
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

    return this.advanceTo('complete');
  }

  activateCraftGuidance(): boolean {
    if (!this.state.completed || this.state.craftHintShown || this.state.craftHintActive) {
      return false;
    }

    this.state.craftHintActive = true;
    return true;
  }

  completeCraftGuidance(): boolean {
    if (!this.isCraftGuidanceActive()) {
      return false;
    }

    this.state.craftHintActive = false;
    this.state.craftHintShown = true;
    return true;
  }

  isCraftGuidanceActive(): boolean {
    return this.state.craftHintActive && !this.state.craftHintShown;
  }

  private createInitialState(initialState?: TutorialState): TutorialState {
    if (
      initialState === undefined ||
      initialState.currentStepId === undefined ||
      TUTORIAL_STEP_BY_ID[initialState.currentStepId] === undefined
    ) {
      return { ...DEFAULT_TUTORIAL_STATE };
    }

    return {
      currentStepId: initialState.currentStepId,
      completed: initialState.completed === true,
      completionRewardClaimed:
        initialState.completed === true || initialState.completionRewardClaimed === true,
      craftHintActive:
        initialState.completed === true &&
        initialState.craftHintShown !== true &&
        initialState.craftHintActive === true,
      craftHintShown: initialState.craftHintShown === true
    };
  }

  private advanceTo(stepId: TutorialStepId): boolean {
    if (this.state.currentStepId === stepId) {
      return false;
    }

    this.state.currentStepId = stepId;
    return true;
  }
}
