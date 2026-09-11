# AGENTS.md — Haneul Video Lab Operating Rules

Read this file before performing any implementation, debugging, deployment, data, or design task for Haneul Video Lab.

## 1. Project isolation

Haneul Video Lab is an independent project.

Never mix its:

- source code
- deployment
- learner state
- database
- analytics
- design decisions
- personalization
- progress systems
- saved content

with Haneul K-Drama Interactive, KMate, CTET, or any other product.

## 2. Official production identity

Official production URL:

https://korean-video-lab.vercel.app/

Vercel project name:

`korean-video-lab`

Known Vercel project ID at the time this memory was created:

`prj_KXwOs8YsAKgQvcKJrcWdRywB9Zgf`

Do not create a replacement Vercel project or permanent production URL unless technically unavoidable and explicitly justified.

## 3. UI/design lock

The current UI/design is approved.

Do not redesign, recolor, restructure, simplify, modernize, or “improve” the visual system unless the user explicitly requests design changes.

Preserve the existing:

- browse layout
- player layout
- caption area
- side learning panel
- bottom controls
- spacing
- typography treatment
- interaction structure
- visual hierarchy

Functional changes should be integrated into the current interface.

## 4. Preserve working learning functionality

Before changing code, identify all existing functionality that could be affected. At minimum protect:

- video playback
- captions
- cue synchronization
- English meaning/context
- Guess
- Loop
- Practice
- Words / Vocabulary
- Explain
- Check / checkpoints
- Micro Lessons
- Library / saved items
- progress interactions
- navigation between lesson modes

Do not trade away working features to add new ones unless the user explicitly accepts that tradeoff.

## 5. Inspect first, do not reconstruct blindly

When resuming from a new chat:

1. inspect this repository
2. inspect the current Vercel project
3. inspect the live production URL
4. compare actual code/deployment state against the requested task

Do not attempt to rebuild context by copying entire old conversations.

## 6. Deployment discipline

Never claim a deployment succeeded merely because a build command completed.

For production work:

1. deploy to the existing Haneul Video Lab Vercel project
2. preserve the official domain
3. verify the actual production URL
4. check the requested feature on production
5. check for runtime/build errors where available

A deployment is not considered complete until the production URL has been verified.

## 7. Verification requirements for video/catalog changes

When adding or changing videos, verify:

- card appears in Browse
- thumbnail is correct
- title/channel/level metadata are correct
- card opens the existing player
- YouTube video loads
- captions API responds
- transcript contains usable Korean text
- English meaning is available where expected
- cue timing is plausible
- caption synchronization works
- learning controls still work

A transcript endpoint returning HTTP 200 is not enough if the transcript content is wrong, duplicated, English-only, or unusable for Korean learning.

## 8. Caption quality rule

Treat transcript quality as product functionality, not cosmetic data.

If a provider returns incorrect language or malformed cues:

- flag the video as needing transcript repair
- do not falsely call it fully verified
- prefer a better transcript source or a corrected mapping
- preserve the video entry only if its learning experience remains useful

## 9. Production safety

Do not remove working videos, routes, lesson modes, or learner-facing features without explicit need.

Prefer the smallest change that solves the requested task.

Avoid unrelated refactors during feature or deployment work.

## 10. Repository memory rule

This repository is intended to replace large chat-history dependency.

After meaningful project changes, update at least:

- `docs/CURRENT_STATE.md`
- `docs/CONTINUATION.md`

Update `docs/PROJECT_RULES.md` only when durable rules actually change.

Do not fill these files with temporary debugging chatter or obsolete discussion.

## 11. What belongs in durable memory

Store only information future work needs:

- official URLs
- repository identity
- deployment identity
- architecture
- important implementation constraints
- current production state
- completed work
- known bugs/blockers
- approved next phases
- non-negotiable rules

Do not store repetitive conversation history, discarded ideas, or old design feedback that no longer applies.

## 12. Honesty rule

Do not claim source code, database state, deployment status, or test results that were not actually inspected.

If server-side source cannot be recovered from Vercel or another system, say so explicitly rather than inventing it.
