# Continuation Guide

Use this file as the starting point in a new ChatGPT session.

## Start here

Continue the existing Haneul Video Lab project.

Official production site:

https://korean-video-lab.vercel.app/

This is an independent project. Do not merge it with Haneul K-Drama Interactive or unrelated products.

## Mandatory first checks

Before making changes:

1. read `AGENTS.md`
2. read `docs/PROJECT_RULES.md`
3. read `docs/CURRENT_STATE.md`
4. inspect the current repository contents
5. inspect the existing Vercel project and live production URL

Use current code and production state as the source of truth.

## Current unresolved item

The most concrete known issue at the time of this handoff is transcript quality for:

`wns9Ro1Nkb0` — Ordering at a Korean Restaurant · Survival Phrases

Its caption endpoint can return English text where Korean cue text is expected.

If working on captions or catalog quality, inspect this first.

## Deployment requirement

If changes are deployed:

- use the existing `korean-video-lab` Vercel project
- preserve `https://korean-video-lab.vercel.app/`
- verify the live production site after deployment
- do not report success before production verification

## Design requirement

Current UI is approved.

Do not redesign it unless explicitly requested.


## Alignment audit continuation note — 2026-09-12

The Ready catalog was audited one-by-one structurally. See `docs/VIDEO_ALIGNMENT_AUDIT.md`.

Current production:
- Alignment V5.5
- 43 Ready videos
- Supermarket Korean (`paToZla2CK8`) has a dedicated sync profile
- Intermediate Listening Ep. 1 (`NRcXaIUcEak`) was removed from Ready because no usable Korean transcript is currently returned

Do not claim all 43 remaining videos are acoustically word-perfect. Server-side YouTube media extraction is blocked by bot/login protection in the current environment, so the durable audit is structural rather than acoustic.

If a user reports a specific video audibly leading or lagging:
1. treat that playback report as stronger evidence than structural metrics
2. inspect that video's row in `docs/VIDEO_ALIGNMENT_AUDIT.md`
3. add a video-specific timing profile rather than changing the global curve
4. re-verify production and keep unaffected videos unchanged


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


## SCALE V1 — Durable admission batch 1 — 2026-09-12

Quality-gated the remaining non-durable catalog candidates in small batches.

Durably promoted after clean PASS results plus existing curated manual-ready status:
- `9rgKP4igcmk` — 달려라 예지 · Intermediate Short Story — PASS 100
- `KMBYFe55isQ` — 신축치고 월세가 싸요 · Housing Story — PASS 100
- `Ux-TMWnmntM` — Natural Korean Conversation with 태웅쌤 — PASS 100
- `DI0lxAx1dwo` — Traditional Tea House Date · Korean Vlog — PASS 100
- `ypK89NqZvAg` — 무슨 옷을 입을까요? · What Should I Wear? — PASS 100

Still excluded:
- `Yz1R55Opwwg` — FAIL: provider-no-korean-track
- `mIBkzUdEXoQ` — FAIL: provider-no-korean-track
- `TLgAJgYqIZk` — FAIL: provider-no-korean-track
- `tZCeGRDmUdY` — FAIL: too_few_cues
- `WFy6o--cocI` — REVIEW 52: korean_ratio_borderline, heavy_padding, rolling_overlap, many_long_cues
- `_vt-tr4fnWg` — REVIEW 88: many_long_cues

Clean PASS but not yet durably promoted because they lacked prior manual-ready status and still require a real playback sanity check:
- `Eo2I6voTVnA` — PASS 100
- `g1Eaa3g-25U` — PASS 100
- `cWcbK176lQs` — PASS 100

Known previously excluded candidates remain excluded:
- `rj2j3Tes8q0` — provider-no-korean-track
- `NRcXaIUcEak` — provider-no-korean-track
- `wns9Ro1Nkb0` — earlier transcript-language failure; do not re-admit without fresh verification

Durable Ready count is now 48.

Production:
- GitHub promotion commit: `b1cd64589e12f5261d5106f37bd1aefac07c39e6`
- Vercel deployment: `dpl_2pTLUcG8a1rpLZbM6A6T4mf6XbzL`
- stable URL preserved: https://korean-video-lab.vercel.app/
- homepage verified HTTP 200 with 48 Ready IDs
- known-good `8rvv4RXQYb4` captions verified at 81 cues
- quality endpoint re-verified on promoted candidate `9rgKP4igcmk` → PASS 100
- no error/fatal runtime logs observed after deployment

Next safe step:
- playback-check the three clean PASS-but-not-manual-ready candidates before durable promotion
- manually review the two REVIEW candidates before any admission
- do not reintroduce FAIL candidates unless their Korean transcript availability materially changes


## SCALE V1 — Pending playback verification — 2026-09-12

Production API verification completed for the three clean PASS candidates that are not yet durably admitted:

- `Eo2I6voTVnA` — 230 Korean cues, provider-freetranscriptapi, English meaning path healthy
- `g1Eaa3g-25U` — 372 Korean cues, provider-freetranscriptapi, English meaning path healthy
- `cWcbK176lQs` — 52 Korean cues, provider-freetranscriptapi, English meaning path healthy

All three previously returned quality `PASS 100`.

They remain outside `VERIFIED_READY` because the final promotion rule requires a real playback sanity check for audio/caption timing. GitHub + Vercel API checks can verify transcript structure, Korean content, translations, routes, and deployment health, but they cannot prove real audio-to-caption sync.

Do not promote these three until playback confirms:
- cue entry timing is acceptable
- sentence switching follows speech
- word highlighting is not materially early/late
- English meaning renders normally

Current durable Ready count remains 48.


## Candidate playback verification mode — 2026-09-14

A hidden deep-link was added to finish the SCALE V1 playback gate without exposing unverified candidates in Browse:

`https://korean-video-lab.vercel.app/?verify=<videoId>`

Use it for the five currently excluded review candidates:
- clean PASS awaiting acoustic check: `Eo2I6voTVnA`, `g1Eaa3g-25U`, `cWcbK176lQs`
- structural REVIEW: `WFy6o--cocI`, `_vt-tr4fnWg`

Do not promote a clean PASS candidate until real playback confirms:
- cue entry timing follows the spoken line
- sentence switching follows speech
- highlighted word is not materially early/late
- English meaning renders normally

The verification query does not change `VERIFIED_READY`; durable Ready remains 48.

Production deployment: `dpl_J1KSQ4Vst7RtPePM21cKbvU9sKfE`
GitHub implementation commit: `a208e804075c425b146f9edc53a7bb5fd207fa84`


## Word Sync V2 continuation — 2026-09-14

Playback feedback for `Eo2I6voTVnA` established that the speaker was roughly two words ahead of the highlighted token.

Current production fix:
- deployment `dpl_6xWtZSXYh3MaMBiTNJsg3PTPFi57`
- exact `cue.words[]` timing is preferred when available
- JSON3 segment offsets are preserved by the caption backend
- `Eo2I6voTVnA` has a video-specific calibrated highlight advance (about 1.85 median-word durations, clamped 420–760 ms)
- caption cache key is now `cv=9`
- no global timing changes were made

Do not call this true acoustic forced alignment while the active FreeTranscriptAPI response only provides cue-level timestamps. If later playback still reports a consistent lead/lag, calibrate this video-specific profile rather than changing Baby/Mina or the global curve.


## Word Sync V2.1 continuation — 2026-09-14

Playback revealed a separate sentence-boundary lag on `Eo2I6voTVnA`: the word highlighter was advanced, but `findCue()` still waited for raw transcript timestamps.

Current behavior:
- shared calibrated clock drives both word highlight and sentence handoff
- only near-contiguous cues (gap <=260 ms) may switch early
- handoff lead is capped at 680 ms
- real pauses stay intact
- change is isolated to `Eo2I6voTVnA`

Production deployment: `dpl_DLLQXjNi3Bz582H7VPdxYSfk7TYP`.


## Word Sync V3 source-timing switch — 2026-09-14

Playback on `Eo2I6voTVnA` showed inconsistent intra-sentence behavior: some highlighted words ran ahead of speech while other spoken words ran ahead of the highlight. This proves a fixed timing offset is not sufficient for this video's variable speech rate.

Repo changes completed:
- `api/captions.js` now supports a caption-source override for verification
- `Eo2I6voTVnA` now prefers the YouTube Korean JSON3 caption track before FreeTranscriptAPI
- YouTube JSON3 segment offsets are preserved as timed `words[]` tokens
- when a cue has matching timed `words[]`, the frontend bypasses manual word and statement timing compensation
- manual V2.x calibration remains only as fallback if the timed YouTube source is unavailable
- UI marker prepared as `WORD SYNC V3`

Commits:
- `2ad46d0` — Add caption source verification override
- `a90d901` — Prefer segment-timed YouTube captions for calibration video
- `144e5c8` — Bypass manual timing compensation for segment-timed cues

Deployment blocker:
- Vercel rejected the next production deployment because the project/account reached the free API deployment limit (`api-deployments-free-per-day`, 100/100 used)
- current live production therefore remains V2.3 deployment `dpl_Fw9QA1kMS8qw5dQcvAm4z8zDzNCi`
- do not claim Word Sync V3 is live until a later production deployment succeeds and the target video's YouTube-timed response is verified
