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
