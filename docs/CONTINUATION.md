# Continuation Guide

Use this file as the starting point in a new ChatGPT session.

## Start here

Continue the existing Haneul Video Lab project.

Official production site:

https://korean-video-lab.vercel.app/

This is an independent project. Do not merge it with Haneul K-Drama Interactive or unrelated products.

## Mandatory first checks

Before making changes:

1. read `AGENTS.md`
2. read `docs/PROJECT_RULES.md`
3. read `docs/CURRENT_STATE.md`
4. inspect the current repository contents
5. inspect the existing Vercel project and live production URL

Use current code and production state as the source of truth.

## Current unresolved item

The most concrete known issue at the time of this handoff is transcript quality for:

`wns9Ro1Nkb0` — Ordering at a Korean Restaurant · Survival Phrases

Its caption endpoint can return English text where Korean cue text is expected.

If working on captions or catalog quality, inspect this first.

## Deployment requirement

If changes are deployed:

- use the existing `korean-video-lab` Vercel project
- preserve `https://korean-video-lab.vercel.app/`
- verify the live production site after deployment
- do not report success before production verification

## Design requirement

Current UI is approved.

Do not redesign it unless explicitly requested.
