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
  productionLandmarks: {
    mill: {
      x: 18,
      y: 170,
      width: 82,
      height: 78
    },
    bakery: {
      x: 290,
      y: 170,
      width: 82,
      height: 78
    }
  },
  productionStatus: {
    x: 18,
    y: 356,
    width: 354,
    height: 44
  },
  productionMenu: {
    x: 18,
    y: 204,
    width: 354,
    height: 280
  },
  bag: {
    x: 18,
    y: 458,
    width: 90,
    height: 82
  },
  bagWindow: {
    x: 18,
    y: 176,
    width: 354,
    cropRowHeight: 44,
    goodRowHeight: 42,
    gap: 4,
    bottomPadding: 12
  },
  muteToggle: {
    x: 292,
    y: 92,
    width: 68,
    height: 24
  },
  plotUpgradePanel: {
    x: 18,
    y: 406,
    width: 354,
    height: 44
  },
  orderBoard: {
    x: 18,
    y: 176,
    width: 354,
    orderHeight: 68,
    gap: 6,
    bottomPadding: 12
  },
  communityBoard: {
    x: 282,
    y: 458,
    width: 90,
    height: 82
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
