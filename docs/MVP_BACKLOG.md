# MVP Backlog

## Current MVP Gameplay

Bloomstead currently starts new games and Dev Reset saves with 100 coins.

The MVP includes:

* Planting, crop growth, harvesting, inventory, coins, XP, and farm levels.
* Three crops: Sunwheat, Carrot, and Glowberry.
* A 3x4 starting crop bed with rectangular plot upgrades to 4x4, 5x4, and 6x4.
* Level-aware order availability:
  * Level 1 orders should only require Sunwheat.
  * Level 2 orders may require Sunwheat and Carrot, plus the Flour order.
  * Level 3+ orders may use any MVP crop.
* Crop selling as a fallback way to regain seed money.
* Readable crop sell/inventory rows for each MVP crop.
* First production building: the Mill.
  * Recipe: `2 Sunwheat -> 1 Flour`.
  * Production time: 15 seconds.
  * Flour is stored as a processed good.
  * Flour is not plantable.
  * Mill production continues offline.
  * Finished Mill production loads as ready but does not auto-collect.
  * Farm screen production uses a compact `Craft` button.
  * Full production details live in the `Production` menu.
  * Farm screen production status uses compact chips only while a job is producing or ready.
  * Idle production systems should not take farm-screen space.
  * Tapping a production status chip opens the `Production` menu.
  * Tapping outside the `Production` menu closes it.
* Harvest-to-inventory feedback when crops are collected.
* Order completion coin/XP fly-to-HUD reward feedback.
* Swipe harvesting aggregate `Gathered X Crop` text to reduce clutter.
* Save/load, active order persistence, and offline crop growth.
* Tutorial flow with a sell-crop step after the first plot upgrade.
* One-time 75 coin tutorial completion reward with basic reward feedback.

Current MVP orders include Baker's Flour:

* Requires: 2 Flour.
* Rewards: 90 coins and 20 XP.
* Gated at farm level 2.

## Tutorial Notes

The tutorial should teach the core loop in this order: welcome, plant Sunwheat, wait for crop, harvest, complete an order, buy the first plot upgrade, sell a crop, then complete the tutorial.

The final tutorial completion reward is 75 coins and must only be granted once per save. Dev Reset clears the save, so the reward can be earned again from a fresh start.

## Implemented MVP UI / Game Feel Polish

The following polish items are implemented for the MVP:

* Crop sell/inventory rows now use readable crop names and counts, such as `Sunwheat x7` with `Sell +4c`.
* Harvested crops show visual feedback moving toward the crop inventory/sell area.
* Order completion now includes coin and XP fly-to-HUD reward feedback.
* Swipe harvesting now uses aggregate `Gathered X Crop` text instead of many separate `+1 Crop` popups.
* The tutorial `Complete` button now has basic reward juice for the one-time 75 coin reward, including reward text, generated coin fly feedback, and a coin HUD pulse.

## UI / Art Polish Backlog

The current crop sell/inventory rows are readable and functional for MVP, but they are still text-only.

In a future UI/art polish pass, consider replacing or augmenting text rows with small crop icons and a more polished row layout:

* `Sunwheat x7 - Sell +4c`
* `Carrot x0 - Sell +12c`
* `Glowberry x0 - Sell +32c`

Future Mill production polish:

* The old full-width Mill farm-screen panel was replaced by the compact Craft button, Production menu, and status chip pattern.
* Use this Production menu/status chip pattern for future systems such as Bakery, Press, Brewery, etc.
* Give the Craft button/icon proper art so it reads clearly as production/crafting.
* Polish production status chips with clearer visuals and icons.
* Replace placeholder Mill/menu visuals with clear Mill building/UI art.
* Give Flour a readable icon for inventory, orders, and production output.
* Add SFX hooks/assets for Mill start, production complete, and Flour collect.
* Future production chains may expand from the Mill pattern, but should stay simple and modular.

* Later, add a satisfying coin sound and light haptic feedback when mobile support exists.

## Scope Guardrails

Do not add storage, additional machines, workers, research, new crops, sound assets, haptics, daily rewards, monetization, or new gameplay systems unless explicitly requested.
