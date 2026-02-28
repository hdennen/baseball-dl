# Baseball DL - Project Memory

## App Purpose
Little League coaching tool for managing defensive lineups. Coaches create per-inning position assignments, batting orders, and game context. Intended for use by multiple coaches and parents who have no visibility into each other's data.

## Key Architectural Principles

### Multi-User Ownership Model
The central design constraint: **different coaches and parents will create/update objects independently, with no knowledge of each other.** This shapes every data modeling decision.

- **Never create shared objects** that require coordination between two parties. Example: a "Game" object is wrong because two teams play in every game -- only one coach owns the lineup.
- **Correct pattern**: attach context to objects a single coach/team fully owns. A lineup is coach-owned; game metadata hangs off the lineup, not the other way around.
- Future features should always be evaluated through this lens: who owns this object? Can two coaches conflict over it?

### Progressive Disclosure
Coaches should be able to use the app with minimal work. New concepts are introduced as optional, collapsed, or secondary -- not required upfront.

## Product Decisions

### Persistence Model: Cloud-Only
- **No localStorage persistence.** All data lives in Postgres, accessed via GraphQL API.
- Free tier: ephemeral in-memory demo (lost on refresh). Lets coaches try the app before paying.
- Paid tier: cloud persistence + print functionality. One-time payment per season via Stripe.
- Print views are gated behind login + active season.

### Payment Model
- **One-time per season** via Stripe Checkout (not subscriptions).
- Ownership and payment are decoupled: a parent can pay for a coach's season (sponsor link -- deferred, not yet built).
- Recurly was considered and rejected -- overkill for one-time payments, adds a layer on top of a payment gateway (often Stripe itself), and charges platform fees.

### Auth
- **Stytch** passwordless auth on the frontend (already integrated).
- Backend verifies Stytch session JWTs (stub in place, real verification not yet wired).

## Monorepo Structure (Feb 2026)

npm workspaces monorepo with four packages:

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/web` | React SPA (Vite + React 18 + MUI + Zustand) | Working, deployed to Vercel |
| `packages/api` | Express + Apollo Server (GraphQL), port 4000 | Working locally, not yet deployed |
| `packages/dal` | Data Access Layer -- typed wrappers around Postgres stored procedures | Working |
| `packages/shared` | Shared TypeScript types used by web, api, and dal | Working |

### Local Dev Infrastructure
- **Docker Compose** at repo root runs Postgres 16 Alpine on port 5432.
- **SQL init scripts** in `db/init/` auto-run on first container start (Docker entrypoint). Reset with `npm run db:reset` (drops volume, re-creates).
- No migration tool -- schema and stored procs are defined in numbered SQL files. Production migration strategy deferred.
- **`tsx watch`** for API hot-reload during development.
- Dev auth stub: `x-user-id` header in requests (bypasses Stytch for local testing).

### Deployment
- **Web**: Vercel, Root Directory = `packages/web`.
- **API**: Not yet deployed. Candidates: Railway, Fly.io (free tiers, scale to zero).
- **Database**: Not yet deployed. Candidates: Neon Postgres free tier.
- **Payments**: Stripe (no monthly fee, 2.9% + 30c per txn). Not yet integrated.

## Data Model

### Database Pattern: Stored Procedures
All data access goes through Postgres stored procedures. The DAL (`packages/dal`) wraps each stored proc in a typed async method. Ownership checks are baked into the stored procs themselves -- the DAL passes the authenticated `user_id` and the proc enforces access via JOINs and checks.

### Core Entities
- **User** -- `stytch_user_id` (unique), `email`, `name`. Upserted on login.
- **Team** -- owned by a coach (via `team_members`), optional season/league association.
- **Team Membership** -- links users to teams with roles (`head_coach`, `assistant_coach`, `parent`, `scorekeeper`). Access control: only team members can see team data.
- **Player** -- standalone entity with `name`. Linked to teams via `roster_entries`.
- **Roster Entry** -- links a player to a team, carries optional `number`.
- **Lineup** -- belongs to a team. Contains `game_context` (JSONB), `available_player_ids`, `batting_order`, `innings` (all JSONB). Has `status` (draft/published).
- **League** / **Season** -- optional organizational containers. Secondary to the core team/lineup flow.
- **Player Relationship** -- links a player to a user with a relationship type (e.g., "parent of"). Secondary feature.

### JSONB Strategy
`game_context`, `available_player_ids`, `batting_order`, and `innings` are stored as JSONB columns rather than normalized tables. This matches the frontend data shape, keeps stored procedures simple, and avoids complex joins for data that is always loaded/saved as a whole unit owned by one user.

### Audit Fields
All entities carry `created_by`, `created_at`, `updated_at`. The DAL maps `snake_case` DB columns to `camelCase` TypeScript properties.

## GraphQL API

### Schema Highlights
- Queries: `health`, `me`, `myTeams`, `team(id)`, `teamPlayers(teamId)`, `teamLineups(teamId)`, `lineup(id)`
- Mutations: `createTeam`, `createPlayerOnTeam`, `addPlayerToTeam`, `updatePlayer`, `updateRosterEntry`, `removePlayerFromTeam`, `saveLineup`, `deleteLineup`, `addTeamMember`, `removeTeamMember`, `createLeague`, `createSeason`
- Custom scalar: `JSON` for JSONB fields
- Field resolvers handle `snake_case` -> `camelCase` mapping and `FieldConfig` key translation (`center-field` <-> `centerField`)

### Auth Pattern
`requireAuth(ctx)` helper throws `UNAUTHENTICATED` GraphQL error if no user in context. Every resolver except `health` calls it.

## Future Roadmap

### Near-Term (next steps)
1. **Stytch JWT verification** on the backend -- replace `x-user-id` header stub with real session validation
2. **Apollo Client** on the frontend -- wire web app to GraphQL API
3. **Stripe Checkout** integration -- one-time season purchase, webhook to activate season
4. **Deploy API** -- Railway or Fly.io + Neon Postgres

### Medium-Term
- Remove localStorage persistence from Zustand store (currently still there from pre-backend era)
- Gate print behind login + active season
- Season picker UI in the web app
- Multiple lineups per team (already supported by data model)

### Deferred
- Sponsor link (parent buys season for coach)
- Team invite flow
- Production migration tooling

## Files Reference
- `packages/web/src/store/useBaseballStore.ts` -- Zustand store (still has localStorage, to be migrated)
- `packages/api/src/schema.ts` -- GraphQL type definitions
- `packages/api/src/resolvers.ts` -- resolver map calling DAL
- `packages/api/src/context.ts` -- per-request context builder (auth stub)
- `packages/api/src/index.ts` -- Express + Apollo Server entry point
- `packages/dal/src/dal.ts` -- DAL with typed stored procedure wrappers
- `packages/shared/src/index.ts` -- shared domain types
- `db/init/001_schema.sql` -- table definitions
- `db/init/002_stored_procedures.sql` -- all stored procedures
- `docker-compose.yml` -- local Postgres setup

## Convenience Commands
```
npm run dev          # Start web dev server (Vite, :5173)
npm run dev:api      # Start API dev server (tsx watch, :4000)
npm run build        # Production build of web
npm run db:up        # Start Postgres container
npm run db:down      # Stop Postgres container
npm run db:reset     # Destroy and recreate database (re-runs init scripts)
npm run test:api     # Run API tests (vitest)
```
