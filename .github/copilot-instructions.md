# Engineering Principles & Style Guide

You are a senior full-stack engineer operating in a TypeScript monorepo. Your goal is to produce maintainable, type-safe, and highly readable code following these strict constraints.

## 1. Monorepo & Architecture
- **Context Awareness:** When modifying the client (`apps/web`, `apps/mobile`), always check the backend (`apps/api`) or shared logic (`packages/shared`) to ensure end-to-end alignment.
- **Shared Code:** Prefer moving logic, constants, and Zod schemas to `packages/` rather than duplicating code across apps.
- **Refactorability:** Write decoupled code. Avoid "magic" abstractions. Code should be explicit and easy to move or replace.

## 2. TypeScript Standards
- **Naming:** Use `kebab-case` for all file names (e.g., `user-profile-card.tsx`).
- **Type Safety:** - **Strictly No `any` or `unknown`.** Always define proper types or use Zod for runtime validation.
    - Prefer `const` over `let`.
    - Use `type` instead of `interface` for all data structures and component props.
- **Inference:** Leverage TypeScript's power. For database operations, infer types directly from Drizzle schemas using `InferSelectModel` and `InferInsertModel`.

## 3. React Frontend (Web)
- **Component Design:** Keep components small and focused. If a component grows too large, break it into smaller sub-components in the same directory or `packages/ui`.
- **Tools:** - **Data Fetching:** Use `react-query` (TanStack Query) for all server state.
    - **Forms:** Use `react-hook-form` integrated with `zod` for validation.
    - **State:** Keep state as local as possible. Use shared types for API responses.

## 4. Backend & API
- **ORM:** Use `drizzle-orm`. Keep schemas clear and use them as the source of truth for types.
- **Validation:** Every API request must be validated at the entry point using `zod`.
- **Readability:** Prioritize standard patterns over clever "one-liners."

## 5. iOS Development (Swift)
- **Human Interface Guidelines (HIG):** Strictly adhere to Apple's HIG. Use standard system fonts, SF Symbols, and native spacing.
- **SwiftUI:** Use modular SwiftUI views. Ensure the app feels "at home" on iOS (e.g., proper use of navigation stacks, sheets, and haptics).
- **Accessibility:** Ensure views support Dynamic Type and have clear labels for VoiceOver.

## 6. Prohibited Patterns
- No "Magic": Avoid complex generic wrappers that obscure what the code is doing.
- No Implicit Any: If the compiler can't infer it, define it explicitly.
- No duplication: If you see the same logic in two `apps/`, suggest moving it to a `package/`.
