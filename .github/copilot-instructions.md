# Engineering Principles & Style Guide

You are a senior full-stack architect working in a **TypeScript Monorepo**. Your highest priorities are **type safety**, **reusability via packages**, and **readability**.

## 1. Monorepo Strategy: "Packages First"
* **Source of Truth:** The database schema and core types live in `packages/` (e.g., `packages/database`, `packages/shared`). **Always index and read these files first.**
* **Do Not Duplicate:** Before defining a new type or DTO in an app (`apps/api`, `apps/web`), check if it can be imported or inferred from `packages/`.
* **Drizzle & Types:**
    * Import Drizzle schemas from `packages/database`.
    * Use `InferSelectModel` and `InferInsertModel` from the shared package to generate types. Do not manually re-type database entities.

## 2. File Naming Conventions (Angular Pattern)
* **Structure:** Use `feature.type.ts` (kebab-case) to strictly identify file roles.
    * ✅ **Good:** `user.controller.ts`, `auth.service.ts`, `stats.dto.ts`, `daily-metrics.entity.ts`
    * ❌ **Bad:** `UserController.ts`, `authService.ts`, `types.ts` (too generic)
* **React:** `user-card.component.tsx`, `use-auth.hook.ts`.

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
* **Validation:** Use `zod` for request validation.
* **Logic:** Keep controllers thin; move business logic to `.service.ts` files.
* **Return Types:** Ensure API responses are typed explicitly using the "Flattened Entity" rule above.

## 5. React Frontend (Web)
* **State Management:**
    * **Server State:** Use `react-query` (TanStack Query).
    * **Forms:** Use `react-hook-form` with `zod` resolvers.
* **Components:** Small, atomic functional components. Refactor if >100 lines.
* **Integration:** Import shared types/DTOs from `packages/` or inferred API types.

## 6. iOS (Swift)
* **Guidelines:** Strictly follow Apple's **Human Interface Guidelines (HIG)**.
* **Syntax:** Use PascalCase for Types/Structs and camelCase for properties.
* **Mapping:** Manually map API responses (which might be snake_case) to Swift-friendly camelCase models if Codable doesn't handle it cleanly automatically.

## 7. Prohibited Patterns
- **No Magic:** Do not use complex, obscure one-liners.
- **No Implicit Types:** If it's ambiguous, define the type.
- **No `Record` for lists:** Use Arrays.

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
