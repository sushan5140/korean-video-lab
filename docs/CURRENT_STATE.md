# Current State

Last durable verification captured: 2026-09-12.

## Production

Official URL:

https://korean-video-lab.vercel.app/

Vercel project:

- name: `korean-video-lab`
- project ID: `prj_KXwOs8YsAKgQvcKJrcWdRywB9Zgf`
- team ID: `team_2qP7AnUVZ2NnshuJiNVh464v`
- current production deployment: `dpl_8xjCcwsEHGpZ9oTNmVi5c6oZdK6f`
- production domain preserved

The current production build was verified READY after the catalog-scaling recovery.

## Repository source status

The repository now contains a deployable production baseline:

- `index.html` — current production frontend
- `api/captions.js`
- `api/meaning.js`
- `api/meanings.js`
- `api/semantic.js`

`app/index.html` remains as the earlier production snapshot path but the root `index.html` is now the canonical deployable frontend.

## Catalog scaling recovery

The live frontend contains 60 curated candidates.

Previously a hard-coded `VERIFIED_READY` gate exposed only 13 lessons even though many more candidates had already been prepared.

The durable Ready gate now contains **48 verified Ready videos** after the SCALE V1 admission batch.

Current Ready distribution:

- Beginner: 21
- Lower Intermediate: 16
- Intermediate: 11

The UI keeps the existing level-filter behavior, so the default Beginner view shows 21 Ready lessons and the other Ready lessons are available through the level filters.

## Transcript pipeline

The rebuilt caption route uses:

1. FreeTranscriptAPI with `lang=ko`
2. a Hangul-content quality gate
3. Vercel CDN caching
4. fallback to the older YouTube caption parser when the provider is unavailable or throttled

The anonymous FreeTranscriptAPI tier is rate limited, so bulk verification must not brute-force large batches. Previously verified results should be cached/reused and uncertain/rate-limited candidates should remain pending.

The known bad candidate `wns9Ro1Nkb0` is **not** in the Ready set because its earlier transcript response contained English where Korean cues were expected.

## Live verification

After deployment:

- production homepage returned HTTP 200
- title: `Haneul Video Lab`
- Ready gate parsed as 44 IDs
- `/api/meaning` returned a valid English translation
- `8rvv4RXQYb4` returned 81 Korean caption cues with strong Hangul content
- `Gy_nMwa51nY` returned 197 Korean caption cues with strong Hangul content

## Semantic layer

The original server semantic source could not be recovered from the old deployment.

A deterministic transcript-grounded replacement is now committed for the response modes the frontend expects. The frontend already contains local fallback logic for practice and explanation behavior.

## Rules

Do not mass-audit the remaining candidate videos in one burst.

For future catalog expansion:

- validate in small batches
- reuse cached successful results
- treat rate limiting as pending, never as rejection
- reject transcripts that are not genuinely Korean
- do not expose a candidate as Ready until transcript quality is verified


## Alignment V4 — 2026-09-11

The live player now uses Alignment V4 for finer word-following inside each caption cue.

Changes:
- Korean token timing is weighted more heavily by actual Korean syllable count.
- punctuation receives small pause weighting.
- cue-edge silence is trimmed more conservatively.
- the current spoken word now has progressive fill during its estimated spoken duration.
- already-spoken words remain subtly marked so the learner can follow the sentence path.

English caption startup was also improved:
- the first 16 meanings are prefetched first.
- the rest continue loading in the background.
- video-card hover/pointer warmup now starts caption + English preparation before opening the lesson.
- translated meanings are cached in localStorage per video for faster repeat visits.
- the bulk translation route now uses up to 8 workers instead of 4.

Production deployment:
- `dpl_8LNVMpKtnpW5yGos4hfopQzNZBKT`
- stable URL preserved: https://korean-video-lab.vercel.app/
- 44 Ready lessons preserved
- known-good caption test returned 81 cues
- production error/fatal scan was clean after deployment


## Alignment V4.1 — 2026-09-11

User feedback changed the spoken-word highlight behavior:

- progressive left-to-right fill inside a word was removed
- the entire active word now highlights instantly for its estimated spoken duration
- previously spoken words remain subtly marked

Initial English caption startup was also adjusted:

- first-line English is prepared during the transcript loading phase
- the synced caption view waits briefly for the first translation batch instead of immediately showing “Getting English meaning…”
- repeat visits still reuse per-video local translation cache
- remaining meanings continue in the background after startup

Production deployment:
- `dpl_D3YWuRBxj69AzV1xruumqUgPMixP`
- stable URL preserved
- 44 Ready lessons preserved
- production verification passed with 81 known-good caption cues
- no error/fatal runtime logs observed after deployment


## Alignment V5.1 — 2026-09-11

The spoken-word estimator was tightened again after user feedback.

Changes:
- duplicate `spokenHTML()` renderer was removed
- cue start/end remain the hard timing anchors
- estimated Korean speech duration now uses Hangul-unit count, token count and punctuation
- excess caption tail time is trimmed instead of stretching the final highlighted word through silence
- no extra native-anchor network request is made during lesson open

A native YouTube JSON3 sub-segment anchor experiment was tested and removed from production because the tested Korean lessons did not expose usable caption-track anchors through the public watch-page path.

### Grok / xAI alignment path

xAI Speech-to-Text can return word-level timestamps and supports Korean. This is the preferred future path for near-forced alignment.

Requirements before enabling it:
- a direct audio file or direct audio-file URL for each lesson
- an `XAI_API_KEY` configured server-side

Do not use a text-only Grok prompt to guess word timing. The useful xAI path is Speech-to-Text over the real audio.

Current YouTube iframe playback does not itself expose a reusable direct audio file URL to the application, so Grok STT is not yet wired into production.

Production deployment:
- `dpl_Bsimfh8fAAoQ9a3fpkHvg5qLLqdQ`
- stable URL preserved: https://korean-video-lab.vercel.app/
- 44 Ready lessons preserved
- known-good caption test returned 81 cues
- English meaning endpoint verified
- no error/fatal runtime logs observed after deployment


## Alignment V5.2 — 2026-09-11

Fixed a concrete early-highlight bug:

- previous `spokenIndex()` forced the first word active even when playback had not reached the first estimated word onset
- it now returns no active word before that onset
- estimated word starts use a positive acoustic-onset guard instead of subtracting lead time
- current default onset guard is ~86 ms, with per-video overrides available in `timingProfile()`
- first-word cue lead-in is also slightly delayed

Production deployment:
- `dpl_FDvuxJM4fdYeTiaXkXSgdHZC8hD7`
- stable URL preserved
- 44 Ready lessons preserved
- caption route verified with 81 cues
- no error/fatal runtime logs observed after deployment

Groq note:
- Vercel currently exposes a valid `GROQ_API_KEY`
- it authenticates successfully against Groq
- it is not an xAI/Grok key
- Groq Whisper is a viable future source of real Korean word timestamps once a real media/audio file URL is available


## Alignment V5.3 — 2026-09-11

User feedback showed the estimated word highlight was still roughly two words ahead on a problematic lesson.

Changes:
- added an adaptive cue-level highlight lag based on average estimated word duration
- default lag is about 1.65 average word durations
- lag is clamped between ~170 ms and 520 ms
- per-video lag-word overrides are available in `timingProfile()`
- this affects highlight display timing only; caption cue timing and replay seeking remain unchanged

Production deployment:
- `dpl_DujZaoYir8yAPrfw1Aq3QVmTiDtu`
- stable URL preserved
- 44 Ready lessons preserved
- known-good caption route verified with 81 cues
- no error/fatal runtime logs observed after deployment


## Alignment V5.4 — 2026-09-11

Fixed a clock mismatch between captions and word highlighting:

- V5.3 delayed word highlighting but caption cue selection still used raw transcript timestamps
- caption cue selection now applies a display lag (~460 ms default)
- per-video cue-lag overrides are available
- manual Next/Replay briefly holds the selected cue so the delayed clock does not snap back immediately after seeking
- word highlight timing and caption switching now advance on compatible delayed timelines

Production deployment:
- `dpl_2YfZrkgh9pUtoNy4ZPe9KuJKqHqk`
- stable URL preserved
- 44 Ready lessons preserved
- known-good caption route verified with 81 cues
- no error/fatal runtime logs observed after deployment


## Full Ready-video alignment audit + Alignment V5.5 — 2026-09-12

A one-by-one structural timing audit was run across all 44 videos that were in the Ready gate at scan time.

Audit artifact:
- `docs/VIDEO_ALIGNMENT_AUDIT.md`
- 44/44 Ready entries scanned
- metrics included cue count, cue overlap, long cue-window ratio, median milliseconds per Korean unit, and conflicts between caption switching and Haneul's own word-timing model

Important limitation:
- YouTube blocked server-side media extraction with bot/login protection across the playback clients tested.
- Therefore this audit is a cue-structure + Haneul timing audit, not a claim of true acoustic word-onset verification for every lesson.
- User playback feedback remains required evidence for cases where transcript timestamps are globally shifted against audio.

Confirmed findings:
- `paToZla2CK8` Supermarket Korean is user-confirmed misaligned and structurally uses slower/padded cue timing (~627 ms per Korean unit versus ~408 ms for Traditional Market Shopping).
- Supermarket now has its own V5.5 timing profile: later cue display, later word onset, and extra highlight lag.
- `NRcXaIUcEak` Intermediate Listening Ep. 1 currently returns no usable Korean transcript and was removed from the Ready gate.

Current Ready count:
- 43

Production deployment:
- `dpl_G3bDnXYbBctxQyKXaGz9Aa5arZKQ`
- stable URL preserved: https://korean-video-lab.vercel.app/
- `ALIGNMENT V5.5` live
- known-good caption test returned 81 cues
- temporary audit/probe routes removed from production
- no error/fatal runtime logs observed after deployment


## Trusted Baby/Mina alignment restored globally — 2026-09-12

User clarified that the desired reference is the original alignment behavior from:
- Learn Korean Like a Baby (`in58DVfmxug`)
- Mina Slow Korean (`kHsEZUcyD7c`)

The original pre-generalization alignment engine was recovered from commit `8c90187826a77653b77567d2bf7474c8d97884bb` and restored as the global alignment model.

Removed:
- global caption display lag
- adaptive multi-word lag compensation
- supermarket-only giant delay profile
- manual cue-hold logic tied to delayed caption clocks

Restored:
- raw transcript cue switching via original `findCue()`
- original Baby/Mina timing profiles
- original default weighted word distribution model
- current-word-only highlight behavior

Current production:
- marker: `ALIGNMENT TRUSTED`
- deployment: `dpl_AzPwiq9Edquhx77QuCFVMmQUKGko`
- stable URL preserved
- 43 Ready lessons
- caption endpoint verified with 81 cues
- no error/fatal runtime logs observed after deployment

This trusted engine is now the baseline. Future timing work should compare against Baby/Mina and should not reintroduce broad artificial lag layers unless explicitly justified.


## Level-aware trusted alignment — 2026-09-12

User feedback showed that Beginner lessons felt acceptable with the restored Baby/Mina engine, while Lower Intermediate and Intermediate lessons drifted badly because faster speech was still being stretched across full caption windows.

Changes:
- Beginner keeps the original Baby/Mina trusted alignment unchanged.
- Lower Intermediate uses a denser/faster speech envelope (target ~230 ms per Korean unit, smaller minimum word duration).
- Intermediate uses an even faster envelope (target ~205 ms per Korean unit, smaller minimum word duration).
- Higher levels cap long subtitle windows instead of stretching every highlighted word through the whole cue.
- Raw transcript cue switching remains unchanged; no broad artificial caption delay was reintroduced.

Production:
- marker: `ALIGNMENT TRUSTED L2`
- deployment: `dpl_4eR9ejwMQfmvFGWfVg8g6MTqCsV6`
- stable URL preserved
- 43 Ready lessons
- caption endpoint verified healthy after deployment
- no error/fatal runtime logs observed


## Padded-cue alignment model — 2026-09-12

User supplied screenshots comparing:
- `p5kMoLahPa4` 10 Short Conversations
- `02HTENb9KGg` My Daily Routine
- `EMUpahrg1Dg` Rainy Season

The screenshots exposed the real failure mode: some higher-level caption cues open well before the sentence is actually spoken. The previous L2 model compressed these long cues from the left edge, which could keep the highlight too early.

Alignment Trusted L3 now:
- keeps Beginner Baby/Mina behavior unchanged
- keeps raw cue selection unchanged
- estimates a natural higher-level speech envelope
- detects only heavily padded higher-level cues (raw span exceeds estimated envelope by >950 ms)
- right-anchors the spoken-word envelope toward the cue end/next boundary
- leaves tight cues such as the shown Rainy Season line untouched

Full Ready-catalog padding audit:
- 43 Ready videos scanned
- 22 videos contained at least one heavily padded higher-level cue
- 1,778 heavy-padding cues detected
- 10 Short Conversations: 107 / 292 cues (36.6%)
- Daily Routine Vlog: 42 / 121 cues (34.7%)
- Rainy Season: 126 / 847 cues (14.9%), but the screenshot cue itself remains below the heavy-padding threshold and is not shifted

Production:
- marker: `ALIGNMENT TRUSTED L3`
- deployment: `dpl_DH3kt4amDmJ4eCcAdcgJkj4pLRNN`
- stable URL preserved
- temporary `/api/padding-audit` route removed
- captions verified healthy
- no error/fatal runtime logs observed


## Review V1 — English preload, review memory, Smart Replay — 2026-09-12

Implemented the next learning layer without redesigning the approved UI.

### English preload
- current visible cue now gets priority over whole-video translation
- `meaningFor()` no longer waits for the bulk translation job
- initial loading identifies the actual current cue and requests it directly
- nearby cues are prefetched in a rolling window (previous 1 + next 6)
- full-video translations still continue in the background
- translations persist in the existing per-video local cache
- Google Translate remains primary
- Groq is now a server-side fallback using the configured `GROQ_API_KEY`
- single-line production verification: `안녕하세요` → `Hello` via `groq-fallback`

### Personal review memory
Existing replay/practice memory was expanded.

Cue review signals now include:
- repeated replays
- practice retries / completions
- Explain usage
- pinned phrases
- saved words
- stolen sentence patterns

These signals feed the existing Smart Rewatch ranking so the review queue reflects actual learner friction and interest rather than generic recommendations.

### Smart Replay
The main Replay control now cycles on repeated presses for the same cue:

1. Normal
2. Slow 0.8x
3. Korean only / no English
4. Shadow

Changing cue resets the sequence. Practice-specific replay buttons remain plain replay controls so existing practice flows are not disrupted.

### Production
- marker: `ALIGNMENT TRUSTED L3 · REVIEW V1`
- deployment: `dpl_G3VYV2WfumHbEAbqcWUjhjX5UgYz`
- stable URL preserved: https://korean-video-lab.vercel.app/
- 43 Ready lessons preserved
- known-good caption test: 81 cues
- current-line translation endpoint verified HTTP 200 through Groq fallback
- no error/fatal runtime logs observed after deployment

Verification boundary:
- Smart Replay and review signal logic were verified in deployed source/build, but not exhaustively browser-click-tested across every lesson.
- batch Groq fallback for `/api/meanings` is deployed but was not independently POST-tested through the Vercel connector.


## Review V2 — Scene-grounded Micro Lessons — 2026-09-12

Micro Lessons were upgraded from generic section picks into scene-grounded teaching moments.

### Backend
- `api/semantic.js` now uses Groq for Micro Lesson enrichment when `GROQ_API_KEY` is available.
- Groq output is constrained to transcript cue indexes and validated.
- Each lesson can include:
  - `anchorCue`
  - contextual `startCue` / `endCue`
  - title / why
  - exact Korean pattern
  - concise English meaning
  - when-to-use note
  - fresh Korean example + English translation
  - up to 3 focus tags
- AI picks are normalized into approximately 12–60 second contextual scenes around the anchor.
- Deterministic transcript-grounded fallback remains if Groq fails.

Production smoke test succeeded with source `groq-transcript-grounded` and 5 lessons.
Example verified outputs included:
- `안녕하세요` → “Hello”
- `성함이 어떻게 되세요?` → “What is your name?”
- each expanded into a surrounding scene rather than a single isolated cue.

### Frontend
- Micro Lesson cache version bumped to `haneulMicro:v2`.
- Micro cards now show the actual pattern, meaning, usage note, and optional fresh example.
- “Study scene” jumps to the exact anchor cue.
- “Mark reviewed” persists locally via `haneulMicroReviewed:v1`.
- reviewing a Micro Lesson feeds personal review memory and pattern mastery.
- Micro Lesson interaction now contributes to Smart Rewatch ranking.

### Production
- marker: `ALIGNMENT TRUSTED L3 · REVIEW V2`
- clean deployment: `dpl_p1MPSWDuu6i3QAh8i8P1mXEpyBW2`
- stable URL preserved: https://korean-video-lab.vercel.app/
- 43 Ready lessons preserved
- known-good captions verified with 81 cues
- temporary `/api/micro-smoke` route removed (404)
- no error/fatal runtime logs observed after deployment

Verification boundary:
- Groq Micro Lesson generation was end-to-end smoke-tested on a real transcript.
- UI source/build was verified, but not exhaustively browser-click-tested across every lesson.


## Content Quality Gate + Scaling baseline — 2026-09-12

Implemented `api/quality.js` as the automated admission gate for new video candidates.

Gate outcomes:
- `PASS` — automated checks are healthy; one short playback sanity check still required before promotion
- `REVIEW` — transcript works but timing structure is risky; human playback verification required
- `FAIL` — do not promote to Ready

Checks currently include:
- usable Korean transcript
- cue count
- Hangul ratio
- cue overlap percentage
- long cue percentage
- heavy-padding ratio
- median milliseconds per Korean unit
- sampled English translation health

English verification uses the existing `/api/meanings` path with Google primary + Groq fallback.

Production calibration:
- `8rvv4RXQYb4` Self-introduction → PASS 100
- `paToZla2CK8` Supermarket Korean → REVIEW 88 (`heavy_padding`)
- `NRcXaIUcEak` broken Intermediate Listening → FAIL (`provider-no-korean-track`)
- `x031U15y6_U` 40-min Intermediate Podcast → PASS 100
- `6Y7VwFR5cDg` 1-hour Natural Conversation → REVIEW 88 (`rolling_overlap`)

Durable workflow documentation:
- `docs/CONTENT_PIPELINE.md`

Production deployment:
- `dpl_5WPbrwEm8iHDcNw7ZfQmeXp1Fw7g`
- stable URL preserved
- learner UI unchanged
- quality gate is server-side and candidate-admission-only; it is not called on normal browse/page load

Important boundary:
- this gate is structural, not acoustic forced alignment
- REVIEW videos require human playback verification before promotion
- never promote candidates only because the caption endpoint returns HTTP 200


## SCALE V1 — Content Quality Gate + conservative auto-admission — 2026-09-12

A server-side admission gate now protects the Ready catalog.

### Quality gate
Endpoint:
- `GET /api/quality?videoId=<id>&level=<level>`
- `POST /api/quality` for small batches

Checks include:
- usable Korean transcript
- cue count / transcript coverage
- Hangul ratio
- cue overlap / rolling-caption risk
- long cue-window ratio
- heavy padded-cue risk using level-aware timing expectations
- English meaning health using the existing translation stack

Gate result:
- `PASS`
- `REVIEW`
- `FAIL`

The response includes a numeric score, fail/review/pass reasons, transcript metrics, translation health, caption source, and timestamp.

Verified examples:
- `8rvv4RXQYb4` Self-introduction → `PASS`, score 100
- `rj2j3Tes8q0` known bad candidate → `FAIL`, reason `provider-no-korean-track`

### Learner catalog behavior
- Existing 43 manually verified Ready lessons remain grandfathered and are never demoted by this new runtime gate.
- Checking candidates can be tested automatically.
- Only two unchecked candidates per selected level are probed in one browser session to protect transcript-provider limits.
- A candidate must return `PASS` with score >= 82 to become Ready in that browser session.
- PASS results are cached locally for 7 days.
- REVIEW and FAIL candidates remain hidden from the learner feed.
- Feed status can show how many lessons were auto-qualified.

### Production
- marker: `ALIGNMENT TRUSTED L3 · SCALE V1`
- deployment: `dpl_s7ZYsmAyFW7r9rW3aMTrfgBQjr4S`
- stable URL preserved: https://korean-video-lab.vercel.app/
- 43 grandfathered Ready lessons preserved
- known-good caption smoke test: 81 cues
- no error/fatal runtime logs observed after deployment

Operational rule:
- Do not mass-audit all candidates on every page load.
- Keep runtime admission conservative and low-volume.
- For large catalog expansion, run explicit small-batch quality checks and persist approved IDs into the durable Ready set after human review when appropriate.


## Candidate playback verification mode — 2026-09-14

The pending SCALE V1 review boundary has been preserved without promoting unverified lessons.

A hidden production-only verification entry point is now available through:
- `/?verify=<videoId>`

Behavior:
- accepts only candidates already present in the curated catalog
- opens the candidate directly in the existing approved lesson player
- does not add the candidate to `VERIFIED_READY`
- does not expose a new learner-facing browse card or redesign the UI
- shows a short verification-mode toast so manual reviewers know the lesson is not promoted

Pending clean PASS candidates still awaiting real acoustic playback confirmation:
- `Eo2I6voTVnA` — PASS 100
- `g1Eaa3g-25U` — PASS 100
- `cWcbK176lQs` — PASS 100

Manual-review candidates remain excluded:
- `WFy6o--cocI` — REVIEW 52
- `_vt-tr4fnWg` — REVIEW 88

Deployment:
- GitHub commit: `a208e804075c425b146f9edc53a7bb5fd207fa84`
- production deployment: `dpl_J1KSQ4Vst7RtPePM21cKbvU9sKfE`
- stable URL preserved: https://korean-video-lab.vercel.app/
- known-good caption smoke test: 81 cues
- hidden verification code confirmed in production source
- no runtime errors observed in the post-deploy scan

Durable Ready count remains 48. No candidate was promoted without acoustic playback evidence.


## Word Sync V2 calibration — 2026-09-14

User playback verification on pending candidate `Eo2I6voTVnA` showed the spoken audio running about two words ahead of the highlighted word.

Implemented:
- caption cues now preserve a `words[]` timing array whenever an upstream source exposes real word/segment timestamps
- YouTube JSON3 fallback now preserves segment offsets and converts them into timed Korean word tokens
- the frontend prefers exact `words[]` timing when the timed-token count matches the visible Korean token count
- estimated timing remains the fallback when the current provider only supplies cue-level timestamps
- `Eo2I6voTVnA` received a video-specific calibrated display advance of about 1.85 median-word durations, clamped to 420–760 ms
- trusted Baby/Mina behavior and the global alignment model were left unchanged
- caption cache version bumped from `cv=8` to `cv=9`

Important boundary:
- FreeTranscriptAPI currently returns cue-level `text/start/duration`, not true word timestamps, so `Eo2I6voTVnA` still uses the calibrated fallback rather than acoustic forced alignment
- exact word timestamps will be used automatically if a future caption source supplies them

Production:
- deployment: `dpl_6xWtZSXYh3MaMBiTNJsg3PTPFi57`
- stable URL preserved: https://korean-video-lab.vercel.app/
- marker: `WORD SYNC V2`
- candidate quality gate remains PASS 100
- no runtime errors observed after deployment


## Word Sync V2.1 sentence handoff — 2026-09-14

User playback feedback on `Eo2I6voTVnA` showed that word highlighting could be corrected while sentence changes still waited on the raw cue timestamp.

Fix:
- added a shared calibrated clock via `cueClockAdvanceMs()`
- `spokenIndex()` and cue switching now use the same lesson-specific timing advance
- for `Eo2I6voTVnA`, adjacent cues hand off early when their raw gap is <=260 ms
- early handoff is capped at 680 ms
- larger real pauses are preserved; the app does not skip them
- global Baby/Mina and other lesson timing remains unchanged

Production:
- marker: `WORD SYNC V2.1`
- deployment: `dpl_DLLQXjNi3Bz582H7VPdxYSfk7TYP`
- stable URL preserved
- `Eo2I6voTVnA` captions healthy at 230 cues
- no runtime errors observed after deployment


## Word Sync V2.2 micro word-boundary calibration — 2026-09-14

User playback feedback on `Eo2I6voTVnA` found a remaining small intra-sentence lag: the speaker could begin the next word while the previous token was still highlighted.

Fix:
- added a lesson-specific `wordBoundaryLead: 110` ms
- this extra lead applies only to per-word highlighting, not sentence handoff
- exact upstream word timestamps, when available, bypass this compensation
- global timing and trusted reference videos remain unchanged

Production:
- marker: `WORD SYNC V2.2`
- deployment: `dpl_6vyG3tdxJ3obgGobFS9H99PMQt5D`
- stable URL preserved
- no runtime errors observed after deployment


## Word Sync V2.3 statement-boundary calibration — 2026-09-14

Further playback feedback on `Eo2I6voTVnA` showed a remaining delay when a new statement begins.

Fix:
- added `statementBoundaryLead: 170` ms for this lesson
- statement handoff advance may now reach 850 ms instead of the previous 680 ms cap
- near-contiguous cue allowance widened from 260 ms to 360 ms
- per-word 110 ms boundary lead remains unchanged
- calibration remains isolated to `Eo2I6voTVnA`; global timing stays untouched

Production:
- marker: `WORD SYNC V2.3`
- deployment: `dpl_Fw9QA1kMS8qw5dQcvAm4z8zDzNCi`
- no runtime errors observed after deployment


## Word Sync V3.1 syllable-paced fallback — 2026-09-16

User playback requirement: a tiny millisecond mismatch is acceptable, but the highlight must not visibly trail or lead by a whole word.

Production verification showed the target video `Eo2I6voTVnA` has no usable Korean YouTube caption track (`no-caption-track`), so Word Sync V3 correctly falls back to FreeTranscriptAPI cue-level timestamps.

The previous fallback used a strongly concave word-weight curve plus a large whole-word advance. That could make long Korean words advance too quickly while short words linger too long, producing alternating early/late behavior inside the same sentence.

V3.1 changes for `Eo2I6voTVnA` only:
- token pacing is now near-linear by Korean syllable count (`power: .96`)
- per-token base weight reduced to `.16`
- punctuation timing reduced so sentence-final punctuation does not artificially hold the last word
- removed the right-anchored natural-envelope profile for this lesson
- cue tail trimmed by up to 90 ms
- fallback clock lead reduced from roughly 420–760 ms to 70–165 ms
- extra word-boundary lead reduced from 110 ms to 28 ms
- statement-boundary lead reduced to 72 ms, capped at 255 ms
- exact timed `words[]`, if ever available, still bypass all fallback compensation
- Baby/Mina and other lessons remain untouched

Production:
- marker: `WORD SYNC V3.1`
- deployment: `dpl_ATNhJ1Ac18LNtPC45Vajx2cSioAK`
- stable URL: https://korean-video-lab.vercel.app/
- frontend syntax verification passed
- no runtime errors observed after deployment


## SCALE playback milestone closed — 2026-09-16

Final production audit after Word Sync V3.1:

- `Eo2I6voTVnA` — PASS 100, 230 cues, Hangul ratio 0.998, overlap 0, long-cue ratio 0.387, heavy-padding ratio 0.713, median 296 ms/unit, English translation 5/5 healthy
- `g1Eaa3g-25U` — PASS 100, 372 cues, Hangul ratio 0.998, overlap 0, long-cue ratio 0, heavy-padding ratio 0.167, median 262 ms/unit, English translation 5/5 healthy
- `cWcbK176lQs` — PASS 100, 52 cues, Hangul ratio 1.000, overlap 0, long-cue ratio 0.058, heavy-padding ratio 0.442, median 250 ms/unit, English translation 5/5 healthy

Acoustic verdict:
- none of the three has a true upstream word-timestamp source
- YouTube Korean JSON3 returned no usable caption track for these candidates
- experimental Groq Whisper alignment was tested but YouTube exposed only ciphered media URLs and Groq rejected a normal YouTube watch URL as non-media
- the public Whisper probe route was removed after testing to avoid accidental paid transcription calls
- therefore no candidate is promoted solely from structural PASS 100

Promotion result:
- promoted in this milestone: 0
- durable Ready count remains 48
- all three candidates remain in playback verification until real listening confirms Word Sync V3.1 is not materially a full word early/late

Alignment freeze:
- Word Sync V3.1 is now the frozen fallback baseline
- accept tiny millisecond drift; reject visible full-word lead/lag
- do not add new multi-word fixed offsets
- do not change the frozen timing profile without new acoustic playback evidence or a genuine word-timestamp source

Production deployment: `dpl_D8xasJMZf6kqr7ww39AQsiAiwRxv`.


## Learning Loop V2 — 2026-09-16

Implemented the next learner-experience milestone without changing the approved Video Lab visual system or the frozen Word Sync V3.1 timing baseline.

### Cross-video Review Today
- added a new Library tab: `Review Today`
- combines repeated Smart Replay lines, practice retries, saved words, mined phrases and stolen reusable patterns into one ranked queue
- queue is deduplicated by video + cue
- up to 12 highest-value review moments are shown
- completed items can be marked `Done today` and disappear until the next local day
- reviewing a cue also advances matching saved-word review counts

### Smart Replay -> review capture
- replay signals now persist enough cue metadata to reopen the exact lesson moment later
- a cue replayed twice is automatically treated as a review candidate
- the second replay visibly confirms `added to Review Today`
- existing Normal -> Slow 0.8x -> Korean only -> Shadow replay cycle is preserved

### Sentence mining upgrade
Pinned phrases now preserve more than Korean + English:
- reusable pattern when semantic analysis has one
- pattern meaning
- previous Korean cue
- next Korean cue
- review metadata
- existing custom tags remain supported

The Library phrase card renders the mined pattern and surrounding context when available.

### Listening progress
- added persistent local listening-time tracking
- counts only while the YouTube player is actively playing inside the open lesson
- normal playback, replays and shadowing all count
- Progress now shows today minutes, total listening minutes, lessons watched and active study days

### Progress integration
The Progress tab now combines:
- active-video completion
- listening time
- cross-video Review Today summary
- Haneul Memory mastery snapshot
- Smart Rewatch for the current lesson

### Safety / stability
- Word Sync V3.1 remains frozen and unchanged
- `VERIFIED_READY` remains unchanged at 48
- no candidates were silently promoted
- quality route continues to test `cv=10`
- experimental public Whisper alignment probe was removed before this milestone

Production verification:
- deployment: `dpl_FFgcTeBdZWzNfxsNgEug53DJMW9r`
- stable URL preserved: https://korean-video-lab.vercel.app/
- Learning Loop V2 marker present in production
- `g1Eaa3g-25U` caption smoke test: 372 Korean cues, provider-freetranscriptapi
- `g1Eaa3g-25U` quality recheck: PASS 100, English translation 5/5 healthy
- no runtime errors found after deployment


## Nine-item plan merge — 2026-09-16

The earlier nine-item roadmap was merged against the stronger Learning Loop V2 implementation instead of adding duplicate/weaker versions.

### 1–3. Existing playback candidates
- `g1Eaa3g-25U`: remains playback-gated; structural quality PASS 100
- `cWcbK176lQs`: remains playback-gated; structural quality PASS 100
- `Eo2I6voTVnA`: remains review/high-risk; Word Sync V3.1 stays frozen

No one was promoted from API quality alone.

### 4. Catalog expansion
Added 11 fresh listening candidates as `checking` only. Production quality audit:

PASS 100:
- `9W4jYPAn1GY` — 141 cues
- `4rGYvyIP5sI` — 57 cues
- `k1_co9zWaUI` — 56 cues
- `so6Ej6wviQI` — 145 cues
- `eJbK2QB9XWg` — 163 cues
- `sjlTT6oVm5E` — 152 cues
- `QjjImkCnTqQ` — 120 cues

REVIEW:
- `o-X_6t45Sic` — REVIEW 88, heavy_padding
- `MHO9U-DEqoU` — REVIEW 64, heavy_padding + rolling_overlap + many_long_cues
- `sc_Ok6mX2zY` — REVIEW 88, many_long_cues

FAIL:
- `FciY1CF7uOM` — FAIL 29, korean_ratio_low; also heavy_padding + rolling_overlap + many_long_cues

All 11 remain outside `VERIFIED_READY`. The FAIL candidate must not be promoted unless its transcript source materially changes.

### 5. Smart Replay
Kept the existing Learning Loop V2 implementation because it is stronger than the older roadmap version:
- Normal -> 0.8x -> Korean only -> Shadow
- repeated lines automatically feed Review Today
- exact cue/timestamp metadata is preserved

### 6. Sentence Mining
Kept the current richer version instead of replacing it:
- Korean + English
- exact timestamp
- reusable pattern + meaning
- previous/next Korean context
- custom tags
- reopen-in-context behavior

### 7. Personalized Review V3
Upgraded Review Today to spaced scheduling:
- `Again`: returns after about 10 minutes
- `Good`: expands through 1d -> 3d -> 7d -> 14d -> 30d -> 60d -> 90d
- `Easy`: starts farther out and expands faster
- saved words on successfully reviewed cues advance their review state
- legacy V2 same-day completion remains backward compatible

### 8. Micro Lessons V3
Existing transcript-grounded Micro Lessons now reuse the best current systems:
- Listen — jump to the real anchor cue
- Practice — opens production/Say It practice on that cue
- Save pattern — routes into the existing Stolen Sentence/pattern-mining system
- Mark reviewed — keeps mastery/pattern memory integration

No parallel micro-lesson save system was created.

### 9. Progress V3
Progress now includes:
- active listening minutes today + total
- videos completed (>=90% watched)
- familiar vocabulary
- grammar/reusable patterns encountered
- active study days
- Ready-catalog progress for TOPIK 1 / TOPIK 2 / TOPIK 2+ bands

The level percentages are explicitly catalog-learning signals, not predicted TOPIK exam scores.

### Ready gate correction
`effectiveReady()` now returns true only for durable `readiness==='ready'` entries. A local/API quality PASS can no longer silently surface a candidate as Ready.

Production deployment: `dpl_8xjCcwsEHGpZ9oTNmVi5c6oZdK6f`.


## UI V2 production promotion staged — 2026-09-19

The redesigned Haneul Video Lab frontend has been promoted from `redesign-v2/index.html` to the repository root `index.html`.

Preserved:
- 48 durable Ready lessons
- 71 curated catalog entries
- production caption / meaning / semantic API routes
- trusted word-sync and learning-loop behavior
- Library, Review Today, Micro Lessons, practice modes, saved words/patterns, and learner memory

New production-root UI includes:
- onboarding-led proficiency path + learner interests
- Discover session filters for context + listening format
- Profile as the control center for proficiency, interests, daily goal, and learner memory
- AI learning analysis embedded inside Profile
- interest-weighted recommendations with a small exploration share
- responsive 5-tab mobile dock with direct Practice action

Rollback safety:
- branch `production-pre-ui-v2-2026-09-19` preserves the exact pre-promotion main state
- promotion commit: `452b9bba7142fab89d72d53995bf130e42f7cbef`

Deployment status:
- GitHub source promotion is complete
- stable Vercel production project `korean-video-lab` has NOT yet been updated because the connected Vercel deployment write action returned an internal `Tool deploy_to_vercel not found` error
- do not claim the stable production URL is on UI V2 until a new deployment is created and verified


## Beginner Context + Listening Format expansion — 2026-09-19

**Current canonical root production catalog:** 82 curated entries / 63 in `VERIFIED_READY`, of which **36 are Beginner**. These counts supersede historical counts above.

Fifteen Beginner entries added to the Ready lane: four existing checking candidates admitted and eleven new entries. Cards carry Beginner / TOPIK 1, topic arrays matched to `FILTERS.topics`, style arrays matched to `FILTERS.styles`, creator/title, ID-based YouTube thumbnail, and the existing `open()` player path.

The default unfiltered Discover feed now shows the first nine interest-weighted picks *followed by every remaining Ready lesson*, instead of hiding the rest of the expanded library. Context and listening-format filters continue to intersect and update the Ready count.

Verified the existing `/api/captions?videoId=...` endpoint for all fifteen: Korean text and increasing timed cue ranges were returned; counts and IDs are in `docs/BEGINNER_EXPANSION_2026-09-19.md`. `rj2j3Tes8q0` and `wns9Ro1Nkb0` remain checking because there was no Korean caption track; the English-dominant `FciY1CF7uOM` and `MHO9U-DEqoU` remain checking.

**QA limitation:** This was an API-level Korean-caption/timing-structure check, not a human audio playback/word-level acoustic sync audit of all fifteen. Correct YouTube playback, live caption timing vs audio, and per-line translation quality should still be confirmed by listening before treating this as full acoustic certification.

Preserve the existing root UI, login, Supabase account settings, code generator, admin AI controls, 48 previously Ready lessons and old original rollback branch.


## Beginner Context expansion — 2026-09-19 (second wave)

**Current root source state after second wave:** 124 curated videos, 105 Ready, **78 Ready Beginner**. This wave added **42 distinct Beginner videos** with caption samples checked through the stable production `/api/captions` API before admission. The previous 36 Ready Beginner and 27 other Ready lessons were retained. New videos use the existing player, caption and meaning pipeline and topic/format metadata, not a parallel learning experience.

Verified current Beginner Context distribution (tags overlap):

| Context | Ready Beginner | Additional lessons needed to reach 15 |
|---|---:|---:|
| Daily Life | 47 | 0 |
| Food | 20 | 0 |
| Travel | 14 | 1 |
| Shopping | 12 | 3 |
| School | 10 | 5 |
| Culture | 24 | 0 |
| Weather | 8 | 7 |
| Family | 9 | 6 |
| Work | 8 | 7 |
| Hobbies | 9 | 6 |

**Goal is NOT fully complete**: user requested 15–20 each context. Do not claim otherwise. Larger categories naturally exceed 20 from overlapping appropriate metadata, not fabricated duplicate videos. No random retagging to pad weak categories.

Source commits: `9d414711497e90bf7629bcee3ba35075bd7cc59f` (32), `b32de7d7edd67bc1ee5328c2c2a4b688b02a4fef` (5), `b3f7c6377baaddcfaa7057fe2d11dfcd425adaba` (2), `145949f2e39b57963829f7267f2fdc801be3eccf` (1), `a36632931233ba239d0e7366cf88dd0db39c10c7` (2).

Excluded candidate IDs with unusable captions: `7On_9gkVTyw` (Chinese), `xzIPJplbVrA`, `ez5oPNPP5oc` (Arabic), `Rn1pb4-fiRY`, `QIf7jt4_LDQ`, `tdHOW7GF11A`, `_yr6Nip3gLA`, `tgd5fyySpok`, `095jPLJRYhE`, `WHc04CACnBw` (no track). A response HTTP 200 or `ok:true` alone is not Korean-language verification.

QA limitation: first/middle samples and/or Korean cue counts with timed cues were checked via Haneul caption API. No authenticated real browser playback or human audio-to-word alignment certification of all 42 has been performed. Confirm user-reported troublesome tracks before calling them fully acoustically verified.


## Beginner Context 15+ completion — 2026-09-19

Canonical root source now has **159 curated, 140 Ready, 113 Ready Beginner** entries after 35 additional distinct Beginner YouTube IDs. Every Context filter meets the >=15 requested count; counts are based on existing `FILTERS.topics` and unique Ready video IDs, not repeated cards:

| Context | Ready Beginner |
|---|---:|
| Daily Life | 48 |
| Food | 22 |
| Travel | 15 |
| Shopping | 15 |
| School | 15 |
| Culture | 26 |
| Weather | 15 |
| Family | 16 |
| Work | 15 |
| Hobbies | 15 |

Batch IDs by primary context (35 total):
- Weather (7): `jcwnNQWy2JA`, `oNm-kSbIddE`, `L9arLZZU9iQ`, `wb0kvZjcEPk`, `lXpV1m2pDQY`, `UUKecG-oncc`, `lreeNjrEr8I`.
- Family (6): `tpnmeXH9VZ4`, `DXtkVDwsWpw`, `2xtYq0NKu3c`, `oT8u5HRkSVs`, `ZBqLqaFcBZ4`, `B0MV4MJq3M0`.
- Work (7): `7ZOH1xSdZVY`, `_496jppDCRg`, `KA4-4MVZ48c`, `VfTKyLb47Bk`, `OW2oK-5xseQ`, `gpXAY8R9d-c`, `Nq7RTeRTzc4`.
- Hobbies (6): `7Vx_ocBTXL0`, `J3U6YVpVeZs`, `Jo-tp2VgRZ4`, `Ev9Su1KME_4`, `wOAJWZjy_Z8`, `oqgYkvEqTXs`.
- School (5): `Dq53nzu4EeU`, `ptYkZZnanQg`, `vZBMdTzM7U4`, `bzt0tA7kZiQ`, `vKYGelyBLeI` (last tagged also Family because teacher–parent conversation).
- Shopping (3): `40Hmzc6yLVQ`, `tmItFF2IVAw`, `xIMZSJJin-g` (last tagged also Food).
- Travel (1): `dv-1ZdzOxlM` (also Food; hotel/taxi/restaurant dialogues).

Discovery: existing Vercel project has `YOUTUBE_API_KEY` or `GOOGLE_YOUTUBE_API_KEY` configured. The owner-authenticated long-term API route `api/youtube-discover.js` performs server-side YouTube Data API v3 search, returning public metadata without exposing the key. Temporary public whitelisted research endpoints `api/content-research.js` and `api/_curation-research.js` were deleted after use to avoid unapproved third-party YouTube API quota spend.

**IMPORTANT QA limitation:** Individual caption/quality API checks in this session returned Korean timed cues for the batch and creator/title metadata came from YouTube search; certain items returned full quality PASS. Some other items returned quality REVIEW (padding, rolling subtitle overlap), and no authenticated browser playback or full acoustic word-to-audio verification was possible for the full batch. Do not call all 35 manual playback certified. A transient caption-provider issue also returned `no-caption-track` for an older known-good Ready video `8rvv4RXQYb4` in this session: never interpret one transient quality FAIL as permanent deletion evidence. Follow up with real learner playback/translation feedback, repair/demote individual problematic lessons rather than retiming all videos globally.

Production project unchanged, Google login/admin/referral/AI features and all pre-existing Ready lessons kept. Source change `dcf355ab9ddfec5fb4b5c79b04d0af4d8ebf3c0a`.

## Catalog visibility / stale-tab repair — 2026-09-19

The user reported seeing the earlier 22-video Daily Life set despite production deployment `dpl_3FSNfmptQzwQmBq5LpPpA2R3FLWh` mapping to the 159-entry root catalog commit. Source audit independently confirms 48 distinct Ready Beginner Daily Life records and >=15 across all Context filters. The prior browser session was not available for inspection, so stale open-tab HTML is a likely explanation, not a proven root cause.

Refresh repair: the root Browse now displays live per-filter Ready counts in topic pills, fixes personalized Home selections to use canonical `readiness`, and displays a catalog refresh prompt on later production version changes when a user returns to a tab (without interrupting playback). Added a no-store manifest at `/catalog-version.json` and no-store HTML headers so a full refresh fetches current source. The source catalog and learning player are otherwise preserved. Existing old tabs need one manual hard refresh to load the new refresh detector. Do not claim full manual playback certification of the added videos.

## Lower Intermediate candidate staging — 2026-09-19

Staged 16 externally sourced Korean listening video IDs as Checking (never Ready without production caption and manual playback checks). Lower Intermediate 15 Ready / 23 Checking, Beginner unchanged; 15–20 Ready per Context is still open. Added owner-only Discover review tray and exact audit `docs/LOWER_INTERMEDIATE_EXPANSION_2026-09-19.md`. Manifest 2026-09-19-lower-intermediate-curation-v1.

## Lower Intermediate correction and blocked research — 2026-09-19

The user's explicit target is **at least 15–20 distinct, genuinely usable Lower Intermediate videos PER Context**, not 15 overall, and not merely an owner-only Checking queue. Earlier progress reporting mistakenly treated staging as fulfilment. Actual learner-facing distribution remains Daily Life 12, Food 2, Travel 2, Shopping 1, School 1, Culture 3, Weather 0, Family 0, Work 2, Hobbies 1. The goal is not met, and the user must not be told otherwise.

Follow-up production QA of the 16 staged candidates: all returned Korean timed cues and five successful sampled English translations, but **all 16 were REVIEW** (mainly long caption windows), none PASS. Real iframe playback and acoustic word timing have not been certified; no candidate was promoted to Ready. YouTube metadata research of additional topics encountered `rateLimitExceeded` on the configured YouTube Data API key. Do not continue YouTube search calls until quota/restriction is diagnosed; cannot assert new videos have been added. Both temporary public research endpoints are removed to avoid third-party quota spend, leaving the existing owner-only `api/youtube-discover.js` unchanged.

Do not pad topic counts by retagging unrelated lessons, relabel Beginner videos as Lower Intermediate, count Checking as Ready, or create duplicate video cards. Obtain full caption and playback evidence before Ready admission.

## Large Lower Intermediate discovery batch — 2026-09-19

**User target:** 15–20 genuinely usable Ready videos per Context. **Status: NOT COMPLETE.**

- Added **105 distinct externally discovered YouTube video candidates** in `data/lower-intermediate-candidates.js` to the 38 existing Lower Intermediate entries (including the original 16 staged on 2026-09-19), giving **143 curated Lower Intermediate IDs: 15 Ready + 128 Checking/Preview**.
- Every context has at least **15 unique curated candidate/Ready IDs combined**, but **this is NOT 15 Ready videos per category**. The source data/manifest preserves the distinction and the UI shows e.g. `0 Ready · 17 Preview`, never `17 Ready`.
- The new learner-visible, visually separate **More Korean to explore** section appears only on Lower Intermediate Browse, filtered by Context, format, and search. Cards are explicitly labeled Preview. Clicking runs a fresh production quality check; a missing/invalid Korean transcript blocks in-site playback; structural PASS or REVIEW allows a preview with an explicit timing/translation warning. Neither preview nor a PASS/REVIEW automatically enters VERIFIED_READY or progress level totals.
- Existing Ready lists, Beginner video counts, personalized recommendations, login, referral, player and learner memory are preserved.
- The previous owner-only review queue remains available for curator QA; source has no new credentials. Google/YouTube API rateLimitExceeded prevented a complete independent pass through all 105 videos. Metadata may be imperfect, and entries with no track remain unavailable until repaired or replaced.

| Context | Ready | Preview | Total unique IDs |
| --- | ---: | ---: | ---: |
| Daily Life | 12 | 28 | 40 |
| Food | 2 | 20 | 22 |
| Travel | 2 | 15 | 17 |
| Shopping | 1 | 14 | 15 |
| School | 1 | 16 | 17 |
| Culture | 3 | 46 | 49 |
| Weather | 0 | 17 | 17 |
| Family | 0 | 15 | 15 |
| Work | 2 | 14 | 16 |
| Hobbies | 1 | 14 | 15 |

Quality evidence: specific previous 16 staged videos returned REVIEW (not PASS) from production; spot checks on newly discovered entries found PASS (e.g. `4A3swSZkuDs`, `NwoQy9PvvE0`, `bHOrV3lAUtU`, `OR_GmRjY8WE`) and FAIL/no-Korean-track examples. This justifies click-time gating, not blanket Ready promotion. Real iframe/acoustic synchronization was not established for all candidates; review and promote only individually.

Deployment verification must check manifest, candidate JS file accessibility and that selecting the lower intermediate topics updates both counts and Explore cards. Version: `2026-09-19-lower-preview-15plus-v2`.
