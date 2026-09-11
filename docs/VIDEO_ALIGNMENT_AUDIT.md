# Video Alignment Audit — 2026-09-12

This audit covers every video that was in the Ready gate at the time of the scan.

## Important limitation

The production server can inspect Haneul caption timings and application timing behavior, but YouTube blocks server-side media extraction with bot/login protection. Therefore this is a **cue-structure and Haneul timing audit**, not a claim of acoustic word-onset verification for every video.

The Supermarket lesson is marked as a confirmed sync issue because the user directly observed it running ahead of the speaker. That feedback is used as real playback evidence.

## Summary

- Total scanned: 44
- Confirmed user-observed sync issue: 1
- Broken/no usable Korean transcript: 1
- High-risk transcript structures: 6
- Review structures: 8
- Low-risk structures: 28

| # | Video | ID | Audit status | Cues | Median ms/unit | Overlap % | Long cue % | Notes |
|---:|---|---|---|---:|---:|---:|---:|---|
| 1 | Slow Korean Podcast for Beginners | `kHsEZUcyD7c` | Review | 51 | 477 | 0 | 52.9 | many long cue windows |
| 2 | School · Super Beginner Story | `o6AP3nVNj_8` | Low-risk structure | 69 | 518 | 0 | 5.8 | No structural timing anomaly detected |
| 3 | Easy Korean Listening | `79Pwq7MTUPE` | Low-risk structure | 49 | 417 | 0 | 24.5 | No structural timing anomaly detected |
| 4 | A Day in Seoul | `Szv3gPqohbg` | Low-risk structure | 127 | 568 | 0 | 18.9 | slower cue timing |
| 5 | Bike Trip in Seoul | `ufDM439eOqU` | Review | 179 | 632 | 0 | 16.2 | padded timing |
| 6 | Korean Restaurant Conversation | `2CXwo_O7xCg` | Low-risk structure | 114 | 333 | 0 | 9.6 | No structural timing anomaly detected |
| 7 | Breakfast Routine | `LWGNKfztgcI` | High-risk structure | 102 | 740 | 0 | 46.1 | very padded timing; long cue windows |
| 8 | 공부? · Short Story | `u_N9KjD_OVY` | High-risk structure | 67 | 800 | 72.7 | 70.1 | very padded timing; rolling/overlapping track; many long cue windows |
| 9 | Second Life | `k3FsjyRlZdU` | Low-risk structure | 50 | 325 | 0 | 12 | No structural timing anomaly detected |
| 10 | 30 min Intermediate Podcast | `MF6MuUfo3gI` | Low-risk structure | 683 | 271 | 0 | 0.4 | No structural timing anomaly detected |
| 11 | Everything About Me | `pZz0-jlSMT4` | High-risk structure | 239 | 411 | 97.9 | 36.4 | rolling/overlapping track; long cue windows |
| 12 | Intermediate Listening Ep. 1 | `NRcXaIUcEak` | Broken / remove from Ready | 0 | 0 | 0 | 0 | No usable Korean transcript |
| 13 | Reading Reddit Posts About Korea | `xShgqxDB2Bc` | Review | 381 | 387 | 98.7 | 21.5 | rolling/overlapping track |
| 14 | Self-introduction | `8rvv4RXQYb4` | Low-risk structure | 81 | 538 | 1.3 | 29.6 | No structural timing anomaly detected |
| 15 | Hobbies Podcast | `GnwIG51ah7k` | Low-risk structure | 45 | 239 | 0 | 13.3 | No structural timing anomaly detected |
| 16 | Supermarket Korean | `paToZla2CK8` | Confirmed sync issue | 91 | 627 | 0 | 14.3 | padded timing |
| 17 | Daily Routines | `VMiPQcgq7wg` | Low-risk structure | 193 | 386 | 0 | 19.2 | No structural timing anomaly detected |
| 18 | Restaurant & Cafe Conversations | `-11--LSPNB0` | Low-risk structure | 187 | 340 | 0 | 32.1 | No structural timing anomaly detected |
| 19 | Korean Cafes | `2NDS0F3bTwk` | Low-risk structure | 54 | 231 | 0 | 7.4 | No structural timing anomaly detected |
| 20 | Talking About Daily Routines | `eF65dUUDcEQ` | Low-risk structure | 220 | 268 | 0 | 4.5 | No structural timing anomaly detected |
| 21 | I Moved | `mdASVEboloc` | Low-risk structure | 50 | 358 | 0 | 42 | long cue windows |
| 22 | Blind Date Story | `mOry_eE_OZA` | Low-risk structure | 93 | 506 | 37 | 10.8 | No structural timing anomaly detected |
| 23 | All Thanks to You | `fNjtQyA43c8` | Low-risk structure | 60 | 288 | 0 | 28.3 | No structural timing anomaly detected |
| 24 | Daily Routine Vlog | `02HTENb9KGg` | Low-risk structure | 121 | 309 | 0 | 14.9 | No structural timing anomaly detected |
| 25 | Restaurant & Cafe Native Conversations | `5n7HFxyE4ZI` | Review | 326 | 461 | 88.9 | 34 | rolling/overlapping track |
| 26 | 40 min Intermediate Podcast | `x031U15y6_U` | Low-risk structure | 922 | 270 | 0 | 0 | No structural timing anomaly detected |
| 27 | 1 Hour Natural Conversation | `6Y7VwFR5cDg` | Review | 1323 | 397 | 99 | 27 | rolling/overlapping track |
| 28 | Park Trip in Korea | `QLJVSqyxU4M` | High-risk structure | 318 | 505 | 93.7 | 49.4 | rolling/overlapping track; long cue windows |
| 29 | Rainy Season | `EMUpahrg1Dg` | Low-risk structure | 847 | 212 | 0 | 21 | No structural timing anomaly detected |
| 30 | Me & Cat | `2I6UMxg6cDc` | Low-risk structure | 985 | 231 | 0 | 4.7 | No structural timing anomaly detected |
| 31 | Traditional Market Shopping | `Gy_nMwa51nY` | Low-risk structure | 197 | 408 | 0 | 10.2 | No structural timing anomaly detected |
| 32 | Taxi Cafe Convenience Store | `_7fhtMzAfOM` | Review | 175 | 520 | 75.9 | 14.3 | rolling/overlapping track |
| 33 | Beginner Korean Vlog | `sa0mN3K7BIM` | High-risk structure | 158 | 676 | 90.4 | 62.7 | padded timing; rolling/overlapping track; many long cue windows |
| 34 | Meeting Korean Celebrities | `jmAzSdwYBj4` | Low-risk structure | 214 | 211 | 0 | 11.7 | No structural timing anomaly detected |
| 35 | Movie Theater | `FY9_RtFt84U` | Low-risk structure | 107 | 557 | 0 | 12.1 | slower cue timing |
| 36 | Cherry Blossom Picnic | `Oh8fiYihNhM` | Low-risk structure | 138 | 566 | 0 | 5.8 | slower cue timing |
| 37 | Korean Street Food | `NyCrQ-NZMbg` | Low-risk structure | 109 | 533 | 0 | 0.9 | No structural timing anomaly detected |
| 38 | University Students Hang Out | `xUbMF1aEH8Y` | Low-risk structure | 67 | 538 | 0 | 47.8 | long cue windows |
| 39 | 10 Short Conversations | `p5kMoLahPa4` | Review | 292 | 279 | 0 | 57.5 | many long cue windows |
| 40 | Love Languages Podcast | `5XyvYJ0u8S4` | High-risk structure | 540 | 750 | 94.1 | 21.7 | very padded timing; rolling/overlapping track |
| 41 | Cafe Vlog | `zYsoHRFmC0Y` | Low-risk structure | 160 | 274 | 0 | 1.9 | No structural timing anomaly detected |
| 42 | Grocery Shopping Photos | `xuYpxWYeOKM` | Low-risk structure | 78 | 351 | 0 | 0 | No structural timing anomaly detected |
| 43 | Why Learn Korean Podcast | `7aSzPwA2DPo` | Review | 397 | 415 | 0 | 58.2 | many long cue windows |
| 44 | Doctor & Pharmacy | `aoJXA2O2hoM` | Low-risk structure | 57 | 340 | 0 | 5.3 | No structural timing anomaly detected |

## Confirmed actions from this audit

- `paToZla2CK8` Supermarket Korean gets a dedicated timing profile instead of the global timing profile.
- `NRcXaIUcEak` Intermediate Listening Ep. 1 is removed from the Ready gate because the caption endpoint currently returns no usable Korean transcript.
- Videos with high rolling-overlap or heavily padded caption structures are kept under review rather than receiving blind global offsets.

## Why structural risk is not the same as bad audio sync

Some valid caption tracks use long windows or rolling overlaps by design. Those metrics are useful for identifying videos that need special handling, but they do not prove the track is acoustically wrong. For that reason, this audit avoids automatically shifting every unusual track.
