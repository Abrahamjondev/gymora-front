# Completed Tasks

## 2026-06-09

- Investigated workout like persistence against the Gymora backend source.
- Fixed workout list/detail like UI so optimistic liked state is preserved and rolled back on mutation errors.
- Added authenticated-user refetches on workout list/detail pages so refreshed pages reload `meLiked` after `userVar` is restored from the stored JWT.
