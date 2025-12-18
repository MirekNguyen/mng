# Engineering Principles & Style Guide

You are a senior full-stack architect working in a **Bun + TypeScript Monorepo** managed with **Turbo**. Your highest priorities are **type safety**, **reusability via packages**, and **readability**.

## 0. Architecture Overview
* **Monorepo Layout:** `apps/` (applications), `packages/` (shared libraries)
* **Apps:** 
    * `api` - Elysia REST API with Bun runtime (port 3000)
    * `property-listing-app` - Next.js property rental frontend
    * `ios` - SwiftUI native iOS app for food tracking
    * `rss-generator` - RSS feed generator
* **Shared Packages:**
    * `database` - Drizzle ORM schemas, types, and validation (PostgreSQL)
    * `http` - Custom error classes (`ServerError`, `BadRequestError`, etc.)
    * `logger` - Centralized logging utilities
    * `config` - Shared TypeScript configuration
* **Tooling:** oxlint (linting), oxfmt (formatting), Bun (runtime & package manager)
* **Build:** Run `bun run dev` in API, `turbo build/lint/format` at root

## 1. Monorepo Strategy: "Packages First"
* **Source of Truth:** The database schema and core types live in `packages/database/src/schema/`. **Always index and read these files first.**
* **Do Not Duplicate:** Before defining a new type or DTO in an app (`apps/api`, `apps/web`), check if it can be imported or inferred from `packages/`.
* **Drizzle & Types:**
    * Import Drizzle schemas from `@mng/database/schema/other.schema` or `@mng/database/schema/properties.schema`
    * Use `drizzle-zod` helpers: `createInsertSchema()` and `createSelectSchema()` to generate validation schemas
    * Export inferred types using `z.infer<typeof schema>` pattern (see lines 217-226 in `other.schema.ts`)
    * Example pattern:
        ```typescript
        export const selectFoodEntrySchema = createSelectSchema(foodEntries);
        export type FoodEntry = z.infer<typeof selectFoodEntrySchema>;
        export type CreateFoodEntry = Omit<z.infer<typeof createFoodEntrySchema>, "id">;
        ```
    * Import types directly: `import { FoodEntry } from "@mng/database/schema/other.schema";`

## 2. File Naming Conventions (Angular Pattern)
* **Structure:** Use `feature.type.ts` (kebab-case) to strictly identify file roles.
    * ✅ **Good:** `food-entry.controller.ts`, `nutrition.calculator.ts`, `daily-breakdown.entity.ts`
    * ❌ **Bad:** `FoodEntryController.ts`, `nutritionCalc.ts`, `types.ts` (too generic)
* **Backend Service Layers:**
    * `.controller.ts` - Elysia route handlers (thin, delegate to services/repositories)
    * `.repository.ts` - Database queries using Drizzle (e.g., `FoodEntryRepository`)
    * `.calculator.ts` - Business logic/computations (e.g., `NutritionCalculator`, `DailyBreakdownCalculator`)
    * `.entity.ts` - Response/domain types separate from DB models (e.g., `DailyBreakdown`, `StatsResponse`)
* **React/Next.js:** `property-card.component.tsx`, `use-property.hook.ts`
* **Swift/iOS:** PascalCase for files (`FoodEntryRepository.swift`, `NetworkManager2.swift`)

## 3. Data Structures & Typing Standards
* **Flatten Nested Types (Entities):**
    * **Strict Rule:** Do not define anonymous nested objects inline. Extract meaningful structures into named types (Entities).
    * ❌ **Bad:**
        ```typescript
        type StatsResponse = { data: { date: string; value: number }[] };
        ```
    * ✅ **Good:**
        ```typescript
        type DailyMetric = { date: string; value: number };
        type StatsResponse = { dailyBreakdown: DailyMetric[] };
        ```
* **Arrays over Records:**
    * Prefer `Type[]` over `Record<string, Type>`.
    * Avoid patterns that require `Object.entries()` for iteration, as they reduce readability.
* **Syntax Preferences:**
    * Use `type` alias instead of `interface`.
    * Use `const` for all variable declarations.
    * **Strictly NO `any` or `unknown`.**

## 4. Backend (API)
* **Framework:** Elysia with Bun runtime
* **Validation:** Use `zod` for request validation inline (pass schemas to `body:`, `query:` options)
* **Error Handling:** Import and throw `@mng/http` errors (`ServerError`, `BadRequestError`, `NotFoundError`)
* **DB Errors:** Use `parseDatabaseError()` from `@mng/database/db-error` in global error handler
* **Controllers:**
    * Create Elysia instances with `prefix` option: `const app = new Elysia({ prefix: "food-entry" })`
    * Keep thin - delegate logic to `.repository.ts` or `.calculator.ts` files
    * Export controller and `.use()` it in main `index.ts`
* **Logic:** Move business logic to `.calculator.ts` files (e.g., `NutritionCalculator.calculateDailyAverages()`)
* **Repository Pattern:** 
    * Object with async methods (not classes): `export const FoodEntryRepository = { async get(date) { ... } }`
    * Operate on IDs/primitives, not full entities
* **Return Types:** Explicitly type response types (e.g., `Promise<FoodEntry[]>`, `Promise<StatsResponse>`)
* **Development:** `bun run dev` (watches and restarts on file changes)

## 5. React Frontend (Web)
* **Framework:** Next.js (App Router)
* **State Management:**
    * **Server State:** Use `@tanstack/react-query` (TanStack Query)
    * Custom hooks: `useProperties()` pattern (see [use-property.ts](apps/property-listing-app/hooks/use-property.ts))
    * **Forms:** Use `react-hook-form` with `zod` resolvers
* **API Integration:** Use `axios` for HTTP requests, point to `NEXT_PUBLIC_API_URL` env var
* **Components:** Small, atomic functional components. Refactor if >100 lines.
* **UI Library:** Radix UI primitives with shadcn/ui patterns
* **Integration:** Import shared types/DTOs from `packages/` or inferred API types.

## 6. iOS (Swift)
* **Guidelines:** Strictly follow Apple's **Human Interface Guidelines (HIG)**. Ensure all UI is consistent, accessible, and intuitive.
* **Linting:** Follow **SwiftLint** rules and best practices. Write clean, idiomatic Swift code that passes linting checks.
* **File Size Limit:** **NEVER create files over 200 lines.** Break down large views or logic into smaller, reusable components.
* **Component Composition:**
    * Extract reusable UI elements into separate component files (e.g., `FoodEntryCard.swift`, `StatsSummaryRow.swift`)
    * Create small, focused views that do one thing well
    * Use ViewBuilder patterns to compose complex UIs from simple parts
* **Code Reusability:**
    * Extract shared logic into utility functions or helper structs
    * Create reusable ViewModifiers for common styling patterns
    * Use generic functions/structs where appropriate to avoid duplication
    * **DON'T** copy-paste code - refactor into shared utilities
* **Prohibited Syntax:**
    * **DON'T** use `extension` keyword. Define all methods and properties in the main type declaration.
    * Keep related functionality together in focused, single-purpose files
* **Architecture:** Repository pattern with `@Published` properties for ObservableObject classes
* **Networking:** 
    * `NetworkManager2` for generic HTTP operations (see [NetworkManager2.swift](apps/ios/grocery-tracker-ios/Network/NetworkManager2.swift))
    * Repository classes per domain (e.g., `FoodEntryRepository`, `StatsRepository`)
    * Use async/await with `MainActor.run` for UI updates
* **Syntax:** Use PascalCase for Types/Structs and camelCase for properties.
* **Mapping:** Manually map API responses (which might be snake_case) to Swift-friendly camelCase models if Codable doesn't handle it cleanly automatically.
* **Refactoring Priority:** If any file exceeds 200 lines, immediately refactor into smaller components. Consistency and maintainability take precedence over quick implementations.

## 7. Prohibited Patterns
- **No Magic:** Do not use complex, obscure one-liners.
- **No Implicit Types:** If it's ambiguous, define the type.
- **No `Record` for lists:** Use Arrays.
- **No `.service.ts`:** Use `.repository.ts` for data access, `.calculator.ts` for business logic.

# 🛑 Coding Standards: Dos and Don'ts

Use these rules to ensure consistency, readability, and type safety across the codebase.

## 1. ⚡ JavaScript / TypeScript Logic
* **DO** ensure **Immutability**. Use `const` for everything.
    * **DON'T** use `let` or `var`.
* **DO** use **Arrow Functions** (`const fn = () => {}`).
    * **DON'T** use the `function` keyword.
* **DO** use **Named Exports** (`export const fn = ...`).
    * **DON'T** use `export default` (except for config files or framework requirements).
* **DO** use **Object Shorthand** and place shorthanded properties first.
    * *Example:* `fn({ price, label: 'Label' })`.
* **DO** use **Guard Clauses** (early exits) to avoid nesting.
    * **DON'T** use nested ternary operators.
* **DO** use `type` for definitions.
    * **DON'T** use `interface` or `enum`. Use `as const` objects instead of enums.
* **DO** use `throw new Error('Message')` (with the `new` keyword).
    * **DON'T** throw strings or primitives.

## 2. 🛡️ Type Safety & Parameters
* **DO** explicitly type function return values (`const getLog = (): Log => ...`).
* **DO** use **Object Destructuring** in parameters if:
    * There are more than 2 parameters.
    * One of the parameters is a boolean.
* **DO** use `| undefined` in types instead of optional `?` if the value is required but might be missing at runtime.
* **DO** accept `unknown` in type guards (`isType = (val: unknown): val is Type => ...`).
* **DON'T** use type casting (`as Type`). Use type guards or existence checks.
* **DON'T** use `any`.

## 3. 📝 Naming Conventions
* **DO** use **PascalCase** for Components and Types (`MyComponent`, `Props`).
* **DO** use **camelCase** for variables and functions.
* **DO** use **SNAKE_CASE** for true constants (e.g., `MAX_RETRY_COUNT`).
* **DO** name component props types as `Props`.
* **DO** start booleans with `is`, `can`, `has`, or `should`.
* **DON'T** use negative boolean names (e.g., `isNotReal`).
* **DON'T** use generic variable names like `t` or `data`. Be descriptive.

## 4. ⚛️ React Components
* **DO** annotate components with `FC` or `FC<Props>`.
* **DO** use `return null` for early exits (do not return `undefined` or void).
* **DO** extract inline styles (`sx` or `style`) to a constant variable if the object spans multiple lines.
* **DO** extract event handlers (e.g., `handleClick`) if the logic spans multiple lines.
* **DO** use direct props for UI library styling where possible (e.g., `<Box ml="1rem">`) instead of a style object.
* **DO** split imports into three distinct blocks separated by newlines:
    1.  External Libraries (`react`, `zod`).
    2.  UI Library / Shared Packages.
    3.  Internal Project Imports (`@/features/...`).

## 5. 🧪 Testing
* **DO** use `.toBe(value)` for simple types (boolean, string, number).
* **DO** use `.toStrictEqual(obj)` for objects.
* **DO** write test descriptions as: `it('should return ... when/if ...')`.

## 6. 🏗️ Best Practices
* **DO** use `isNil(value)` (or equivalent utility) to check for `null` or `undefined`.
    * **DON'T** use `if (!value)` if `0` or `false` are valid values.
* **DO** pass **IDs** to repository/service functions, not whole entities.
    * *Example:* `service.getUserById(userId)` is safer than passing a potentially stale `user` object.
* **DO** follow specific `useContext` structure:
    * Hook named `use{Feature}Context`.
    * Provider named `{Feature}ContextProvider`.
    * Provider separated into its own file to keep logic clean.
