import type { TutorialStepDefinition, TutorialStepId } from '../models/TutorialTypes';

export const TUTORIAL_STEPS: TutorialStepDefinition[] = [
  {
    id: 'welcome',
    message: "Welcome to Bloomstead! Let's grow your first Sunwheat.",
    requiresAcknowledgement: true
  },
  {
    id: 'select-sunwheat',
    message: 'Sunwheat is selected. Tap or drag over empty plots to plant.',
    requiresAcknowledgement: false
  },
  {
    id: 'wait-for-crop',
    message: "Crops grow over time. Sunwheat is quick - it'll be ready soon.",
    requiresAcknowledgement: false
  },
  {
    id: 'harvest',
    message: 'Tap or swipe ready crops to harvest them.',
    requiresAcknowledgement: false
  },
  {
    id: 'complete-order',
    message: 'Orders reward coins and XP. Grow enough crops to complete Sunwheat Sack.',
    requiresAcknowledgement: false
  },
  {
    id: 'upgrade-plots',
    message: 'Use coins to unlock more plots and grow more at once.',
    requiresAcknowledgement: false
  },
  {
    id: 'sell-crop',
    message: 'Out of coins? Sell extra crops to earn seed money.',
    requiresAcknowledgement: false
  },
  {
    id: 'complete',
    message: 'Nice! Keep farming, completing orders, and unlocking new crops.',
    requiresAcknowledgement: true
  }
];

export const TUTORIAL_STEP_BY_ID = TUTORIAL_STEPS.reduce(
  (stepsById, step) => {
    stepsById[step.id] = step;
    return stepsById;
  },
  {} as Record<TutorialStepId, TutorialStepDefinition>
);
