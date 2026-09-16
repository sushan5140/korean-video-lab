# Project Rules

## Product boundary

Haneul Video Lab is a standalone Korean-learning system based on real Korean video content.

It must remain technically and conceptually independent from Haneul K-Drama Interactive.

## Approved design state

The current UI is approved and locked unless the user explicitly asks for a redesign.

No unsolicited visual refinement.

## Feature-preservation rule

New work must preserve currently working player, caption, practice, explanation, library, and progress functionality.

## Production URL

The stable production URL is:

https://korean-video-lab.vercel.app/

Keep this URL stable.

## Deployment rule

Use the existing `korean-video-lab` Vercel project. Do not create a replacement project simply to make deployment easier.

## Verification rule

Production verification is mandatory after deployment.

At minimum check:

- homepage/browse loads
- existing videos remain available
- new videos appear when relevant
- new videos open
- player works
- captions load
- captions are genuinely usable Korean
- cue sync is functional
- learning controls still work
- no broken routes
- no obvious build/runtime failure

## Context rule

Use repository + deployment state as source of truth. Do not depend on a huge previous chat transcript.

## Change scope rule

Avoid unrelated refactors. Make narrowly scoped changes that solve the requested task while preserving stable behavior.


## Ready admission gate

- `PASS` from `/api/quality` is a structural/transcript gate only.
- A candidate may enter `VERIFIED_READY` only after real playback confirms cue entry, sentence switching, word highlighting, and English meaning are acceptable.
- Client-side/local quality cache must never auto-promote or expose a checking candidate as Ready.
- REVIEW and FAIL candidates remain outside Ready unless their underlying transcript/timing evidence materially changes and they are re-audited.
