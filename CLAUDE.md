# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Baseball Defensive Lineup Manager -- a React SPA with a GraphQL backend for Little League coaches to create and manage defensive lineups, batting orders, and game context. Supports multi-inning lineup management with drag-and-drop position assignment.

## Monorepo Structure

npm workspaces monorepo with four packages:

- `packages/web` -- React SPA (Vite + React 18 + MUI + Zustand). Deployed to Vercel.
- `packages/api` -- Express + Apollo Server (GraphQL) on port 4000. Not yet deployed.
- `packages/dal` -- Data Access Layer. Typed wrappers around Postgres stored procedures.
- `packages/shared` -- Shared TypeScript types imported as `@baseball-dl/shared`.

## Commands

```
npm run dev          # Web dev server (Vite, :5173)
npm run dev:api      # API dev server (tsx watch, :4000)
npm run build        # Production build of web
npm run db:up        # Start Postgres (Docker)
npm run db:down      # Stop Postgres
npm run db:reset     # Destroy + recreate database
npm run test:api     # Run API smoke tests (vitest)
```

All commands run from the repo root via npm workspaces.

## Architecture

### Data Access Pattern
All data access goes through Postgres stored procedures. The DAL (`packages/dal/src/dal.ts`) wraps each stored proc in a typed async method. Ownership checks are enforced inside the stored procedures themselves. Schema and stored procs live in `db/init/` as numbered SQL files, auto-run by Docker on first container start.

### API Layer
Apollo Server + Express. Resolvers in `packages/api/src/resolvers.ts` delegate to the DAL. Auth is currently a dev stub (`x-user-id` header) -- Stytch JWT verification is planned. Every resolver except `health` requires authentication via `requireAuth(ctx)`.

### Shared Types
Domain types (`Player`, `Team`, `Lineup`, `GameContext`, `FieldConfig`, `Position`, etc.) live in `packages/shared/src/index.ts`. The `BaseballStore` interface (Zustand-specific) stays in `packages/web/src/types/index.ts`.

### State Management (Web)
Single Zustand store (`packages/web/src/store/useBaseballStore.ts`) with localStorage persistence. This will be replaced with Apollo Client calls to the API.

### Drag & Drop
Uses @dnd-kit with `DndContext` wrapper in App.jsx.

### Routing
React Router v7 with tab-based navigation: `/batting`, `/lineup`, `/innings`, `/login`, `/authenticate`.

### Key Data Structures
- Teams own players (via roster entries) and lineups
- Lineups contain `gameContext`, `availablePlayerIds`, `battingOrder`, `innings[]` (all stored as JSONB)
- 11 defensive positions with configurable center outfield options
- Team membership with roles: `head_coach`, `assistant_coach`, `parent`, `scorekeeper`

## Environment Variables

- `VITE_STYTCH_PUBLIC_TOKEN` -- Stytch public API key (in `packages/web/.env`)
- `DATABASE_URL` -- Postgres connection string (in `packages/api/.env`)
- `PORT` -- API server port, default 4000 (in `packages/api/.env`)

## Local Dev Setup

1. `npm install` from repo root
2. `npm run db:up` to start Postgres via Docker
3. `npm run dev:api` to start API on :4000
4. `npm run dev` to start web on :5173
5. API uses `x-user-id` header for auth during development

## Deployment

- **Web**: Vercel, Root Directory = `packages/web`
- **API**: Not yet deployed (candidates: Railway, Fly.io)
- **Database**: Not yet deployed (candidate: Neon Postgres free tier)
