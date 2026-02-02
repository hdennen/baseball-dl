# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Baseball Defensive Lineup Manager - A React SPA for Little League coaches to create and manage defensive lineups. Supports multi-inning lineup management with drag-and-drop position assignment.

## Commands

- `npm run dev` - Start Vite dev server (http://localhost:5173)
- `npm run build` - Production build to `/dist`
- `npm run preview` - Preview production build

No test or lint commands configured - TypeScript strict mode provides type safety.

## Architecture

### State Management
Single Zustand store (`src/store/useBaseballStore.js`) handles all app state with localStorage persistence (key: `baseball-lineup-storage`). All mutations are synchronous actions.

### Drag & Drop
Uses @dnd-kit with `DndContext` wrapper in App.jsx. Players can be dragged between bench, positions, and across innings.

### Position Generation
`src/services/PositionGeneratorService.ts` contains algorithms for automatic position assignment with fair distribution and rotation logic.

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

- `VITE_STYTCH_PUBLIC_TOKEN` - Stytch public API key for passwordless auth

## Deployment

Deployed to Vercel with SPA routing configured in `vercel.json`. Google Analytics tracking included.
