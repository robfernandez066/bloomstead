export type TutorialStepId =
  | 'welcome'
  | 'select-sunwheat'
  | 'wait-for-crop'
  | 'harvest'
  | 'complete-order'
  | 'upgrade-plots'
  | 'complete';

export interface TutorialStepDefinition {
  id: TutorialStepId;
  message: string;
  requiresAcknowledgement: boolean;
}

export interface TutorialState {
  currentStepId: TutorialStepId;
  completed: boolean;
}
