# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run start:dev` — dev server with hot reload
- `npm run build` — production build (cleans `dist/`, excludes tests)
- `npm run lint` — ESLint (type-aware, auto-fixes)
- `npm run format` — Prettier (single quotes, trailing commas)
- `npm run test` — unit tests (`*.spec.ts`, rooted in `src/`)
- `npm run test:e2e` — e2e tests (`*.e2e-spec.ts`, uses `test/jest-e2e.json`)
- `npm run test:cov` — unit tests with coverage

**Never run bare `jest`** — unit test config is in `package.json`, e2e config is in `test/jest-e2e.json`. Always use the npm scripts.

## Architecture

This is a NestJS v11 app that functions as an **MCP (Model Context Protocol) server**. It exposes tools over StreamableHTTP transport at `POST/GET/DELETE /mcp`. The only other HTTP endpoint is `GET /` (hello world).

### MCP session lifecycle

`McpService` (`src/mcp/mcp.service.ts`) manages the full MCP transport lifecycle:

1. **Initialize**: Client POSTs an `initialize` request (no session ID). Service creates a new `StreamableHTTPServerTransport` with an `InMemoryEventStore`, connects an `McpServer`, and registers all tools via `registerAllTools`.
2. **Active session**: Subsequent POST/GET/DELETE requests carry `mcp-session-id` header and are routed to the matching transport.
3. **Close**: Transport `onclose` handler removes the session from the in-memory map. `onModuleDestroy` closes all transports on shutdown.

Sessions live in memory (`McpService.transports` map) — they do not survive restarts.

### Feature pattern (MCP tools)

Each feature under `src/features/<domain>/<action>/` follows a strict 3-file pattern:

| File | Purpose |
|------|---------|
| `*.schema.ts` | Zod v4 input/output schemas (plain objects, not `z.object()`) |
| `*.handler.ts` | Pure async function `(db: Db, input) => output` — no framework coupling |
| `*.tool.ts` | Registers the MCP tool via `server.registerTool()`, wires schema + handler, formats errors with `formatError()` |

Every tool file exports a single `register*Tool(server: McpServer, deps: ToolDeps)` function. These are collected in `src/mcp/tool-registry.ts` and called during server initialization.

**When adding a new MCP tool:**
1. Create the 3 files under `src/features/<domain>/<action>/`
2. Add the registration call to `src/mcp/tool-registry.ts`

### Middleware

`OriginMiddleware` applies only to `McpController` routes. It validates the `Origin` header against `MCP_ALLOWED_ORIGINS` (comma-separated, supports `*` prefix matching). Enforcement is toggled via `MCP_ENFORCE_ORIGIN=true/false`.

## Database (Drizzle + PostgreSQL)

- Schema: `src/db/schema.ts` (single file)
- Migrations output: `./drizzle/` (config at `drizzle.config.ts`)
- `DbModule` is `@Global()` — inject `DRIZZLE` token (`Symbol('DRIZZLE')`) anywhere
- The `Db` type is `NodePgDatabase<typeof schema>` (see `src/db/db.tokens.ts`)
- Requires `DATABASE_URL` in `.env` (copy from `.env.sample`)
- Commands: `npx drizzle-kit generate`, `npx drizzle-kit migrate`, `npx drizzle-kit push`

## Testing

- **Unit tests**: `*.spec.ts` files co-located with source. Use `createMockDb()` from `src/test-utils/mock-db.ts` to create a chainable Drizzle mock — it returns a builder whose methods (`select`, `from`, `where`, etc.) return itself, and which is thenable to resolve with your provided value.
- **E2E tests**: Uses `@nestjs/testing` + `supertest`. Since `DbModule` reads `DATABASE_URL` at construction time, e2e tests that hit MCP endpoints need a real database or the module mocked.
- Coverage threshold: 80% (statements, branches, functions, lines)
- Test configs are split: unit test config in `package.json` (rootDir `src`, regex `.*\.spec\.ts$`), e2e config in `test/jest-e2e.json` (rootDir `.`, regex `.e2e-spec.ts$`)

## Environment

- `.env` is gitignored; template is `.env.sample`
- `dotenv/config` is loaded at the top of `src/main.ts` and `drizzle.config.ts`

## Conventions

- Prettier: single quotes, trailing commas everywhere
- ESLint: type-aware linting on; `no-explicit-any` off, `no-floating-promises` warn
- `moduleResolution: "nodenext"` — **do not add `.js` extensions** to relative imports despite what NodeNext normally requires (the repo doesn't use them)
- Path aliases (`@/`) are not configured — all imports use relative paths
- Test files relax several ESLint rules (see `eslint.config.mjs`)
