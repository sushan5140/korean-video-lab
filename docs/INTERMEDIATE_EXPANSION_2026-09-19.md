# Intermediate+ 2026-09-19 expansion


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
