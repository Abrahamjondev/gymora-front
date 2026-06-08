# Gymora Frontend Modification Instructions

This client project is being migrated from nestar-next to petoria-next

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
