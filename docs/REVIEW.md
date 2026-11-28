# Starlight Hollow — progress review, 28 November 2026

An honest assessment after iteration 28: what is genuinely good, what is still weak, and a scorecard by discipline. Scores are 1–10 and judged for a children's game first — a 9 in engineering does not mean a 9 for a six-year-old.

## Snapshot

| Measure | Value |
| --- | --- |
| Code | 17,520 lines across 42 source modules, vanilla JavaScript + Three.js, Vite build |
| Tests | 92 passing in 13 files; pure-rules modules separated from art and DOM |
| Content | 7 places (meadow hub + 6 themed), 29 learning signs, 13 keepsakes, 2 tool-gated doors, 6 workshop ornaments, 4 market gifts, 1 unlockable second world |
| Save | One versioned local key, sanitised migration, previous-checkpoint fallback |
| Platforms | Windows beta published; web dev build; Android not built |
| Docs | AGENTS.md conventions, design reference, 28-iteration history, changelog, roadmap |

## Scorecard

| # | Discipline | Score | Why |
| --- | --- | --- | --- |
| 1 | Moment-to-moment feel and controls | **7** | Coyote time, jump buffer, soft island edges, forgiving aim, wide suction cone, four input paths; still no sprint, ledge grab or camera character |
| 2 | World and level design | **6** | Six distinct biomes and a hub that visibly grows; islands are flat pads with sparse set-dressing, little verticality or interior space |
| 3 | Art direction and visual polish | **7** | Cohesive palettes, authored geometry, no placeholder shapes, readable silhouettes; flat-shaded low-poly is charming but modest, and props repeat |
| 4 | Audio, music and voice | **6** | Original synthesised score per zone, good feedback sounds; speech is OS text-to-speech, so warmth and phonics accuracy vary by machine |
| 5 | Characters and story | **6** | Pip, Momo and the Star Tree have real charm and a proper ending; characters barely perform, humour is light, Pip rarely surprises you |
| 6 | Educational design — learning through play | **7** | Learning sits in the world, wrong answers never punish, hints arrive; most encounters are still "zap the right answer" boards, few use knowledge on the environment |
| 7 | Early-reading curriculum depth | **7** | Letter names, sounds, blending, rhymes, syllables, word and simple sentence reading; no decodable texts, letter formation or systematic phonics sequence |
| 8 | Early-maths curriculum depth | **6** | Counting, quantity, order, addition and subtraction; no telling time, money, measurement, place value or 2D/3D shapes |
| 9 | Progression, rewards and retention | **8** | Sparkles → market, Starberries, 13 keepsakes, garden → arbor → moon phases, staged hub growth, grotto, ornaments, a world unlocked by real wishes — layered and legible |
| 10 | Accessibility and inclusion | **7** | Spoken-first design, calm motion, unlimited retries, per-subject difficulty, four devices; no text scaling, colour-blind palettes or caption settings for sound cues |
| 11 | UX, HUD and onboarding | **7** | Clear chips, device-aware legends, first-use teaching, capped toasts; some panels still assume reading, HUD is busy at 1280×720 |
| 12 | Technical engineering and reliability | **8** | Pure rules modules, sanitised saves, checkpoint fallback, 92 tests, documented invariants; not profiled on low-end hardware |
| 13 | Content volume and variety | **5** | 29 signs and five compact islands run dry for a returning child; creatures are decorative more than interactive |
| 14 | Platform readiness | **5** | Windows beta is real and downloadable; Android is absent and touch has never been device-tested; controller untested on hardware |
| 15 | Social features — co-op, profiles, dashboard | **2** | Local two-player, separate child profiles and a full parent dashboard are designed but not built; only a pause-screen grown-up panel exists |
| 16 | Safety, privacy and ethics | **9** | Offline, no accounts, no ads, no purchases, no timers or streaks, no data collection, local saves — exemplary for the age group |
| 17 | Originality and identity | **7** | Original places, creature names, Lantern Hollow, the moon-carving arbor and keepsake shelf; the loop still borrows openly from its inspirations |
| 18 | Documentation and process | **9** | Every system has written invariants, an iteration log and evidence; unusually disciplined for a solo project |
| | **Overall, for a 5–7-year-old** | **7/10** | A calm, beautiful, genuinely kind game a child can play alone; it needs more *doing* with knowledge and more things to discover before it becomes a favourite |

## Top 10 things that are working

1. **A real second world behind a real condition.** Lantern Hollow is reached by walking through a sleeping arch that wakes on a wish the save already tracks — proven to fire once, stay unlocked and stay silent on revisit.
2. **Keepsakes reward wandering.** Thirteen hidden finds with no prompts, a shelf in the meadow, cairns on each island, and a grotto that only opens at thirteen.
3. **The garden → arbor → moon loop.** Every wish visibly carves the moon; the arbor never refuses a gift, so a child's basket can never fill with nowhere to go.
4. **The meadow grows.** Lanterns, pennants, pavers and fireflies appear as finds accumulate, so the hub itself is a progress bar you can walk around.
5. **Spoken-first design.** Every instruction is voiced, so a non-reader can play without an adult.
6. **Gentleness as a mechanic.** No failure, no loss, unlimited retries, hints that arrive by themselves, wrong answers that quietly narrow to two choices.
7. **Four input paths with device-aware legends**, plus assisted aim and a 7.5 m suction cone.
8. **Calm motion that genuinely stills things**, including animations already running when it is turned on.
9. **Engineering discipline.** Pure data/rules modules, sanitised saves with migration, 92 tests and written invariants for every system.
10. **Ethical design.** Offline, no ads, no purchases, no accounts, no manipulative loops — rare and valuable for this audience.

## Top 10 things still weak

1. **Most learning is still a board you zap.** The signs are well made, but knowledge is rarely *used* on the world (open a door by reading, count stones to cross a stream).
2. **The voice is the biggest risk.** OS text-to-speech can mispronounce phonics and sounds robotic; for a pre-reader, the voice *is* the teacher.
3. **Thin content for repeat play.** 29 signs across five islands is a weekend, not a childhood favourite.
4. **Flat, sparse islands.** Circular pads, little verticality, few interiors or landmark set-pieces.
5. **Creatures are scenery.** Puffkins and Grumbleweeds are charming but rarely do anything a child can interact with beyond a giggle.
6. **Maths is narrow.** No time, money, measurement, place value or shape work — and telling time was promised in the design.
7. **No co-op, profiles or full dashboard.** A sibling cannot join, and a parent gets one pause panel.
8. **Android is unbuilt and touch is untested on a real device**, which matters for "today's youth".
9. **Visual repetition.** The same tree, rock and grass families appear everywhere; lighting is simple and there are few moments of spectacle.
10. **Some UI still assumes reading**, and the HUD is dense for a five-year-old navigating by picture.

## Highest-leverage next steps

1. Publish the current source and a fresh Windows build so the beta matches the game.
2. Replace critical instructions with recorded (or higher-quality) voice, at least for phonics.
3. Add three *environmental* learning puzzles per island: read to open, count to build, sequence to light — the same curriculum, applied to the world.
4. Build the Android package and test touch on a real tablet.
5. Add local co-op drop-in (second controller / split touch) before adding more signs.

## Verdict

Starlight Hollow is already a place a six-year-old can be safe, curious and independent in, and it looks and sounds like itself. It is not yet a game they will beg to return to: the world needs more to *do* with what they know, more creature personality, and a stronger voice. The foundation — engineering, ethics, art direction, progression — is strong enough that those are content problems, not rewrites.
