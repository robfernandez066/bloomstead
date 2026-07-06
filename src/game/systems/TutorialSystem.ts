import { TUTORIAL_STEP_BY_ID } from '../data/TutorialSteps';
import type { CropId } from '../models/CropTypes';
import type {
  TutorialState,
  TutorialStepDefinition,
  TutorialStepId
} from '../models/TutorialTypes';

const DEFAULT_TUTORIAL_STATE: TutorialState = {
  currentStepId: 'welcome',
  completed: false
};

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

    if (this.state.currentStepId === 'complete') {
      this.state.completed = true;
      return true;
    }

    return false;
  }

  recordCropPlanted(cropId: CropId): boolean {
    if (this.state.currentStepId !== 'select-sunwheat' || cropId !== 'sunwheat') {
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

    return this.advanceTo('complete');
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
      completed: initialState.completed
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
