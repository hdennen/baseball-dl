# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Baseball Defensive Lineup Manager - A React SPA for Little League coaches to create and manage defensive lineups. Supports multi-inning lineup management with drag-and-drop position assignment.

## Monorepo Structure

npm workspaces monorepo with three packages:

- `packages/web` - React SPA (Vite + React 18 + MUI + Zustand)
- `packages/api` - Backend API (scaffold, not yet implemented)
- `packages/shared` - Shared TypeScript types used by both web and api

## Commands

- `npm run dev` - Start Vite dev server for web (http://localhost:5173)
- `npm run build` - Production build of web to `packages/web/dist`
- `npm run preview` - Preview production build of web
- `npm run dev:api` - Start API dev server (not yet implemented)

All commands run from the repo root via npm workspaces.

No test or lint commands configured - TypeScript strict mode provides type safety.

## Architecture

### State Management
Single Zustand store (`packages/web/src/store/useBaseballStore.ts`) handles all app state with localStorage persistence (key: `baseball-lineup-storage`). All mutations are synchronous actions.

### Shared Types
Domain types (`Player`, `Inning`, `GameContext`, `FieldConfig`, `Position`, etc.) live in `packages/shared/src/index.ts` and are imported as `@baseball-dl/shared`. The `BaseballStore` interface (Zustand-specific) stays in `packages/web/src/types/index.ts`.

### Drag & Drop
Uses @dnd-kit with `DndContext` wrapper in App.jsx. Players can be dragged between bench, positions, and across innings.

### Position Generation
`packages/web/src/services/PositionGeneratorService.ts` contains algorithms for automatic position assignment with fair distribution and rotation logic.

### Routing
React Router v7 with tab-based navigation:
- `/batting` - Player management and batting order
- `/lineup` - Field view with position assignment
- `/innings` - Print-friendly summary of all innings
- `/login`, `/authenticate` - Stytch auth flow

### Key Data Structures
- Players: `{ id: string, name: string }`
- Innings: `{ positions: Record<string, string>, fieldConfig: { center-field, center-left-field, center-right-field } }`
- 11 defensive positions with configurable center outfield options

## Environment Variables

- `VITE_STYTCH_PUBLIC_TOKEN` - Stytch public API key for passwordless auth (in `packages/web/.env`)

## Deployment

Web deployed to Vercel with SPA routing configured in `packages/web/vercel.json`. Vercel Root Directory is set to `packages/web`. Google Analytics tracking included.
