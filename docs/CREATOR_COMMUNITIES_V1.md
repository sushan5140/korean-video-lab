# Haneul Creator Communities — production V1 (2026-09-19)

Official existing deployment: https://korean-video-lab.vercel.app/creators/
Main learner app: https://korean-video-lab.vercel.app/
Admin collaborator codes: https://korean-video-lab.vercel.app/internal/collaborators/

## Five connected experiences

1. **AI Korean Challenge Studio**: An assigned creator selects exactly seven distinct existing Ready Korean videos from `data/creator-ready-catalog.json` (140 verified-Ready items at rollout), sets title and weekly speaking prompt, optionally generates and edits an AI-written seven-day plan, and publishes it. Referred members watch Haneul's original player (with its captions/learning tools) and record their individual challenge day after Haneul local progress confirms >=80% of the video and >=30 seconds of listening on that device. A day can be completed only once per user; changing the seven video IDs resets old challenge-day milestones, changing title/description alone does not.
2. **Creator's AI Korean Tutor**: Community members ask Korean questions and receive Groq-powered language explanations and one practice question. Server checks the Supabase JWT, community membership and existing Haneul AI permissions. The AI provider key stays server-side.
3. **AI Video-to-Lesson Studio**: Assigned creator submits public YouTube video and title; the page checks Haneul Korean-caption quality and English sampled translation before publishing. Members see video, normalized timed Korean transcript, click-to-seek cues and an AI activity (vocabulary, listening questions, speaking prompt) grounded in a provided Korean transcript excerpt. The original YouTube player is embedded. Caption imperfections and estimated word alignment remain possible, and these creator uploads are not silently added to Haneul's Ready catalog.
4. **Collaborator Dashboard and Referral Ranking**: Counts only that referral code's members, recorded challenge-day completions and weekly speaking completions. Optional nickname-only community leaderboard; members must explicitly opt in. Scores = 10 per unique challenge day + 5 per weekly speaking completion; no AI judgment, popularity metrics or emails in ranking. Max 7 challenge days plus 1 speaking entry per UTC week. Scores are learning milestones, not proof of identity/skill/competition prizes. On-device video progress is user-side evidence, not cryptographic playback attestation.
5. **Weekly AI Speaking Challenge**: Browser Korean speech recognition when supported or manual Korean text entry, private text-only wording feedback from Groq, then one recorded completion per UTC week. Haneul does not upload/store learner audio. Text is sent to AI to generate feedback but not stored with community ranking. Do not claim pronunciation/accent evaluation from text.

## Supabase migration state

Live Supabase project `uyltjaftajwkujjhuric`. Migrations applied:
- `haneul_creator_studio_and_optin_community_rankings`
- `haneul_creator_create_space_for_each_referral`
- `haneul_creator_ai_challenge_plan_persistence`
- `haneul_creator_enforce_seven_unique_challenge_videos`
- `haneul_creator_reset_day_scores_only_when_videos_change`

Six new creator tables all have RLS enabled and no direct anon/authenticated table grants. Authenticated Supabase RPCs are `SECURITY DEFINER` with code-membership/ownership checks. `haneul_creator_member` allows only the user with that code in `haneul_referrals`, the code's assigned creator, or Haneul admins. Only creator/admin can publish videos/challenges and edit the plan. SQL enforces exactly seven unique challenge IDs and bounds user-recorded completions. Names are visible on the ranking only if the user opted in.

Automatic space creation is triggered when a new code is created by Haneul Admin Panel; existing codes are backfilled.

**Owner activation**: In Admin Panel create a HNL-X-...-SIG code if none exists. Have the actual collaborator sign into Haneul with their Google account. Under their code click **Assign creator** and enter that Google email. Then share `/creators/?code=<THE-CODE>` with the collaborator. Learners sign in/redeem that collaborator code, then open Creator Communities. The app doesn't invent collaborators, users or scores.

## Files and routes

- `creators/index.html` — responsive five-feature creator/learner page.
- `creators/studio.js` — Supabase-authenticated community view, owner builder, learner challenges/ranking, video playback and AI controls.
- `data/creator-ready-catalog.json` — only 140 Ready videos available for seven-day challenge builder; candidate uploads handled separately.
- `api/creator-ai.js` — separate authorized Groq API for challenge creation, tutor, video lesson, text speaking feedback; uses `GROQ_API_KEY` already used by existing Haneul semantic API. This is **Groq**, not xAI's Grok. If the provider key is absent or down, the endpoint reports unavailable instead of fabricating a result.
- `index.html` — Creator Communities link in sidebar/profile.
- `internal/collaborators/index.html` — owner-only Assign creator action.
- `collaborators/index.html` — referral sign-in link to Creator Communities.

## Verification limits

Source JS syntax and all creator page referenced HTML IDs checked. Supabase migrations succeeded and new tables' RLS verified. Vercel static/AI routes can be checked without impersonation. End-to-end browser interaction as a signed-in owner, creator and real invited learner remains unverified until those accounts/codes exist. The database contained **zero Haneul collaborator codes** at initial creator-suite rollout. Do not claim live leaderboard members, validated pronunciation, acoustic verification or Ready admission of creator uploads.

## Preserved constraints

Keep Haneul Video Lab separate from Hallim and Haneul K-drama app. Preserve site UI, captions, learning features, authentication, active referral AI access, and official production URL. Creator ranking must remain opt-in and code-scoped. Do not use follower/like counts as learner rank.
