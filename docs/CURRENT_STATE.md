# Current State

Last durable verification captured: 2026-09-11.

## Production

Official URL:

https://korean-video-lab.vercel.app/

Vercel project:

- name: `korean-video-lab`
- project ID: `prj_KXwOs8YsAKgQvcKJrcWdRywB9Zgf`
- production domain preserved

A recent production deployment was verified as READY during the latest continuation session.

## Repository source status

The GitHub repository now contains a direct snapshot of the currently deployed production frontend:

- `app/index.html`

That snapshot was fetched from the official production URL after verification that it returned HTTP 200, contained the Haneul Video Lab title, the live `curatedCatalog`, and the newer appended video batch.

This means future frontend work can start from the actual deployed interface rather than an older Library prototype.

Serverless API implementation files are still not fully recovered from Vercel. Their live behavior can be inspected through the production endpoints, but source should not be invented.

## Catalog state

The live production catalog contains the previously existing catalog plus a newer appended batch of videos.

Newly observed production entries included:

- `Gy_nMwa51nY` — Traditional Market Shopping · Slow Real-Life Korean
- `wns9Ro1Nkb0` — Ordering at a Korean Restaurant · Survival Phrases
- `_7fhtMzAfOM` — Taxi, Cafe & Convenience Store · Real Korean Vlog
- `sa0mN3K7BIM` — Beginner Korean Vlog · Everyday Listening
- `jmAzSdwYBj4` — Meeting Korean Celebrities · Listening Practice
- `FY9_RtFt84U` — At the Movie Theater · Slow Korean Input
- `Oh8fiYihNhM` — Cherry Blossom Picnic · Easy Korean Input
- `NyCrQ-NZMbg` — Korean Street Food · Beginner Listening
- `xUbMF1aEH8Y` — How Korean University Students Hang Out
- `p5kMoLahPa4` — 10 Short Conversations · Talking About Your Day
- `5XyvYJ0u8S4` — Love Languages · Slow Korean Podcast
- `zYsoHRFmC0Y` — This Cafe Used to Be What? · Korean Vlog
- `xuYpxWYeOKM` — Grocery Shopping Photos · Beginner Korean Input
- `7aSzPwA2DPo` — Why Are You Learning Korean? · Slow Korean Podcast
- `aoJXA2O2hoM` — Doctor & Pharmacy · Natural Korean Conversation

## Caption state

The production `/api/captions` endpoint was tested against the newer video batch and successfully returned timed transcript data for the batch during verification.

Important caveat:

`wns9Ro1Nkb0` returned transcript content where some cue text expected to be Korean was actually English. The endpoint worked technically, but transcript quality was not acceptable enough to call that video fully verified.

This should be treated as an unresolved transcript-quality issue.

## Runtime/build state

The latest inspected production build was READY and build logs did not show a build failure.

A Node deprecation warning related to `url.parse()` was observed on older/current server routes such as:

- `/api/youtube`
- `/api/source-pack`

This was not observed as a production-crashing error.
