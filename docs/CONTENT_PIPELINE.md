# Haneul Video Lab — Content Admission & Scaling Pipeline

## Purpose

New videos must not enter the learner-facing Ready catalog only because a YouTube ID was added.

Every candidate should pass the quality gate first.

Production quality endpoint:

`GET /api/quality?videoId=<youtube-id>`

Batch API:

`POST /api/quality`

Body:

```json
{"videoIds":["id1","id2"]}
```

The batch endpoint accepts at most 8 IDs per request.

## Gate outcomes

### PASS

Safe for catalog promotion based on automated checks.

PASS means:
- usable Korean transcript exists
- transcript contains enough cues
- Korean/Hangul ratio is healthy
- no severe timing-structure risk was detected
- English meaning path is healthy

A PASS still does not mean every spoken word was acoustically verified by a human.

### REVIEW

Technically usable, but a human playback check is required before promotion.

Typical reasons:
- heavily padded transcript timing
- rolling/overlapping caption track
- unusually long cue windows
- borderline Korean ratio
- partial English translation health

REVIEW is intentionally not FAIL. Some valid YouTube caption tracks use rolling/overlapping subtitles.

### FAIL

Do not promote to Ready.

Typical reasons:
- no usable Korean transcript
- Korean ratio too low
- too few transcript cues
- English translation path is unhealthy
- quality check itself cannot obtain a valid transcript

## Current checks

The gate evaluates:

- caption endpoint success
- cue count
- Hangul ratio
- cue overlap percentage
- long-cue percentage
- heavy-padding ratio
- median milliseconds per Korean unit
- sample English translation success

Google Translate remains primary for English.
Groq is the server-side fallback when Google is unavailable.

## Calibrated examples

### Known-good Self-introduction
Video: `8rvv4RXQYb4`

Expected:
- PASS
- score 100

Observed calibration:
- 81 cues
- Hangul ratio ~0.93
- very low overlap
- English sample healthy

### Supermarket Korean
Video: `paToZla2CK8`

Expected:
- REVIEW
- heavy-padding warning

This matches direct user playback feedback that this lesson needed special alignment handling.

### Broken Intermediate Listening
Video: `NRcXaIUcEak`

Expected:
- FAIL
- provider reports no usable Korean track

This video was already removed from the Ready gate.

### 40-minute Intermediate Podcast
Video: `x031U15y6_U`

Expected:
- PASS

Large cue count alone is not treated as a problem.

### 1-hour Natural Conversation
Video: `6Y7VwFR5cDg`

Expected:
- REVIEW
- rolling-overlap warning

This is structurally risky but not automatically rejected.

## Promotion workflow

For each new candidate:

1. Add the candidate metadata to the curated catalog as Checking.
2. Run the quality gate.
3. If FAIL:
   - keep it out of Ready
   - record the failure reason
4. If REVIEW:
   - open the lesson manually
   - verify caption entry timing
   - verify sentence switching
   - verify word highlight follows actual speech
   - verify English meaning
   - only promote after the playback check passes
5. If PASS:
   - perform one short playback sanity check
   - then add the ID to `VERIFIED_READY`
6. Re-deploy and verify production.

## Important boundary

The automated gate is not an acoustic forced-alignment system.

YouTube blocks the current Vercel environment from directly extracting the media stream for full speech-to-word acoustic verification.

Therefore:
- PASS = automated structural admission passed
- REVIEW = requires human playback verification
- FAIL = should not enter Ready

User playback observations remain stronger evidence than automated structural metrics when a specific video visibly leads or lags speech.

## Scaling rule

Never mass-promote candidates simply because the caption endpoint returns HTTP 200.

A usable candidate must pass the complete quality gate and the promotion workflow above.
