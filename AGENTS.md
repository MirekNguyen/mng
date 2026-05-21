# AGENTS.md

## Shell & Runtime

- Shell: fish (`/opt/homebrew/bin/fish`)
- Runtime: Bun (never Node.js). Bun auto-loads `.env` — do not use dotenv.
- Package manager: bun (`bun add`, `bun remove` — never npm/yarn/pnpm)
- Build system: Turborepo
- Linter: oxlint (plugins: unicorn, typescript, oxc)
- Formatter: oxfmt
- Language: TypeScript (strict mode, `noEmit`, `target: esnext`, `moduleResolution: bundler`)

## Commands

```sh
bun run dev                 # start dev server (in app directory)
bun run build               # build (via turbo at root)
bun run lint                # lint (via turbo at root)
bun run lint:fix            # auto-fix lint issues
bun run format              # check formatting
bun run format:fix          # auto-fix formatting
bun add <package>           # add dependency
bun add -D <package>        # add dev dependency
bun remove <package>        # remove dependency
```

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
- Use `import type` for type-only imports (`verbatimModuleSyntax`).

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
- Keep files small and focused. One concern per file. **Max 250 lines per file.**
- Keep functions minimal and single-purpose — easy to read, easy to refactor.

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

## Separation of Concerns

- **Always separate the data layer from the application layer.** API calls, database queries, and data transformations belong in dedicated repository/calculator files — never inline in controllers or components.
- Build modules to be **reusable and single-responsibility**. No god-files that fetch, transform, and render all at once.
- Organize by concern: data access (`.repository.ts`), business logic (`.calculator.ts`), routing (`.controller.ts`). Each layer should be independently testable.

## UI/UX Standards

- **Single styling source**: All UI must use ShadCN components and its CSS variables/tokens (`globals.css`). Never create custom one-off styled components or inline ad-hoc color/spacing values. If a pattern repeats, extract a ShadCN-based component. Tailwind classes should reference the ShadCN theme (`bg-primary`, `text-muted-foreground`, etc.), not raw color values.
- **Visual consistency**: Use a fixed set of spacing (`p-4`, `p-6`, `gap-4`, `gap-6`), border radius (`rounded-lg` or ShadCN's `--radius` token), and shadow (`shadow-sm`, `shadow-md`) values across the entire app. Do not mix arbitrary values.
- **UI/UX best practices**: Use proper size hierarchy for interactive elements (ShadCN Button `size="sm"` / `"default"` / `"lg"` depending on context), consistent icon sizing, adequate touch targets (min 44px), clear visual hierarchy with font weight/size contrast, sufficient whitespace between sections, and logical grouping of related elements.
- **Every UI change must be reviewed** for consistency before considering it done.
- All layouts must be **mobile-first and responsive**.

## Agent Skills

**You MUST load the appropriate skill before doing any UI work.** Do not write UI code from memory alone — always load the skill first so you have the full design guidelines in context.

### Required skill usage

| Task | Skill to load |
|------|--------------|
| Building any new page, component, or UI feature | `frontend-design` |
| After building or modifying UI (quality gate) | `audit` or `critique` |
| Final pass before considering UI work done | `polish` |
| Fixing layout, spacing, or visual rhythm issues | `arrange` |
| Bringing UI back in line with design system | `normalize` |
| Adding animation or micro-interactions | `animate` |
| Simplifying or decluttering a view | `distill` |
| Making a design more visually impactful | `bolder` |
| Toning down an overstimulating design | `quieter` |
| Adding color to monochromatic UI | `colorize` |
| Improving typography | `typeset` |
| Improving UX copy, labels, or error messages | `clarify` |
| Making responsive / mobile-friendly | `adapt` |
| Handling edge cases, error states, i18n | `harden` |
| Extracting reusable components or tokens | `extract` |
| Adding delight, personality, micro-interactions | `delight` |
| Designing onboarding or empty states | `onboard` |

### Rules

- **Always load `frontend-design`** before writing any new UI code. No exceptions.
- **Always run `audit` or `critique`** after completing any UI change — this is a mandatory quality gate.
- Load skills **proactively** — do not wait for the user to ask.
- When multiple skills apply (e.g. building a new component then reviewing it), load them sequentially: `frontend-design` first, then `audit`/`critique` after.

## Testing

No test infrastructure is currently set up. When tests are added:
- Use `.toBe(value)` for simple types (boolean, string, number)
- Use `.toStrictEqual(obj)` for objects
- Write descriptions as: `it('should return ... when/if ...')`

## Design Context (Calorik iOS App)

### Users
Casual health-conscious people who log meals when they remember, mainly watching calories without obsessing over every macro. Quick in, quick out. Not fitness bros, not dietitians. Normal people who want a gentle nudge to eat better.

### Brand Personality
**Clean, confident, effortless** — like Things 3 or Apple Health. Respects your time and intelligence. No hand-holding, no gamification, no guilt. Quiet competence.

### Aesthetic Direction
**Refined minimal.** iOS 26 Liquid Glass used sparingly and purposefully — not on every surface. System adaptive tinting (no hardcoded brand color). Editorial typography, generous whitespace, clear hierarchy. The app should feel like it barely tries, yet everything is in the right place.

### Anti-References
- MyFitnessPal (cluttered, ad-filled, overwhelming)
- Overly gamified apps (badges, streaks, confetti)
- Generic AI dashboards (purple gradients, hero metric templates, glowing accents)
- Clinical health apps (sterile white, hospital vibes)

### Design Principles
1. **Less glass, more air** — Reserve glass for containers that need it. Let whitespace and typography do the heavy lifting.
2. **The food list is the product** — Meal log should be reachable and prominent. Gauge and macros support it.
3. **One tap, done** — Primary actions must be obvious and fast.
4. **Quiet confidence** — No exclamation marks, no celebration animations, no motivational copy. Clear, calm information.
5. **Earn every element** — If it doesn't help log food or check progress, remove it.
