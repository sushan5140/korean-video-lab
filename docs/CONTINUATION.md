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


## Word Sync V3.1 continuation — 2026-09-16

`Eo2I6voTVnA` cannot currently use YouTube JSON3 timing because production returns `no-caption-track`, so it falls back to cue-level FreeTranscriptAPI timing.

The fallback has been rebuilt to prioritize avoiding full-word mismatch rather than chasing zero-millisecond alignment:
- near-linear Korean syllable pacing
- only 70–165 ms whole-clock lead
- 28 ms additional word-boundary lead
- small 72 ms statement-boundary lead, max 255 ms
- no targetUnit/right-anchor compensation on this lesson

Production deployment: `dpl_ATNhJ1Ac18LNtPC45Vajx2cSioAK`, marker `WORD SYNC V3.1`.

Next playback criterion: accept minor millisecond drift; reject any case where the highlight remains a full word behind/ahead. If further calibration is needed, adjust token weighting or a very small boundary lead, not multi-word fixed offsets.


## Frozen alignment handoff — 2026-09-16

Word Sync V3.1 is frozen after the three-candidate production audit.

Do not promote `Eo2I6voTVnA`, `g1Eaa3g-25U`, or `cWcbK176lQs` from API quality alone. All three are PASS 100 with healthy English translation, but none currently has true word timestamps or post-V3.1 acoustic confirmation.

Risk order from structural timing evidence:
- `Eo2I6voTVnA`: highest manual-review priority because heavy-padding ratio is 0.713 and the user previously heard real sync drift
- `cWcbK176lQs`: moderate review priority because heavy-padding ratio is 0.442 despite otherwise clean structure
- `g1Eaa3g-25U`: cleanest structural candidate (0 long-cue ratio, 0.167 heavy padding), but still requires playback confirmation

Ready remains 48. Promotion requires a real listening verdict under the user-approved criterion: minor millisecond drift is acceptable; a full-word lead/lag is not.


## Learning Loop V2 continuation — 2026-09-16

Current production milestone is `WORD SYNC V3.1 · LEARNING LOOP V2`.

What is now live:
- Library -> Review Today cross-video review queue
- automatic weak-line capture after repeated Smart Replay
- richer mined-sentence metadata (pattern + surrounding context)
- persistent listening-time stats
- Review Today summary inside Progress
- existing Smart Rewatch / Haneul Memory / Micro Lessons remain intact

Important behavior:
- Review Today is local-device memory and is generated from actual learner signals
- marking an item Done today hides it for the local calendar day
- saved words on that cue receive a review increment
- repeated replays save enough cue metadata to reopen the exact timestamp later

Do not change Word Sync V3.1 as part of learner-feature work unless new acoustic playback evidence requires it.

Ready count remains 48. Candidate promotion gate is unchanged.

Production deployment: `dpl_FFgcTeBdZWzNfxsNgEug53DJMW9r`.


## Nine-plan merged continuation — 2026-09-16

Current product state after merging the older nine-item roadmap:

- Smart Replay: keep current Learning Loop V2 version
- Sentence Mining: keep current context-rich version
- Review Today: now Review V3 spaced scheduling
- Micro Lessons: Listen -> Practice -> Save pattern -> Reviewed, reusing existing practice/mining systems
- Progress: listening + completion + familiar vocab + pattern exposure + active days + level catalog progress
- catalog: 11 new checking candidates added; 7 PASS / 3 REVIEW / 1 FAIL structurally
- Ready gate: API PASS is never enough for Browse/Ready; manual playback approval is still required
- durable Ready count remains 48
- Word Sync V3.1 remains frozen

Next safe catalog work is playback verification of PASS candidates. Priority order from structural cleanliness should start with shorter/cleaner candidates, but no candidate should be promoted without a real listening verdict.

Production: `dpl_8xjCcwsEHGpZ9oTNmVi5c6oZdK6f`.


## Beginner expansion continuation — 2026-09-19

The canonical root `index.html` now carries **82 curated videos, 63 Ready overall, 36 Ready Beginner** after a batch of fifteen Beginner videos (4 promoted checking entries + 11 new).

All fifteen returned timed Korean captions through the existing production caption endpoint; exact IDs, creators, Context and Listening format tags, cue counts, and audit limitations are recorded in `docs/BEGINNER_EXPANSION_2026-09-19.md`.

The previous 48 Ready lessons and the existing account/auth, admin panel, referral, AI access, saved learner state and player/memory/practice features were preserved.

Important Browse behavior: unfiltered Discover should render nine personalized suggestions followed by the remaining Ready videos in the selected proficiency path. Previously it rendered only nine suggestions, concealing most of the Beginner library. Context and Listening format filters still show the exact ready match set.

This audit only proves the caption route produced Korean timed cues, not human confirmation of word-to-audio acoustic alignment or YouTube iframe playback. Review learner reports and demote any entry with wrong/broken captions, unavailable video, or serious timing drift. Never promote the known no-Korean-track candidates `rj2j3Tes8q0`, `wns9Ro1Nkb0` or the English-heavy `FciY1CF7uOM`, `MHO9U-DEqoU` without repairs.


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

## Intermediate+ content expansion — 2026-09-19

**User intent:** minimum 15–20 *usable Ready* videos PER Context at Intermediate+; this remains **incomplete**. Never claim otherwise or count a staged candidate as a fully verified lesson.

- `data/intermediate-candidates.js` contains **167 unique sourced video IDs** newly staged as `checking`. Sources: publisher-supplied YouTube links in the `Intermediate Korean (Min Ssam)`, `Choisusu` and `Didi` podcast RSS feeds, plus one publisher-announced Focus Korean Intermediate–Advanced online-shopping episode. Three URLs duplicating canonical Ready videos were excluded; duplicate or mismatched publisher episode link IDs were excluded.
- Intermediate level: **187 curated, 12 Ready, 175 Checking/Preview** (20 preexisting Intermediate entries retained). Whole site: 447 unique curated IDs and 140 Ready; Beginner 113 Ready and Lower Intermediate 15 Ready preserved.
- Both Lower Intermediate and Intermediate now show separate Explore/Preview cards, matching search, topic and style filters, and accurate `X Ready · Y Preview` context pills. Candidate clicks run the *correct level's* production `/api/quality`; failures or missing Korean cues cannot open the in-site player; structural PASS/REVIEW may preview with explicit timing/translation warning, not auto-promoted. The authenticated owner QA tray supports both levels.
- Spot checks of Intermediate Korean episodes yielded Korean timed cues and working sampled English meanings but often `REVIEW` for long caption windows, so manual acoustic word alignment and actual iframe playback remain necessary before Ready admission. Keep all original Ready IDs and player, auth, progress, saved memory, library/practice behavior intact.
- Topic metadata is conservative and drawn from the actual episode subject; no fake duplicate cards and no unrelated tags to pad counts. Shopping and Weather remain below 15 even in unverified preview totals. Do not say the 15–20 each goal is reached.

| Intermediate+ Context | Ready | Checking/Preview | Total unique candidates |
| --- | ---: | ---: | ---: |
| Daily Life | 8 | 68 | 76 |
| Food | 1 | 26 | 27 |
| Travel | 1 | 14 | 15 |
| Shopping | 1 | 5 | 6 |
| School | 1 | 24 | 25 |
| Culture | 7 | 82 | 89 |
| Weather | 1 | 9 | 10 |
| Family | 1 | 25 | 26 |
| Work | 1 | 16 | 17 |
| Hobbies | 1 | 20 | 21 |

Temporary public RSS research endpoint removed after sourcing to preserve the approved API footprint. No YouTube API key was copied or exposed. Production version: `2026-09-19-intermediate-preview-podcasts-v1`.

## Intermediate+ Shopping and Weather repair — 2026-09-19

After user identified sparse Intermediate+ Shopping and Weather Contexts, added 20 distinct video IDs from directly inspected YouTube search metadata, 12 Shopping and 8 Weather. All 20 were individually checked via production `/api/quality?videoId=…&level=Intermediate`: 8 structural PASS and 12 REVIEW (Korean timed cues and sampled English meanings), no FAIL; no Ready promotions without manual iframe, caption/word timing validation. The cards remain `Preview` and click-time caption-gated.

- Intermediate+: **Shopping 18 (Ready 1 / Preview 17), Weather 18 (Ready 1 / Preview 17)**. Overall Intermediate+ 207 curated, 12 Ready, 195 Preview; entire site 467 distinct video IDs, 140 Ready.
- No duplication with canonical or Lower Intermediate catalogs, no retagging unrelated videos, no change to protected Beginner/Lower Intermediate/Ready counts, auth/referral/learning player. Preview status is NOT proof that 15–20 fully Ready lessons per Context have been achieved.
- Production manifest `2026-09-19-intermediate-shopping-weather-v2`; one-shot temporary quota-free research endpoint `api/content-target-research.js` removed following selection so that the content curation tool does not remain public. IDs and titles are in `data/intermediate-candidates.js`, and their original YouTube URLs are in each record's `sourceUrl`.

## Intermediate+ Shopping / Weather expansion follow-up — 2026-09-19

Current production candidate distribution is **Shopping 20 distinct video IDs (1 Ready + 19 Preview)** and **Weather 19 distinct video IDs (1 Ready + 18 Preview)**. Added three new distinct sources: Intermediate textbook shopping listening `flkbzb4IWYc` (REVIEW), intermediate K-beauty shopping `0GsMgJzvEqo` (structural PASS), and rainy-season expressions `2yPbSbCOvHg` (REVIEW). The production Korean-cue quality endpoint returned Korean transcripts and five sampled English meanings for these entries; this is **not** manual acoustic synchronization or iframe certification. Discarded four further shopping candidates to keep curated category size within user's 15–20 target. Existing catalog and Ready statuses retained. This stage has NOT reached 15–20 manually verified Ready lessons in each category. Manifest `2026-09-19-intermediate-shopping-weather-v3`.

## Thumbnail-first Discover and honest video totals — 2026-09-19

Context pills now lead with **category video total** (Ready + Preview) and show **Ready / Preview as secondary metadata**, preserving all learner-facing accuracy. Owner review now displays each YouTube thumbnail, title, channel, tags and caption-check / preview actions, with 12 entries initially and an explicit show-all control so long lists do not overwhelm Discover. The learner thumbnail-first Explore grid remains ahead of owner review; existing auth, data, lesson player, transcript gates, level switching, progress and content counts unchanged. Source JS syntax checked. Build/manifest version `2026-09-19-thumbnail-first-discover-v4`.

## Unified Context browsing — 2026-09-19

User-requested UX: each specific Context pill shows only `X videos` (actual unique catalog total, level + selected listening format); only `Anything` shows the secondary `X Ready · Y Preview` breakdown. Selecting a specific Context displays all relevant Ready + Checking/Preview video thumbnails in a single main grid, without Preview/Checking card labels or a separate Explore section/owner review list. Clicking an unverified video STILL runs the Korean cue quality gate; no usable Korean cues => do not open, valid cues => open existing player with timing warning. On Anything, previous separated Ready grid, Preview exploration and owner QA remain, and the Ready/Preview counts remain accurate. No entries promoted to Ready, no catalog or feature changes. Version `2026-09-19-context-unified-video-grid-v5`.

## Caption quality and full English coverage fix — 2026-09-19

User reported grey `Transcript verification pending` overlays and player `PREVIEW · Korean captions available, but timing and translation are not fully certified` despite expecting useful intermediate learning. Changes:
- Specific-context Checking videos now render bright, full-size thumbnails without the dimming and verification-pending pseudo-overlay. Anything view preserves distinct Ready/Preview counts. The redundant full-screen preview warning is removed. Player instead reports actually loaded Korean captions and whether word timestamps are source-provided or estimated, without falsely claiming certification.
- Opt-in `/api/captions?review=1&cv=11` candidate pipeline rejects non-Korean provider tracks (previously an Arabic transcript could pass through from provider), removes music/numeric/single-syllable noise cues, normalizes rolling overlapping cue ends, and tries a Korean YouTube caption track as fallback when provider text is unusable. Default captions path stays unchanged for existing Ready lessons. These are transcript-structure fixes, NOT audio-forced alignment or a promise all candidate videos have reliable transcripts.
- Production quality API now checks reviewed candidate cues and flags unavailable sampled English meaning; browser candidate quality cache upgraded to v2 to avoid stale pre-repair PASS/REVIEW data.
- Fixed `preloadMeanings` silently translating only the first 120 unique Korean cues: now translates **all** unique cues in batches of 80 (matching server's 120/request limit), persists each batch and permits retries after partial failures. This is a production translation coverage fix; actual third-party translation quality may still vary.
- No video promoted to Ready based on structural checks. Embedding, acoustic sync, and full cue-by-cue English accuracy still require individualized verification. Current version `2026-09-19-caption-reliability-and-full-translation-v6`.

## Per-video playback-based cue and word calibration — 2026-09-19

The root UI now includes a small **Fine-tune spoken timing** strip inside the existing player only for Lower Intermediate / Intermediate candidates that are not Ready. When playing the actual YouTube video, click **Sync line now** when the visible sentence starts, or enable **Tap words** and tap individual Korean tokens exactly when they are spoken. Save marks per video/cue fingerprint to localStorage `haneulTiming:v1:<videoId>`; rehydrate after caption fetch/cache and reopening, and provide Reset. Word timeline interpolates between manually marked starts and existing sentence boundaries; actual manually marked starts are used as anchors. Native word timestamps remain prioritized when no marks. Corrected cue starts and saved word offsets follow playback, unlike the previous model-only word estimate.

This is a real manual acoustic calibration workflow, **not** automated forced alignment. Individual source transcripts can still have ASR errors. Marks are local to the correcting browser/device and do not update other learners or mass-promote catalog entries to Ready; manual corrections must be reviewed and distributed separately to become shared verified content. Existing Ready videos and all other learning modes remain untouched. Syntax checked, isolated persistence/word-anchor test passed; verify actual user-browser acoustic alignment separately. Production manifest: `2026-09-19-playback-calibration-v7`.

## Creator Communities V1 — 2026-09-19

Created the five integrated referral-code-scoped experiences: creator 7-day Ready-video challenge plus optional AI-generated plan; member AI Korean tutor; creator video → playable caption transcript + AI activity; private code-level signup/completion metrics and opt-in nickname-only ranking; weekly Korean speech-to-text/typed answer with Groq wording feedback and once-weekly completion. These reside at `/creators/`, linked from Haneul's sidebar and Profile and referral login. Haneul Admin Panel adds `Assign creator` to associate a real signed-in collaborator email with an issued code. Existing Haneul login/AI permissions and catalog retained (470 distinct videos, 140 Ready). Six new RLS-protected Supabase tables, scoped authenticated SECURITY DEFINER RPCs, code-creation trigger and plan persistence were deployed in the existing project `uyltjaftajwkujjhuric`. Runtime AI uses pre-existing `GROQ_API_KEY`, NOT Grok. No creator codes existed when schema checked; no real creator/learner end-to-end auth test possible until owner issues a code and assigns collaborator. No scores/members invented and leaderboard participation is opt-in. Root app/manifest version `2026-09-19-creator-communities-v8`. See `docs/CREATOR_COMMUNITIES_V1.md` for full endpoints, setup and limitations.

## Private owner preview enabled — 2026-09-19

Owner's already-whitelisted Haneul admin Google account now has a genuine private creator space `HNL-X-OWNER-PREVIEW-SIG00`. The associated collaborator code is **inactive**, so it cannot be redeemed for public signups; real referral count is zero. This is not a production collaborator assignment and is not included in active referral promotion. It is tied to the pre-existing admin user (no unknown email inferred). The preview is seeded with exactly seven verified Ready videos across the seven-day challenge, one clearly labeled `DEMO` video lesson from the existing verified catalog, a sample welcome note/weekly speaking challenge, and empty *real* ranking counts (no fake learner data). The `/creators/` page defaults admin to the private preview and opens Creator Studio so the five tabs can be inspected without first issuing a public collaborator code. Existing real collaborators/referral communities still work; admins can change the selection dropdown. If visiting with a Google account different from the whitelisted Haneul owner, the gate names the current signed-in email without guessing/overriding permissions. This is functional owner sandbox data with existing isolated Supabase access control, not an unauthenticated public demo.

## Ambassador BYOK + YouTube community drops — 2026-09-19

Creator-only OpenRouter BYOK Content Factory, Quiz Battle Builder, aggregate Learning Doctor, code-scoped saved/published content library and caption-optional YouTube video community drops added under `/creators/`. New API `api/ambassador-ai.js`, guarded Supabase table/RPC migration, shared content cards on member Videos tab. See `docs/AMBASSADOR_TOOLS.md` for details and verification limits.

### Ambassador scored-quiz & share-link refinement

Built structured five-question OpenRouter quiz generation with editable JSON, validated publishing, one server-scored attempt per account (10 points each), answer explanations after submit, code-scoped opt-in nickname quiz ranking, and hidden pre-attempt answer keys for non-owner members. A SQL transaction smoke-tested score, duplicate-attempt prevention and ranking response with rollback. YouTube cards now copy a video-specific community URL; opening that link selects the Videos tab and highlights the video. Owner preview opens the Ambassador Factory tab. Creator static scripts set to no-cache. UI/endpoint source compiled, DOM IDs crosschecked. Real key OpenRouter response and Google signed-in browser end-to-end need live verification. Latest GitHub SHA and Vercel production SHA should be compared before saying deployed; see `docs/AMBASSADOR_TOOLS.md`.

## Distinct Ambassador and learner Community pages — 2026-09-19

Moved exclusive Ambassador AI Factory and creator-management tools out of `/creators/` into new private `/ambassadors/` (`ambassadors/index.html`, `ambassadors/studio.js`). Referred learners now see only community challenges, creator videos, AI tutor, speaking challenges, published content/quiz battles, opt-in rankings on `/creators/`; no BYOK key field, ambassador controls or creator management tab exists on the learner page. Authorized owners see a header link to `/ambassadors/?code=...`. The private studio verifies signed-in owner permissions, includes challenge/verified lesson setup, BYOK factory, quiz creation, Learning Doctor, YouTube share drops and library, and links to matching community. Haneul owner sidebar/profile and Admin Panel have distinct links. Same database/API and production domain are preserved. Both frontends have no-cache asset headers. See `docs/AMBASSADOR_TOOLS.md`. Always verify Vercel deploy SHA and actual official URLs before calling separation live.
