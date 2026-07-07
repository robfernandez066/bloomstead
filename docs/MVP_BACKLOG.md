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
  * Level 3+ orders may use any MVP crop, plus the Bread order.
* Crop selling as a fallback way to regain seed money.
* Readable crop sell/inventory rows for each MVP crop.
* MVP production buildings:
  * Mill: `2 Sunwheat -> 1 Flour`, 15 seconds.
  * Bakery: `2 Flour -> 1 Bread`, 30 seconds.
  * Flour and Bread are processed goods, not plantable crops.
  * Production state is keyed by building/system id, currently `mill` and `bakery`.
  * Mill and Bakery can run independently at the same time.
  * Older single-Mill production saves migrate into the keyed production state.
  * Production continues offline.
  * Finished production loads as ready but does not auto-collect.
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
* Tutorial flow that starts automatically on new saves and Dev Reset, with a sell-crop step after the first plot upgrade.
* One-time 75 coin tutorial completion reward with basic reward feedback.
* Craft guidance that appears through the tutorial/onboarding UI when Craft becomes relevant.

Current MVP processed-good orders:

* Baker's Flour: requires 2 Flour, rewards 90 coins and 20 XP, gated at farm level 2.
* Fresh Bread: requires 1 Bread, rewards 130 coins and 30 XP, gated at farm level 3.

## Tutorial Notes

The tutorial starts automatically on new saves and Dev Reset. The old tutorial `Start` button has been removed.

The tutorial should teach the core loop in this order: welcome, plant Sunwheat, wait for crop, harvest, complete an order, buy the first plot upgrade, sell a crop, then complete the tutorial.

The final tutorial completion reward is 75 coins and must only be granted once per save. Dev Reset clears the save, so the reward can be earned again from a fresh start.

Tutorial and hint guidance should be unified: only one tutorial/hint message should be visible at a time.

After the main tutorial is complete, Craft guidance appears through the tutorial/onboarding panel when Craft becomes relevant: farm level 2 or enough Sunwheat to start the Mill. The message guides the player to use Craft to turn Sunwheat into Flour. The Craft button is highlighted while this guidance is active, and opening Craft completes/dismisses the guidance. Tutorial completion reward behavior remains unchanged.

## MVP Stabilization Notes

Recent focused QA passes have verified the current tutorial, production, save/load, mobile usability, and legacy production migration behavior for MVP.

Verified behavior:

* Tutorial guidance auto-starts on new saves and Dev Reset.
* The old tutorial `Start` button has been removed.
* Only one tutorial/hint panel should be visible at a time.
* Craft guidance appears after the main tutorial is complete, at farm level 2 or when Craft first becomes relevant.
* Craft guidance uses the tutorial/onboarding panel, highlights Craft, teaches `Sunwheat -> Flour`, and completes when Craft opens.
* Mill and Bakery production work independently and can run at the same time.
* Offline finished production loads as ready and does not auto-collect.
* Older single-Mill saves migrate safely into keyed production state under `mill`, with `bakery` initialized normally.
* Mobile portrait QA passed at `390x844` and `360x740`.

Current caveats:

* Sell rows and production chips are compact and functional for MVP, but still need future art/UI polish.
* Landscape layout is not ideal, but the UI recovers when returning to portrait.

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

Future production polish:

* The old full-width Mill farm-screen panel was replaced by the compact Craft button, Production menu, and status chip pattern.
* Use this Production menu/status chip pattern for future systems such as Bakery, Press, Brewery, etc.
* Give the Craft button/icon proper art so it reads clearly as production/crafting.
* Add a stronger visual pointer or arrow for Craft if playtesting shows the highlight is not enough.
* Polish production status chips with clearer visuals and icons.
* Replace placeholder Mill/Bakery/menu visuals with clear production building/UI art.
* Give Flour and Bread readable icons for inventory, orders, and production output.
* Improve processed-good and order onboarding later if Flour/Bread order goals are not obvious enough.
* Add SFX hooks/assets for Mill/Bakery start, production complete, and collect.
* Future production chains may expand from this pattern, but should stay simple and modular.

* Later, add a satisfying coin sound and light haptic feedback when mobile support exists.

## Scope Guardrails

Do not add storage, additional machines, workers, research, new crops, sound assets, haptics, daily rewards, monetization, or new gameplay systems unless explicitly requested.
