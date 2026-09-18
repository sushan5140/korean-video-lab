# CC Task — Deploy Haneul UI V2 to existing Vercel production

## Goal
Deploy the CURRENT `main` branch of `sushan5140/korean-video-lab` to the EXISTING Vercel project `korean-video-lab`.

Do NOT create a new Vercel project.
Do NOT change the stable domain.
Do NOT replace or delete the production API routes.

## Current source state
- The redesigned UI has already been promoted to root `index.html`.
- Production UI promotion commit: `452b9bba7142fab89d72d53995bf130e42f7cbef`
- Current main also contains a documentation update after that promotion.
- Rollback branch: `production-pre-ui-v2-2026-09-19`
- Root source preserves:
  - 48 Ready lessons
  - 71 curated catalog entries
  - captions / meanings / semantic APIs
  - word sync
  - Practice
  - Micro Lessons
  - Library
  - Review Today
  - saved words / patterns
  - learner memory
  - onboarding proficiency + interests
  - Profile personalization + AI learning read
  - mobile Home / Library / Practice / Progress / Profile dock

## Existing Vercel project
- Project name: `korean-video-lab`
- Project ID: `prj_KXwOs8YsAKgQvcKJrcWdRywB9Zgf`
- Team/org ID: `team_2qP7AnUVZ2NnshuJiNVh464v`
- Stable domain: `https://korean-video-lab.vercel.app`

## Deployment requirements
1. Pull latest `main`.
2. Confirm root `index.html` contains the promoted UI and the Ready catalog still has 48 IDs.
3. Link the local repo to the EXISTING Vercel project if needed.
   - Prefer the existing project ID above.
   - Do not create a second project.
4. Deploy root to PRODUCTION.
5. Wait until deployment is READY.
6. Verify:
   - `https://korean-video-lab.vercel.app/` returns 200 and shows the new UI.
   - mobile layout uses the new bottom dock.
   - onboarding/profile personalization code is present.
   - known-good caption request succeeds:
     `/api/captions?videoId=8rvv4RXQYb4`
   - there are no obvious production runtime/build errors.
7. Report:
   - deployment URL / ID
   - stable alias status
   - verification results
   - any warnings/errors

## Safe rollback
If production is broken, do NOT improvise a partial rollback.
Use the preserved branch:
`production-pre-ui-v2-2026-09-19`

## Suggested Vercel CLI flow
Use the authenticated account already connected to the user.

```bash
git checkout main
git pull

# confirm source state
git log -1 --oneline
grep -o 'VERIFIED_READY=new Set' index.html | head

# link ONLY to the existing project
vercel link --yes --project korean-video-lab

# deploy production
vercel --prod --yes
```

If the CLI asks for scope/team, choose the user's existing Vercel team that owns project ID:
`prj_KXwOs8YsAKgQvcKJrcWdRywB9Zgf`.

Do not stop after a preview deployment. The task is complete only after the stable production alias is verified.
