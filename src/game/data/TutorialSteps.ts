import type { TutorialStepDefinition, TutorialStepId } from '../models/TutorialTypes';

export const TUTORIAL_STEPS: TutorialStepDefinition[] = [
  {
    id: 'welcome',
    message: 'Welcome to Bloomstead! Fill every starter plot with Sunwheat.',
    requiresAcknowledgement: false
  },
  {
    id: 'select-sunwheat',
    message: 'Sunwheat is selected. Tap or drag over every empty starter plot.',
    requiresAcknowledgement: false
  },
  {
    id: 'wait-for-crop',
    message: "Nice field! Sunwheat grows quickly - wait until it is ready.",
    requiresAcknowledgement: false
  },
  {
    id: 'harvest',
    message: 'Tap or swipe to harvest all of your tutorial Sunwheat.',
    requiresAcknowledgement: false
  },
  {
    id: 'complete-order',
    message: 'Orders reward coins and XP. Grow enough crops to complete Sunwheat Sack.',
    requiresAcknowledgement: false
  },
  {
    id: 'upgrade-plots',
    message: 'You can spend coins to expand your farm. Tap here to upgrade.',
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
  },
  {
    id: 'craft-hint',
    message: 'The restored Mill can refine your Sunwheat into Flour.',
    requiresAcknowledgement: false
  },
  {
    id: 'craft-open',
    message: 'Tap the Mill to open its Production window.',
    requiresAcknowledgement: false
  },
  {
    id: 'craft-start-mill',
    message: 'Tap Start to begin using the Mill and create some Flour.',
    requiresAcknowledgement: false
  },
  {
    id: 'craft-wait-flour',
    message: 'Wait for the flour to be completed.',
    requiresAcknowledgement: false
  },
  {
    id: 'craft-open-ready',
    message: 'Collect your flour from the mill by tapping here.',
    requiresAcknowledgement: false
  },
  {
    id: 'craft-collect-flour',
    message: 'Tap the Collect button.',
    requiresAcknowledgement: false
  },
  {
    id: 'craft-start-second-mill',
    message: 'Start another mill production order by clicking start.',
    requiresAcknowledgement: false
  },
  {
    id: 'craft-close-menu',
    message: 'Tap outside the Production window to close it.',
    requiresAcknowledgement: false
  }
];

export const TUTORIAL_STEP_BY_ID = TUTORIAL_STEPS.reduce(
  (stepsById, step) => {
    stepsById[step.id] = step;
    return stepsById;
  },
  {} as Record<TutorialStepId, TutorialStepDefinition>
);
