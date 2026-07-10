# Bloomstead Executive Product and Design Review

## Review status

- Status: Active review reference
- Review date: July 10, 2026
- Source: Executive product and design review
- Owner: Project management
- Planning effect: Advisory until reconciled with the active roadmap
- Owner reconciliation: Approved July 10, 2026; decisions recorded in this document, canonical roadmap transfer pending
- Valid until: Completion of the next formal product/design review
- Canonical execution source: Project roadmap/backlog
- Retrieval rule: Consult during the current review cycle. Do not treat as current guidance after it is superseded.

## Source classification

- Input type: Executive product and design review
- Not a developer completion report
- Not direct player feedback
- Not an implementation specification
- Not authorization to make code or asset changes
- Not a request to restart the current sprint

This review arrived unexpectedly after the onboarding and physical-production-landmark work was committed, deployed, and validated. It is being absorbed as strategic planning input without reclassifying that completed work as failed or expanding it after the fact.

## Executive assessment

Bloomstead has a coherent and technically credible MVP loop. Planting, harvesting, orders, production, expansion, offline progress, save/load, and mobile portrait layout work together. The physical Mill and Bakery landmarks materially improve the farm's sense of place.

The current build is a functional vertical slice and an MVP playtest candidate, not yet a complete cozy mobile product. Its largest remaining questions concern first-session clarity, emotional identity, intended progression depth, and measurable player response. The next planning focus should improve or measure the existing experience before adding crops, machines, currencies, or major systems.

Recommendations in this document remain advisory until they receive a disposition in the canonical roadmap/backlog. Speculative concerns are not recorded as confirmed player problems.

## Evidence snapshot

The assessment was reconciled against the repository and deployed state at commit `b9dba4e` (`Improve onboarding and add production landmarks`). At intake:

- `main` was clean and the landmark/onboarding commit was deployed.
- Live deployment QA had passed at `390x844` and `360x740` with no new console or asset-loading errors.
- Physical Mill and Bakery landmarks, focused production windows, production batching, ready indicators, save compatibility, and offline production were validated.
- The moss-green Farm Guide, persistent level-up acknowledgement, and Production outside-tap guidance were validated.
- Level 2 is configured at 10 XP, while each harvested Sunwheat grants 1 XP and the tutorial requires harvesting all 12 starter plots.
- Unlocked seed-selector buttons show crop names but not seed costs.
- The HUD shows total XP, not progress toward the next threshold.
- Tutorial copy contains one use of `gold` even though the game calls the currency `coins` elsewhere.
- `MVP_BACKLOG.md`, `MVP_PLAYTEST_CHECKLIST.md`, and `ART_AUDIO_DIRECTION.md` contain stale compact-Craft-button descriptions that predate physical landmarks.
- The existing Vite large-chunk warning remains accepted for MVP playtesting.

## Impact on active development

### Current state

There is no unfinished implementation sprint to interrupt. The onboarding and physical-landmark work is committed, pushed, deployed, and live-validated. The next expected activity was natural player evaluation followed by a reassessment of tutorial simplification and progression work.

### Work that should continue unchanged

- Preserve the deployed physical Mill and Bakery landmarks.
- Preserve focused, building-specific Production windows.
- Preserve keyed production saves, legacy compatibility, batching, partial collection, and offline progress.
- Preserve the distinct Farm Guide and persistent level-up acknowledgement presentation.
- Preserve current mobile QA sizes and the clean-build requirement.
- Continue using small, scoped tasks and evidence-based follow-ups.
- Continue withholding new crops, machines, currencies, daily systems, and large feature additions.

### Current work that satisfies part of the review

- Physical production landmarks address part of the request for visible progression and place-making.
- Farm Guide styling and persistent unlock acknowledgements improve onboarding communication.
- Generated crop/good icons, order sources, reward feedback, and staged audio provide a functional presentation baseline.
- Focused manual QA and save-compatibility validation provide a strong technical playtest foundation.
- The post-tutorial next-unlock guidance already creates a lightweight progression spine through Level 5, though it does not yet provide a complete milestone plan.

### Current work that may conflict with the review

No deployed implementation must be reverted. The confirmed conflict is planning/documentation drift: several documents still instruct future work around a compact Craft button that no longer exists.

The persistent level-up acknowledgement is correct in isolation but exposes an older progression issue: Level 2 can arrive after the tenth starter harvest, interrupting the required 12-plot harvest lesson. This is not a failure of the acknowledgement implementation; it is a sequencing dependency that became more visible once level-up information became persistent.

### Proposed additions that can wait until the next planning cycle

- Representative vertical-slice quality target.
- Post-tutorial milestone spine refinement.
- Emotional/fantasy anchor exploration.
- Authored audio identity and provenance pass.
- Mobile-alpha lifecycle and accessibility matrix.
- Evidence-based economy and pacing review.
- Automated regression coverage expansion.

### Immediate blocker that justifies interrupting active work

There is no active coding task to interrupt. Before recruiting observed first-session playtesters, the Level 2/tutorial-harvest sequencing issue should receive an explicit design decision and a focused implementation/QA task. It is a confirmed first-session interruption, not merely a speculative quality preference.

Seed-cost visibility and the `gold`/`coins` inconsistency are required pre-playtest clarity work, but they are not independent blockers equivalent to the Level 2 interruption. The compact XP-progress display is an approved small clarity improvement for the same Playtest Candidate gate. These changes may be implemented together only while the scope remains narrow and each behavior is independently validated.

### Owner decisions recorded

#### Level 2 sequencing

- Level 2 requires 15 XP instead of 10 XP.
- Harvesting all 12 tutorial Sunwheat leaves a fresh player at Level 1 with 12 XP.
- Completing Sunwheat Sack grants 5 XP, raises the player to 17 XP, and triggers Level 2 after the first order.
- Preserve the existing persistent level-up acknowledgement. Do not add a deferred or temporary notification system.
- Existing saves at Level 2 or higher must never lose a level after the threshold changes.
- The implementation must make farm-level progression monotonic or provide an equivalent safe normalization. Current `addFarmXp()` recomputes level solely from total XP, so an older Level 2 save with 10-14 XP could otherwise downgrade on its next XP gain.

#### Economy and XP clarity

- Show seed cost on every unlocked seed button while preserving level requirements on locked buttons.
- Give brief, non-blocking insufficient-coins feedback when planting cannot proceed.
- An unsuccessful planting attempt changes no plot, selected seed, inventory, or coin balance.
- Change the tutorial's single use of `gold` to `coins`.
- Before maximum level, show total XP and the next threshold in a compact form such as `XP: 17 / 30`.
- At maximum MVP level, use concise wording such as `XP: 150 - Max Level`, adjusted only as needed for mobile fit.
- Do not add a seed inventory, shop, purchasing modal, storage system, progression screen, or new economy mechanic.

#### Target player and session

Target players are mobile players who enjoy cozy farming, light idle progression, short planning sessions, and satisfying collection loops, but who do not require hardcore management complexity. Do not add unsupported demographic assumptions.

Working first-session research targets:

- Complete the tutorial in approximately 5-7 minutes without facilitator intervention.
- Reach Level 3 or produce the first Bread within approximately 10-15 minutes.
- Village Feast and Level 5 need not occur in every first session.
- The player should understand what they could pursue next before ending the session.

These are research targets, not final balance commitments.

#### Playtest Candidate release criteria

Observed external sessions may begin when:

- The Level 2 interruption is resolved.
- Seed prices are visible and insufficient-coins feedback is understandable.
- Currency wording is consistent.
- XP-to-next-level progress is readable.
- Fresh-save QA passes at `390x844` and `360x740`.
- Production, orders, saves, offline progress, and physical landmarks remain intact.
- No new console or required-asset errors are introduced.

Initial directional product-validation signals for 5-8 participants:

- At least 80% complete the tutorial without corrective facilitator intervention.
- At least 80% can explain the plant-harvest-order-production loop afterward.
- Median clarity and perceived coziness are at least 4 out of 5.
- A majority express interest in continuing beyond the observed session.
- Repeated material confusion is recorded as follow-up work.
- Participant statements, facilitator observations, timing data, and PM interpretation remain separate.

These signals are directional gates, not statistically conclusive metrics.

#### Strategy and emotional anchor

- The current MVP strategy target is approximately `3-4/10`.
- The longer-term product direction may still aim for `6/10`, but no systems should be added merely to reach that number before playtesting.
- Observe crop selection, order prioritization, plot use, and production scheduling to judge current planning depth.
- Revisit the long-term strategy target at the next formal design review.
- For the Playtest Candidate, add no guide character, mascot, villager system, or new art pipeline. Preserve the physical Mill and Bakery and let the current environment and magical naming carry the prototype.
- For the Vertical Slice, the representative visual target may compare one lightweight guide, mascot, or villager-portrait concept, but no character implementation is scheduled before that target is reviewed.

## Finding classification

### Immediate blockers

| Finding | Assessment | Required disposition |
| --- | --- | --- |
| Level 2 interrupts the starter harvest lesson | Confirmed from current thresholds and crop XP. The only immediate pre-playtest blocker. | Raise Level 2 to 15 XP with monotonic save compatibility, then run focused fresh-save and old-save QA. |

### Required pre-playtest clarity work

| Finding | Assessment | Required disposition |
| --- | --- | --- |
| Seed spending is not priced on unlocked seed buttons | Confirmed. Players can see coins decrease but cannot compare seed costs before planting. | Show metadata-derived costs and provide non-blocking insufficient-coins planting feedback. |
| Tutorial says `gold` while the game uses `coins` | Confirmed single-copy inconsistency. | Change the copy to `coins` in the approved clarity pass. |

These are required for the Playtest Candidate gate but are not independent blockers equivalent to the Level 2 interruption.

### Approved small clarity improvement

| Finding | Assessment | Required disposition |
| --- | --- | --- |
| HUD does not show the next XP threshold | Confirmed. The HUD currently shows total XP only. | Add compact current/next-threshold wording and a concise max-level state. |

### Documentation hygiene

| Finding | Assessment | Required disposition |
| --- | --- | --- |
| Canonical planning documents still describe a compact Craft button | Confirmed documentation drift after physical landmarks shipped. | Correct in a separate documentation-only task before future production-related coder work. Not a player-facing release blocker. |

### Improvements compatible with current work

| Finding | Assessment | Disposition |
| --- | --- | --- |
| Show progress toward the next level | Compatible with the existing HUD and centralized level thresholds. | Approved for the first-session clarity pass with compact mobile wording. |
| Clarify ready-at-building versus collected inventory | Ready bubbles, chips, and the goods strip already address part of this. | Await playtest evidence before expanding UI. |
| Simplify the guided Mill tutorial | Existing candidate: remove the forced second job and dedicated close lesson if safe for old tutorial saves. | Reassess after first-session playtesting or combine only if sequencing evidence supports it. |
| Correct stale Craft-button documentation | Documentation-only and does not affect saves or gameplay. | Update canonical docs after roadmap reconciliation. |

### Candidates for the next planning cycle

- Apply the approved Playtest Candidate clarity and sequencing pass.
- Run a measured first-load audit under throttled mobile conditions.
- Prepare the facilitator worksheet using the approved directional gates.
- Conduct observed sessions with approximately 5-8 target players.
- Produce one representative vertical-slice visual target.
- Refine the post-tutorial milestone spine using existing content.
- Establish art/audio provenance records and a mobile-quality acceptance matrix.

### Remaining items requiring later design decisions

- Return cadence beyond the first observed session.
- The exact long-term meaning of strategy level `6/10` after player evidence exists.
- The Vertical Slice emotional anchor and whether a lightweight character cue improves the approved quality target.
- The evidence threshold for advancing from Vertical Slice to Mobile Alpha.

### Long-term considerations

- Authored and normalized audio identity.
- Safe areas, lifecycle behavior, accessibility, and offline startup expectations before a Capacitor wrapper.
- Automated regression coverage for saves, offline progress, tutorial transitions, order gating, production batches, and reward duplication.
- Privacy, analytics, store compliance, and release readiness during Mobile Alpha planning.
- A future mine scene remains a separate post-MVP concept and is not pulled forward by this review.

### Recommendations rejected or deferred

- Reject adding animals, storage limits, workers, new crops, machines, currencies, daily rewards, monetization, a town map, or relationship systems to answer current quality gaps.
- Defer a mobile wrapper until the Mobile Alpha gate and lifecycle matrix exist.
- Defer a full character-art pipeline until a representative visual target is approved.
- Defer balance changes based only on the 5.7-minute automated run.
- Defer a full art replacement; establish one quality-bar screen first.
- Reject treating this review as authority to restart the current sprint or invalidate completed landmark/onboarding work.

## Recommendations already satisfied

- Coherent planting, harvesting, order, production, and expansion loop.
- Three-crop MVP scope and restrained production chain.
- Save/load and offline crop/production progress.
- Mobile usability at `390x844` and `360x740`.
- Physical Mill and Bakery landmarks.
- Focused production interfaces and active/ready status routing.
- Persistent unlock acknowledgement and distinct Farm Guide presentation.
- Level-aware orders through the Level 5 Village Feast milestone.
- Production batches and partial-ready collection.
- Basic particles, feedback, icons, music/SFX controls, and staged audio.
- Stable live deployment with no observed required-asset failures or new console errors.

These strengths should not generate duplicate roadmap tasks.

## Findings requiring playtest evidence

Do not schedule corrective implementation solely from these hypotheses:

- When the experience first becomes enjoyable.
- Whether planting and harvesting remain satisfying beyond onboarding.
- Whether orders create meaningful choices rather than checklist completion.
- Whether players perceive Bloomstead as cozy and magical.
- Whether players perceive meaningful planning at the current `3-4/10` MVP strategy target.
- Whether ready production versus collected inventory causes confusion.
- Whether the guided second Mill job helps learning or feels tedious.
- Whether players want to continue after Level 3 or Level 5.
- Whether Bread-heavy order clusters or Baker's Basket rewards distort decisions.
- Whether current Level 3-5 pacing supports the intended session length.

The observed-playtest report should distinguish participant statements, facilitator observations, timing data, and PM inference.

## Proposed roadmap reconciliation

The existing `MVP_BACKLOG.md` is primarily an implementation-history and stabilization record rather than a phased execution roadmap. Do not rewrite it wholesale during this intake. At the next planning checkpoint, minimally map unresolved work into these phases:

### Phase 1: Playtest Candidate

1. **P0 - Resolve first-session Level 2 sequencing with save compatibility.**
   - Raise Level 2 to 15 XP, preserve the persistent acknowledgement, and ensure existing Level 2+ saves never downgrade.
2. **P0 - Show seed prices and insufficient-coins feedback.**
   - Use existing crop metadata; preserve locked-button level wording and all failed-planting state.
3. **P0 - Correct `gold` to `coins`.**
   - Change only the confirmed tutorial copy.
4. **P0 - Show compact progress toward the next farm level.**
   - Show total XP and the next threshold before Level 5, with a concise max-level state.
5. **P0 - Run fresh-save mobile QA.**
   - Validate the complete clarity pass at `390x844` and `360x740`, plus existing saves and unchanged production/order/offline behavior.
6. **P0 - Correct stale physical-production documentation.**
   - In a separate documentation-only task, remove compact Craft-button assumptions before future production-related coder work.
7. **P0 - Audit initial mobile loading.**
   - Measure throttled conditions before proposing compression, deferred music, or bundle targets.
8. **P0 - Prepare the facilitator worksheet.**
   - Separate participant statements, observations, timings, ratings, and PM interpretations.
9. **P0 - Run the observed 5-8-player playtest.**
   - Use the approved target player, session targets, release criteria, and directional validation signals.

### Phase 2: Vertical Slice

1. **P1 - Establish one representative visual quality target.**
2. **P1 - Explore stronger environmental and magical identity.**
3. **P1 - Compare an optional lightweight guide, mascot, or villager cue in the quality target without scheduling implementation.**
4. **P1 - Refine the post-tutorial milestone spine using existing content.**
5. **P1 - Rebalance progression only from defined session targets and playtest evidence.**
6. **P1 - Plan authored audio identity and provenance.**

### Phase 3: Mobile Alpha

1. Define the device, safe-area, lifecycle, audio-interruption, and offline-startup matrix.
2. Define the accessibility strategy and canvas limitations.
3. Expand automated regression coverage.
4. Establish analytics, privacy, asset-license, store-compliance, and release-readiness requirements.
5. Begin wrapper work only after these acceptance criteria are approved.

Priority labels above are proposed. They become canonical only after owner approval and transfer into the active roadmap/backlog.

## Product inconsistency dispositions

| Inconsistency | Classification | Next action |
| --- | --- | --- |
| Current strategy depth was previously labeled `6/10` | Owner decision recorded | Use `3-4/10` for the MVP, preserve `6/10` only as a possible longer-term direction, and test current decisions with players. |
| Level 2 interrupts harvesting | Confirmed implementation issue | Raise Level 2 to 15 XP with monotonic save compatibility before observed first-session testing. |
| Seed purchasing lacks visible prices | Confirmed required clarity work | Show costs and non-blocking insufficient-coins feedback before playtest. |
| Docs still describe compact Craft button | Documentation correction | Update backlog, playtest checklist, and art/audio direction after reconciliation. |
| Limited place-making, character presence, and magic | Quality target, not confirmed blocker | Explore during representative vertical-slice design. |
| Level 5 pacing lacks a final session target | Research target recorded | Do not require Level 5 in every first session; evaluate pacing against the 5-7 and 10-15 minute working targets. |
| Correctness checklist outweighs enjoyment research | Planning gap | Add a facilitator/research worksheet before observed sessions. |
| No character presence may weaken coziness | Owner direction plus later evidence | Add no character for the Playtest Candidate; compare an optional lightweight cue only in the Vertical Slice quality target. |
| Browser-to-mobile lifecycle phase is undefined | Roadmap foundation | Add during Mobile Alpha planning, not current implementation. |

## Dependencies and proposed sequence

1. Owner decisions for target player, session targets, release criteria, Level 2 sequencing, economy clarity, XP display, strategy depth, and emotional anchor are recorded in this review.
2. Implement the approved first-session clarity pass without expanding gameplay systems.
3. Perform fresh-save and old-save QA at `390x844` and `360x740`; preserve farm levels, save compatibility, production, orders, and offline behavior.
4. Complete a documentation-only correction for stale Craft-button references.
5. Measure throttled first-load performance without changing assets.
6. Prepare a facilitator worksheet and research capture format.
7. Run 5-8 observed playtests.
8. Reconcile findings into the canonical roadmap.
9. Choose Vertical Slice work from evidence rather than implementing the entire executive proposal.

No feature-expansion work should bypass this sequence merely because it appears in the review.

## Current-cycle usage

- Consult this document when preparing first-session changes, playtests, art direction, progression planning, or mobile-quality work.
- Use only unresolved findings at regular checkpoints; do not reprocess the entire review for every task.
- Keep implementation assignments in the canonical roadmap/backlog and normal coder-prompt workflow.
- Link accepted roadmap tasks back to the relevant finding in this review.
- Allow direct player evidence and implementation results to replace assumptions recorded here.
- Give each recommendation one status: accepted, rejected, deferred, already satisfied, awaiting evidence, or replaced by newer evidence.

## Sunset process

At the next formal product/design review:

1. Transfer accepted unfinished work into the canonical roadmap.
2. Give every unresolved recommendation a final disposition: Accepted, Rejected, Deferred, Already satisfied, or Replaced by newer evidence.
3. Create the next dated review document.
4. Change this document's status to `Superseded`.
5. Record the superseding review date and replacement document near the top.
6. Remove this document from current planning indexes and routine PM lookup lists.
7. Stop using it for current decisions.
8. Retain it only as historical context for earlier decisions.

Superseded reviews must not remain active instructions for ordinary planning.

## Intake outcome

The executive review has been safely absorbed without restarting development, invalidating completed work, or turning every recommendation into an assignment. One confirmed first-session sequencing issue and several small clarity/documentation concerns are proposed for reconciliation before observed playtesting. Larger visual, audio, progression, mobile, and validation proposals remain staged behind evidence and owner decisions.
