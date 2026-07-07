export const BASE_GAME_WIDTH = 390;
export const BASE_GAME_HEIGHT = 844;

export const FARM_LAYOUT = {
  hud: {
    x: 18,
    y: 18,
    width: 354,
    height: 106
  },
  devControls: {
    x: 286,
    y: 132,
    width: 86,
    height: 24
  },
  farmGrid: {
    x: 18,
    y: 164,
    width: 354,
    height: 232,
    tileWidth: 54,
    tileHeight: 27,
    markerAnchorOffsetY: 0,
    debugAnchors: false
  },
  millPanel: {
    x: 18,
    y: 356,
    width: 354,
    height: 44,
    buttonWidth: 72
  },
  cropSellPanel: {
    x: 18,
    y: 128,
    buttonWidth: 84,
    buttonHeight: 30,
    gap: 6
  },
  muteToggle: {
    x: 304,
    y: 94,
    width: 56,
    height: 22
  },
  plotUpgradePanel: {
    x: 18,
    y: 406,
    width: 354,
    height: 44
  },
  orderBoard: {
    x: 18,
    y: 458,
    width: 354,
    orderHeight: 54,
    gap: 6,
    bottomPadding: 14
  },
  tutorialPanel: {
    x: 18,
    y: 684,
    width: 354,
    height: 62
  },
  seedSelector: {
    x: 22,
    y: 760,
    buttonWidth: 104,
    buttonHeight: 56,
    gap: 17
  }
} as const;
