# MVP Backlog

## Current MVP Gameplay

Bloomstead currently starts new games and Dev Reset saves with 100 coins.

The MVP includes:

* Planting, crop growth, harvesting, inventory, coins, XP, and farm levels.
* Three crops: Sunwheat, Carrot, and Glowberry.
* A 3x4 starting crop bed with rectangular plot upgrades to 4x4, 5x4, and 6x4.
* Level-aware order availability:
  * Level 1 orders should only require Sunwheat.
  * Level 2 orders may require Sunwheat and Carrot.
  * Level 3+ orders may use any MVP crop.
* Crop selling as a fallback way to regain seed money.
* Save/load, active order persistence, and offline crop growth.
* Tutorial flow with a sell-crop step after the first plot upgrade.
* One-time 75 coin tutorial completion reward.

## Tutorial Notes

The tutorial should teach the core loop in this order: welcome, plant Sunwheat, wait for crop, harvest, complete an order, buy the first plot upgrade, sell a crop, then complete the tutorial.

The final tutorial completion reward is 75 coins and must only be granted once per save. Dev Reset clears the save, so the reward can be earned again from a fresh start.

## UI / Art Polish Backlog

The current crop sell UI is functional but temporary. Labels like `S +4c`, `C +12c`, and `G +32c` are ugly and unclear.

Handle this in the upcoming UI/art polish pass, not as an immediate gameplay-system change. Preferred direction:

* `Sunwheat x7 — Sell +4c`
* `Carrot x0 — Sell +12c`
* `Glowberry x0 — Sell +32c`

Readable crop rows and/or small crop icons should replace the current compact labels when the HUD/inventory area gets a proper polish pass.

### Tutorial Completion Reward Feedback

The tutorial completion reward works mechanically: clicking the final `Complete` button grants the one-time 75 coin reward. The action should feel more satisfying in the upcoming UI/art/game-feel polish pass.

Preferred future direction:

* Animate coins flying from the `Complete` button or tutorial panel into the coin counter.
* Show clear reward text like `+75 Coins`.
* Add a small burst, pop, or glow on the `Complete` button.
* Pulse or count up the coin HUD.
* Later, add a satisfying coin sound and light haptic feedback when mobile support exists.

Do not implement this now. Do not change the reward amount, add sound, add haptics, or modify TypeScript for this backlog item yet.

## Scope Guardrails

Do not add storage, machines, workers, research, new crops, sound, haptics, daily rewards, monetization, or new gameplay systems unless explicitly requested.
