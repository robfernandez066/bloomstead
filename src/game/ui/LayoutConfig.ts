export const BASE_GAME_WIDTH = 390;
export const BASE_GAME_HEIGHT = 844;

export const FARM_LAYOUT = {
  hud: {
    x: 18,
    y: 18,
    width: 354,
    height: 126
  },
  devControls: {
    x: 18,
    y: 152,
    width: 354,
    height: 28
  },
  farmGrid: {
    originX: 195,
    originY: 244,
    tileWidth: 56,
    tileHeight: 28
  },
  plotUpgradePanel: {
    x: 18,
    y: 454,
    width: 354,
    height: 46
  },
  orderBoard: {
    x: 18,
    y: 508,
    width: 354,
    orderHeight: 58,
    gap: 6
  },
  seedSelector: {
    x: 18,
    y: 740,
    buttonWidth: 108,
    buttonHeight: 64,
    gap: 15
  }
} as const;
