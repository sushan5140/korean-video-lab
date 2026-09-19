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

