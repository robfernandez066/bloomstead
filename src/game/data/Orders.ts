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
  },
  {
    id: 'bakers-flour',
    name: "Baker's Flour",
    requirements: {
      flour: 2
    },
    coinReward: 90,
    xpReward: 20,
    minFarmLevel: 2
  },
  {
    id: 'fresh-bread',
    name: 'Fresh Bread',
    requirements: {
      bread: 1
    },
    coinReward: 130,
    xpReward: 30,
    minFarmLevel: 3
  },
  {
    id: 'glowberry-toast',
    name: 'Glowberry Toast',
    requirements: {
      bread: 1,
      glowberry: 2
    },
    coinReward: 210,
    xpReward: 42,
    minFarmLevel: 3
  },
  {
    id: 'harvest-lunchbox',
    name: 'Harvest Lunchbox',
    requirements: {
      sunwheat: 3,
      carrot: 2,
      bread: 1
    },
    coinReward: 180,
    xpReward: 36,
    minFarmLevel: 3
  },
  {
    id: 'bakers-basket',
    name: "Baker's Basket",
    requirements: {
      bread: 2,
      flour: 2
    },
    coinReward: 300,
    xpReward: 60,
    minFarmLevel: 4
  },
  {
    id: 'lanternberry-crate',
    name: 'Lanternberry Crate',
    requirements: {
      glowberry: 4,
      carrot: 2
    },
    coinReward: 230,
    xpReward: 48,
    minFarmLevel: 4
  },
  {
    id: 'village-feast',
    name: 'Village Feast',
    requirements: {
      bread: 2,
      glowberry: 4,
      carrot: 4
    },
    coinReward: 420,
    xpReward: 85,
    minFarmLevel: 5
  }
];
