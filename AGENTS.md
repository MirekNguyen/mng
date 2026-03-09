# Agent Instructions

## Environment

- **Runtime:** Bun
- **Shell:** fish (`/opt/homebrew/bin/fish`)
- **Package manager:** bun (`bun add`, `bun remove` — never npm/yarn/pnpm)
- **Build system:** Turborepo
- **Linter:** oxlint (plugins: unicorn, typescript, oxc)
- **Formatter:** oxfmt
- **Language:** TypeScript (strict mode, `noEmit`, `target: esnext`, `moduleResolution: bundler`)
- **Dev server:** `bun run dev` (runs `bun run --watch src/index.ts`)

## Monorepo Structure

```
apps/
  api/          — Elysia REST API (Bun, port 3000)
  rss/          — RSS feed generator + CLI tools
  auth/         — Authentication server (better-auth, SQLite)
  property-listing-app/ — Next.js frontend (standalone, uses pnpm)
packages/
  database/     — Drizzle ORM schemas, Zod validation, types (PostgreSQL)
  http/         — Custom HTTP error classes (ServerError, BadRequestError, NotFoundError, UnauthorizedError)
  logger/       — Pino-based structured logging
  config/       — Shared tsconfig.base.json
```

Workspaces managed by bun: `apps/api`, `apps/rss`, `packages/*`.

## Source of Truth

The database schema and core types live in `packages/database/src/schema/`. Always read these files first before defining new types. Never duplicate types that can be imported from `@mng/database`.

Use `drizzle-zod` helpers (`createInsertSchema`, `createSelectSchema`) to derive validation schemas. Export inferred types with `z.infer<typeof schema>`.

```ts
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const selectFoodEntrySchema = createSelectSchema(foodEntries);
export type FoodEntry = z.infer<typeof selectFoodEntrySchema>;
```

## TypeScript Rules

- Always prioritize **type safety**. Never use `any`. Never use `unknown` except in type guards. Prefer explicit types, inferred types, and generics. Use `satisfies` and `as const` where appropriate.
- Use `const` for all declarations. Never use `let` unless mutation is absolutely unavoidable. Never use `var`.
- Use **arrow functions** exclusively. Never use `function` declarations.
- Use `const` assignments instead of function declarations:
  ```ts
  // correct
  const greet = (name: string): string => `Hello, ${name}`;

  // wrong
  function greet(name: string): string {
    return `Hello, ${name}`;
  }
  ```
- Explicitly type function return values.
- Use `type` alias instead of `interface`. Never use `enum` — use `as const` objects.
- Never use type casting (`as Type`). Use type guards or existence checks.
- Use `| undefined` instead of optional `?` when the value is required but might be missing at runtime.
- Use named exports. Never use `export default` (except config files or framework requirements).

## File Naming

All files use **kebab-case** with dot-separated segments for file type/purpose (Angular pattern):

```
food-entry.controller.ts
food-entry.repository.ts
nutrition.calculator.ts
daily-breakdown.entity.ts
```

**File type suffixes:**
- `.controller.ts` — Elysia route handlers (thin, delegate to repositories/calculators)
- `.repository.ts` — Database queries using Drizzle
- `.calculator.ts` — Business logic and computations
- `.entity.ts` — Response/domain types separate from DB models
- `.schema.ts` — Drizzle table definitions and Zod schemas

Never use `.service.ts`. Use `.repository.ts` for data access and `.calculator.ts` for business logic.

## Backend (API) Patterns

**Framework:** Elysia with Zod validation.

**Controllers:**
- Create Elysia instances with `prefix` option: `const app = new Elysia({ prefix: "food-entry" })`
- Keep thin — delegate logic to `.repository.ts` or `.calculator.ts`
- Export controller and `.use()` it in main `index.ts`
- All API responses must have typed schemas

**Repositories:**
- Plain objects with async methods (not classes):
  ```ts
  export const FoodEntryRepository = {
    get: async (date: string): Promise<FoodEntry[]> => {
      // ...
    },
  };
  ```
- Accept IDs/primitives, not full entities

**Validation:** Pass Zod schemas to Elysia's `body:`, `query:` options.

**Error handling:** Import and throw `@mng/http` errors (`ServerError`, `BadRequestError`, `NotFoundError`, `UnauthorizedError`). Use `parseDatabaseError()` from `@mng/database/db-error` in global error handler.

**Database:** Use `@mng/database/db` for the Drizzle connection. PostgreSQL via `drizzle-orm/bun-sql`.

## Code Style

- Use **guard clauses** (early exits) to avoid nesting. No nested ternary operators.
- Use **object shorthand** with shorthanded properties first: `fn({ price, label: 'Label' })`.
- Use **object destructuring** in parameters if there are more than 2 parameters or any parameter is a boolean.
- Prefer `Type[]` over `Record<string, Type>`. Avoid patterns requiring `Object.entries()`.
- Flatten nested types — extract meaningful structures into named types.
- Start booleans with `is`, `can`, `has`, or `should`. No negative boolean names.
- No magic one-liners. No generic variable names like `t` or `data`. Be descriptive.
- Keep files small and focused. One concern per file.

## Naming Conventions

- **PascalCase** for types (`FoodEntry`, `StatsResponse`)
- **camelCase** for variables and functions
- **SNAKE_CASE** for true constants (`MAX_RETRY_COUNT`)
- **kebab-case** for filenames

## Import Order

Split imports into three blocks separated by newlines:
1. External libraries (`elysia`, `zod`, `drizzle-orm`)
2. Shared packages (`@mng/database`, `@mng/http`, `@mng/logger`)
3. Internal project imports (relative paths)

## Package Manager Commands

```sh
bun add <package>           # add dependency
bun add -D <package>        # add dev dependency
bun remove <package>        # remove dependency
bun run dev                 # start dev server (in app directory)
bun run build               # build (via turbo at root)
bun run lint                # lint (via turbo at root)
bun run lint:fix            # auto-fix lint issues
bun run format              # check formatting
bun run format:fix          # auto-fix formatting
```

## Testing

No test infrastructure is currently set up. When tests are added:
- Use `.toBe(value)` for simple types (boolean, string, number)
- Use `.toStrictEqual(obj)` for objects
- Write descriptions as: `it('should return ... when/if ...')`
