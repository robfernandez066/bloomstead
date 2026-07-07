export type TutorialStepId =
  | 'welcome'
  | 'select-sunwheat'
  | 'wait-for-crop'
  | 'harvest'
  | 'complete-order'
  | 'upgrade-plots'
  | 'sell-crop'
  | 'complete'
  | 'craft-hint'
  | 'craft-open'
  | 'craft-start-mill'
  | 'craft-wait-flour'
  | 'craft-open-ready'
  | 'craft-collect-flour'
  | 'craft-start-second-mill'
  | 'craft-close-menu';

export interface TutorialStepDefinition {
  id: TutorialStepId;
  message: string;
  requiresAcknowledgement: boolean;
}

export interface TutorialState {
  currentStepId: TutorialStepId;
  completed: boolean;
  completionRewardClaimed: boolean;
  craftHintActive: boolean;
  craftHintShown: boolean;
  tutorialSunwheatRequiredPlots: number;
  tutorialSunwheatHarvested: number;
}
