import type { OrderDefinition } from '../models/OrderTypes';

export const MVP_ORDERS: OrderDefinition[] = [
  {
    id: 'sunwheat-sack',
    name: 'Sunwheat Sack',
    requirements: {
      sunwheat: 5
    },
    coinReward: 24,
    xpReward: 5
  },
  {
    id: 'carrot-bundle',
    name: 'Carrot Bundle',
    requirements: {
      carrot: 3
    },
    coinReward: 42,
    xpReward: 8
  },
  {
    id: 'village-breakfast',
    name: 'Village Breakfast',
    requirements: {
      sunwheat: 4,
      carrot: 2
    },
    coinReward: 65,
    xpReward: 14
  },
  {
    id: 'glowberry-treats',
    name: 'Glowberry Treats',
    requirements: {
      glowberry: 2
    },
    coinReward: 85,
    xpReward: 18
  },
  {
    id: 'market-starter-crate',
    name: 'Market Starter Crate',
    requirements: {
      sunwheat: 8,
      carrot: 4
    },
    coinReward: 120,
    xpReward: 25
  }
];
