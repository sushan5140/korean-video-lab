# Lower Intermediate Context expansion — staged batch · 2026-09-19

**The 15–20 Ready per Context target is not complete.** This batch stages 16 real, externally referenced YouTube IDs as Checking rather than inventing Korean caption and playback verification. These are metadata candidates, not Ready lessons.

- Entire catalog: 175 unique videos. Lower Intermediate 15 Ready and 23 Checking; Beginner Ready unchanged.
- Existing production owner admin login shows a Lower Intermediate review queue in Discover for manually checking transcript quality and previewing exact videos. Candidate checks do not automatically promote to Ready.
- No YouTube API key is copied into source or exposed. Existing owner-only YouTube discovery endpoint remains available.

| Context | Ready | Checking | Needed for 15 Ready |
|---|---:|---:|---:|
| Daily Life | 12 | 17 | 3 |
| Food | 2 | 1 | 13 |
| Travel | 2 | 2 | 13 |
| Shopping | 1 | 2 | 14 |
| School | 1 | 4 | 14 |
| Culture | 3 | 10 | 12 |
| Weather | 0 | 2 | 15 |
| Family | 0 | 2 | 15 |
| Work | 2 | 2 | 13 |
| Hobbies | 1 | 2 | 14 |

## Staged candidates (not playback-certified)
- `4P_pkkh8ynA` — 취미 생활 · Hobbies — Choisusu, Hobbies, Daily Life — https://www.youtube.com/watch?v=4P_pkkh8ynA
- `Lob8cVGGwsU` — 날씨와 계절 · Weather & Seasons — Choisusu, Weather, Daily Life — https://www.youtube.com/watch?v=Lob8cVGGwsU
- `q-mnpzSXoVg` — 시간 관리 · Time Management — Choisusu, Daily Life, Work, School — https://www.youtube.com/watch?v=q-mnpzSXoVg
- `rKsP_2CU9no` — 취업 · Job Hunting — Choisusu, Work, Daily Life — https://www.youtube.com/watch?v=rKsP_2CU9no
- `40DxrMrlt6k` — 주거와 환경 · Housing & Environment — Choisusu, Daily Life, Culture — https://www.youtube.com/watch?v=40DxrMrlt6k
- `1Wa3b7PZwi8` — 인간관계 · Relationships — Choisusu, Daily Life, Culture — https://www.youtube.com/watch?v=1Wa3b7PZwi8
- `YUnh_wZYXI4` — 여행 경험과 문화 차이 · Travel & Culture — Choisusu, Travel, Culture — https://www.youtube.com/watch?v=YUnh_wZYXI4
- `YWJSshTSw7U` — 문화 생활 · Cultural Activities — Choisusu, Culture, Hobbies — https://www.youtube.com/watch?v=YWJSshTSw7U
- `t6KG7M_P5x8` — 나의 소망과 계획 · Plans — Choisusu, Daily Life, School — https://www.youtube.com/watch?v=t6KG7M_P5x8
- `TrtK-nxCjmE` — 한국인에 대한 선입견 · Cultural Perceptions — Choisusu, Culture, Daily Life — https://www.youtube.com/watch?v=TrtK-nxCjmE
- `6IckY_MUmH8` — 성격 · Personality — Choisusu, Daily Life — https://www.youtube.com/watch?v=6IckY_MUmH8
- `ksF_JpRIPS0` — 겨울을 보내는 방법 · Korean Winter — Choisusu, Weather, Culture, Daily Life — https://www.youtube.com/watch?v=ksF_JpRIPS0
- `W58hQRV_oNk` — Family Story 2 · Korean Conversation — TIẾNG HÀN THÚ VỊ, Family, Daily Life — https://www.youtube.com/watch?v=W58hQRV_oNk
- `4ZpU3eVHMB0` — Family Story · Korean Conversation — TIẾNG HÀN THÚ VỊ, Family, Daily Life — https://www.youtube.com/watch?v=4ZpU3eVHMB0
- `uZItKg-x3_I` — Shopping Story · Korean Conversation — TIẾNG HÀN THÚ VỊ, Shopping, Daily Life — https://www.youtube.com/watch?v=uZItKg-x3_I
- `vKleJPU5OK8` — 쇼핑 · Intermediate Listening — huongiu, Shopping — https://www.youtube.com/watch?v=vKleJPU5OK8

Choisusu IDs are linked from the episode-specific publisher podcast descriptions on Apple Podcasts/Podtail/Metacast; one syndicated iVoox page copied a wrong adjacent episode ID, so distinct episode links were taken from other podcast listings. Family and shopping conversation IDs came from their YouTube listings. This validates identification, not Haneul Korean cue timing or player availability.

Admission workflow: run production quality checks; exclude FAIL, manually review REVIEW, and test real playback plus English and word synchronization for PASS. Only then modify `VERIFIED_READY` and redeploy. Do not mislabel these 16 as learner-facing Ready or recycle Beginner videos for inflated counts.

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
