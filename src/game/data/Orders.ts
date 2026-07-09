import type { OrderDefinition } from '../models/OrderTypes';

export const MVP_ORDERS: OrderDefinition[] = [
  {
    id: 'sunwheat-sack',
    name: 'Sunwheat Sack',
    source: 'Farm Stand',
    requirements: {
      sunwheat: 5
    },
    coinReward: 24,
    xpReward: 5
  },
  {
    id: 'carrot-bundle',
    name: 'Carrot Bundle',
    source: 'Village Market',
    requirements: {
      carrot: 3
    },
    coinReward: 42,
    xpReward: 8
  },
  {
    id: 'village-breakfast',
    name: 'Village Breakfast',
    source: 'Village Cook',
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
    source: 'Lantern Guild',
    requirements: {
      glowberry: 2
    },
    coinReward: 85,
    xpReward: 18
  },
  {
    id: 'market-starter-crate',
    name: 'Market Starter Crate',
    source: 'Village Market',
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
    source: 'Baker',
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
    source: 'Baker',
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
    source: 'Baker',
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
    source: 'Village Cook',
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
    source: 'Baker',
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
    source: 'Lantern Guild',
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
    source: 'Village Cook',
    requirements: {
      bread: 2,
      glowberry: 4,
      carrot: 4
    },
    coinReward: 420,
    xpReward: 85,
    minFarmLevel: 5
  },
  {
    id: 'carrot-crate',
    name: 'Carrot Crate',
    source: 'Village Market',
    requirements: {
      carrot: 5
    },
    coinReward: 88,
    xpReward: 18,
    minFarmLevel: 2
  },
  {
    id: 'millers-samples',
    name: "Miller's Samples",
    source: 'Baker',
    requirements: {
      sunwheat: 2,
      flour: 1
    },
    coinReward: 82,
    xpReward: 17,
    minFarmLevel: 2
  },
  {
    id: 'lantern-jam-basket',
    name: 'Lantern Jam Basket',
    source: 'Lantern Guild',
    requirements: {
      glowberry: 3
    },
    coinReward: 150,
    xpReward: 32,
    minFarmLevel: 3
  },
  {
    id: 'glowberry-muffin-box',
    name: 'Glowberry Muffin Box',
    source: 'Baker',
    requirements: {
      flour: 2,
      glowberry: 2
    },
    coinReward: 195,
    xpReward: 40,
    minFarmLevel: 3
  }
];
