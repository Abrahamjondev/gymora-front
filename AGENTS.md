# Gymora Frontend Modification Instructions

This client project is being migrated from nestar-next to gymora-next

## Rules

- Preserve current project architecture
- Keep GraphQL/Apollo integration
- Do not rewrite the whole app
- Improve UI incrementally

## Backend Context

Before making any changes, analyze the actual backend source code.

Read and inspect:

- GraphQL schema definitions
- DTOs
- Input types
- Entity models
- Resolvers
- Services
- Enums
- Payment integration
- Subscription logic

Build an understanding of the backend directly from the source code.

Do not assume any field, enum, filter, pricing plan, mutation, or query exists unless it is found in the backend code.

When UI and backend conflict:

- Backend is the source of truth.
- Update the UI to match backend behavior.
- Do not modify backend contracts unless explicitly requested.

Always verify:

- GraphQL query names
- Mutation names
- Input DTO fields
- Enum values
- Subscription plans
- Payment flow
- Profile fields
- Community categories
- Nutrition activity levels

Analyze first, then make incremental UI changes.

## Workflow

1. Analyze before editing.
2. Backend is running on port http://localhost:3003/graphql now.
3. Make small incremental changes.
4. Run typecheck after each phase.
5. Do not remove working logic unless replaced safely.
6. Update gymora/docs/ai/COMPLETED_TASKS.md after major changes if cannot find just create those folder and files

## Package Manager

- Use Yarn for all frontend command.
- Do not use npm or pmpm.
- Install dependencies with:

```bash
yarn
```

## i18n (MANDATORY for all new code)

The app is trilingual: `en` (default), `ru`, `uz` — next-i18next, sub-path routing (`/ru/...`, `/uz/...`), `localeDetection: false` with the choice persisted in the `NEXT_LOCALE` cookie (restored in `_app.tsx`).

Rules:

1. NEVER hard-code user-facing text in JSX. Always `const { t } = useTranslation('<namespace>')` + `t('key')`. ESLint (`i18next/no-literal-string`) warns on violations.
2. Every new key MUST be added to ALL THREE locale files: `public/locales/{en,ru,uz}/<namespace>.json`. `yarn i18n:check` fails the build/lint if locales drift; `yarn i18n:report` prints coverage.
3. Namespaces: `common` (nav/footer/shared actions/stats/titles + global `alerts.*` used by `Messages` in libs/config.ts), `landing`, `workout`, `program`, `trainer`, `community`, `mypage`, `auth`, `static`, `enums` (backend enum display names). Page/feature-specific alert strings live in that feature's own namespace under `alerts.*`. Pages must list every namespace they use in `serverSideTranslations(locale, [...])`.
4. Key naming: nested camelCase (`list.title`, `detail.trainingPlan`), interpolation via `{{var}}`. Do NOT use English sentences as keys. Plurals: use explicit `xCount`/`xCountOne` key pairs selected in code — i18next `_one/_few/_many` suffixes break the check-locales key-parity validator.
   Non-React code (sweetAlert.ts, config.ts) translates via `import { i18n } from 'next-i18next'` + `i18n?.t('common:...', { defaultValue })` — only `common` keys are guaranteed loaded everywhere.
5. Backend enum values (BEGINNER, STRENGTH, ...) are displayed through `enums.json` keys but sent to the API unchanged.
6. The admin panel (`pages/_admin`, `LayoutAdmin`) stays English — excluded from the lint rule.
7. User-generated content from the DB (workout titles, articles, bios) is NOT translated — UI chrome only.
