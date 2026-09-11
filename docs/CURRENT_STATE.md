# Current State

Last durable verification captured: 2026-09-11.

## Production

Official URL:

https://korean-video-lab.vercel.app/

Vercel project:

- name: `korean-video-lab`
- project ID: `prj_KXwOs8YsAKgQvcKJrcWdRywB9Zgf`
- team ID: `team_2qP7AnUVZ2NnshuJiNVh464v`
- current production deployment: `dpl_AdYX6UCjeAkgu48MYhiBQNWBfgDc`
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

The gate has now been expanded to **44 verified Ready videos** after transcript-quality checks.

Current Ready distribution:

- Beginner: 21
- Lower Intermediate: 14
- Intermediate: 9

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
