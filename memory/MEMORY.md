# Baseball DL - Project Memory

## App Purpose
Little League coaching tool for managing defensive lineups. Coaches create per-inning position assignments, batting orders, and eventually game context. Intended for use by multiple coaches and parents who have no visibility into each other's data.

## Key Architectural Principles

### Multi-User Ownership Model
The central design constraint: **different coaches and parents will create/update objects independently, with no knowledge of each other.** This shapes every data modeling decision.

- **Never create shared objects** that require coordination between two parties. Example: a "Game" object is wrong because two teams play in every game — only one coach owns the lineup.
- **Correct pattern**: attach context to objects a single coach/team fully owns. A lineup is coach-owned; game metadata hangs off the lineup, not the other way around.
- Future features should always be evaluated through this lens: who owns this object? Can two coaches conflict over it?

### Progressive Disclosure
Coaches should be able to use the app with minimal work. New concepts are introduced as optional, collapsed, or secondary — not required upfront. Example: `GameContext` is an Accordion collapsed by default on the Batting tab. All fields are optional.

### Future Direction: Lineups Collection
The current store is a single flat workspace (one lineup). The intended future evolution is a `lineups` array, where each lineup is `{ id, gameContext, players, battingOrder, innings }`. Current Option B (`gameContext` object on root store) was chosen as the minimal step that slots cleanly into that future shape.

## Data Model Decisions

### gameContext (added Feb 2026)
Attached to the root store as an optional metadata object for a single coach's game context:
```js
gameContext: {
  date: null,      // ISO date string "YYYY-MM-DD"
  time: null,      // "HH:MM" (24h)
  opponent: null,  // free text
  location: null,  // free text
  side: null,      // 'home' | 'away' | null
  notes: null,     // free text, multiline
}
```
- Updated via `updateGameContext(fields)` — partial merge, not full replace
- Cleared by `clearAllData()`
- Persisted to localStorage

### updateGameContext pattern
Partial update action — pass only the fields you want to change. Null means "not set" (empty string inputs are stored as null).

## UI Conventions
- Game context lives on the **Batting tab**, above PlayerManagement
- Print views all receive `gameContext` via `layoutProps` in `InningsSummary`
- `GameContextHeader` shared component: renders a compact `·`-separated one-liner of set fields only; notes on second line; returns null if nothing is set
- `BoxScoreView` has special handling: Date/vs header uses real values with blank-underline fallbacks; Notes section shows actual text or blank ruled lines for hand-writing

## Files Reference
- `src/store/useBaseballStore.js` — single Zustand store, all state + actions
- `src/components/GameContext.jsx` — Accordion form for editing gameContext
- `src/components/print-layouts/GameContextHeader.jsx` — shared read-only display
- `src/components/InningsSummary.jsx` — parent for all print views; owns layoutProps
- `src/components/print-layouts/` — BoxScoreView, BattingOrderView, PositionView, FieldView
