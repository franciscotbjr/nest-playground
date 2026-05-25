# AGENTS.md

## Commands
- `npm run start:dev` — dev server with hot reload
- `npm run build` — production build (cleans `dist/`, excludes tests)
- `npm run lint` — ESLint (type-aware, auto-fixes)
- `npm run format` — Prettier (single quotes, trailing commas)
- `npm run test` — unit tests (`*.spec.ts`, rooted in `src/`)
- `npm run test:e2e` — e2e tests (`*.e2e-spec.ts`, uses `test/jest-e2e.json`)
- `npm run test:cov` — unit tests with coverage

## Test configs are split — do not use bare `jest`
- Unit tests: config embedded in `package.json` (rootDir `src`, regex `.*\.spec\.ts$`)
- E2E tests: config at `test/jest-e2e.json` (rootDir `.`, regex `.e2e-spec.ts$`)
- Running `jest` directly will use wrong config; always use `npm run test` / `npm run test:e2e`

## Database (Drizzle + PostgreSQL)
- Schema: `src/db/schema.ts`
- Migrations output: `./drizzle/` (config at `drizzle.config.ts`)
- Requires `DATABASE_URL` in `.env` (copy from `.env.sample`)
- Commands: `npx drizzle-kit generate`, `npx drizzle-kit migrate`, `npx drizzle-kit push`

## Environment
- `.env` is gitignored; template is `.env.sample`
- `dotenv/config` is loaded at the top of `src/main.ts` and `drizzle.config.ts`

## Conventions
- Prettier: single quotes, trailing commas everywhere
- ESLint: type-aware linting on; `no-explicit-any` off, `no-floating-promises` warn
- `moduleResolution: "nodenext"` — match existing import style (no `.js` extensions)
- `tsconfig.build.json` extends base and excludes tests + spec files
