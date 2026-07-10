# MVP Playtest Checklist

Use this checklist before sharing Bloomstead with a small playtest group. Test on a mobile-sized viewport first, ideally `390x844`, then spot-check `360x740`.

## Setup

* Start from a fresh save or use Dev Reset.
* Open the browser console so runtime errors are visible.
* Confirm the game loads without missing asset or favicon errors.
* Confirm `SFX On/Off` is visible and starts in the saved state.

## First-Session Flow

* Fresh save shows the tutorial automatically; no old Start button appears.
* Only one tutorial/hint panel is visible at a time.
* Tutorial target pulses point at the actual target controls or plots.
* Plant the full starter Sunwheat field.
* Wait for Sunwheat to grow, then harvest the full starter field.
* Complete the first order and confirm coins/XP feedback is visible.
* Confirm crop inventory/sell rows and coin totals update clearly.
* Buy the first plot upgrade through `Purchase More Plots` and the `Yes / No` confirmation.
* Sell a crop during the tutorial sell step.

## Production Flow

* Before Level 2, confirm the Mill and Bakery appear as locked restoration/construction landmarks and that tapping either locked idle building does not open `Production`.
* When the tutorial points to production, tap the physical Mill landmark to open its focused `Production` window; do not look for a global `Craft` launcher.
* Start the guided Mill job; tutorial Mill quantity should stay simple/locked at `x1`.
* Confirm the Mill production status chip appears while producing and routes back to the Mill's focused `Production` window.
* When Flour is ready, tap the Mill's ready-product indicator, collect Flour, and confirm the Flour count updates.
* Start another Mill job, tap outside the Production window, and complete the tutorial.
* At Level 3, confirm the Bakery landmark unlocks and can operate independently from the Mill; tapping the Bakery opens its focused `Production` window.
* Confirm the one-time 75 coin tutorial reward is visible and only granted once.

## Save / Reload Checks

* Reload with crops planted but not ready; crop state should persist or progress offline.
* Reload with crops ready; ready crops should remain harvestable.
* Reload after harvesting; inventory and XP should persist.
* Reload during active Mill production; timer/progress should persist.
* Reload with ready Mill production; it should remain ready and should not auto-collect.
* If testing a below-level non-idle legacy production save, confirm the corresponding landmark/status/ready route remains accessible for collection.
* Reload after tutorial completion; tutorial should not reappear and the reward should not duplicate.
* Reload with an order partially or fully fulfillable; order board and inventory should match the saved state.

## Mobile UI Checks

* At `390x844`, confirm HUD, sell rows, farm plots, Mill/Bakery landmarks, production chips, goods strip, upgrade panel, order board, tutorial panel, and seed selector do not overlap.
* At `360x740`, confirm sell rows, order cards, focused Production window controls, and production chips remain readable and tappable.
* Confirm tapping outside the Production window closes it without triggering farm actions behind it.
* Confirm generated item icons and order source labels remain readable.

## Audio / Feedback Checks

* Toggle SFX off and confirm sounds stop.
* Toggle SFX on and confirm planting, harvesting, order completion, production start/collect, plot upgrade, tutorial complete, and level-up sounds are audible but not harsh.
* Rapid-harvest a field and confirm harvest SFX are responsive without becoming spammy.

## Build Check

Run:

```bash
npm.cmd run build
```

Expected result: build passes. The existing Vite large chunk warning is known and not an MVP blocker.
