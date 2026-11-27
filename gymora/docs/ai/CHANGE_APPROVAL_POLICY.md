# Frontend Change Approval Policy

## Required sequence

Every requested frontend modification follows this sequence:

1. Inspect the relevant frontend and backend source first.
2. Write a concise implementation plan with files, behavior changes, risks, and verification steps.
3. Show the plan to the user and explicitly request approval.
4. Wait for approval before editing code, styles, GraphQL operations, or locale files.
5. Implement only the approved scope in small phases.
6. Run the relevant checks after each phase and report any pre-existing warnings separately.
7. Update the audit/task documentation when the change is material.

## Current audit exception

The user explicitly authorized creation of the audit documentation and a read-only bug/UX investigation before approval. The current audit may add or update Markdown reports, but it must not modify application code until the user approves a concrete plan.

## Approval record

For each implementation phase, record:

- the approved scope;
- the files allowed to change;
- the checks to run;
- any intentionally deferred findings.

No approval is inferred from a request to investigate, report, or recommend.
