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
