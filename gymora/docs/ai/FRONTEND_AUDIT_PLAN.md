# Gymora Frontend Audit Plan

**Date:** 2026-07-22
**Branch:** `modification`
**Mode:** Read-only investigation until user approval

## Objective

Find concrete functional bugs, loading-state gaps, filter behavior problems, mobile/responsive regressions, and high-value UX improvements across the Gymora frontend without changing application code.

## Audit lanes

### 1. Backend contract and data flow

- Verify queries, mutations, inputs, enums, pagination, permissions, payment, subscription, nutrition, and community behavior against the NestJS backend source.
- Trace Apollo variables, cache policies, refetch behavior, and error handling from page to rendered state.

### 2. Loading, error, and empty states

- Check first render, cache-and-network transitions, skeleton coverage, empty results, failed requests, stale data, and retry paths.
- Identify places where buttons, filters, or cards are interactive before data is ready.

### 3. Filters and navigation

- Check MUI/native controls, dropdown positioning, keyboard behavior, selected-state persistence, URL synchronization, reset behavior, and pagination interaction.
- Verify that applying a filter returns the user to the correct scroll position and does not leave stale result lists visible.

### 4. Responsive and interaction behavior

- Check desktop, tablet, and mobile widths for overflow, clipped controls, sticky/fixed collisions, modal reachability, body scroll lock, and touch targets.
- Check navbar/menu transitions, focus states, image framing, and reduced-motion behavior.

### 5. i18n, accessibility, and content integrity

- Find hard-coded UI strings, missing locale keys, awkward translations, incorrect plural behavior, missing labels/roles, and low-contrast or keyboard-inaccessible controls.

### 6. Performance and maintainability

- Look for duplicate requests, effects with unstable/missing dependencies, unnecessary rerenders, unoptimized hero assets, unsafe optimistic updates, and repeated UI logic that should be centralized.

## Evidence standard

Each finding must include:

- ID and priority (`P0`–`P3`);
- exact file and line/component;
- observed behavior;
- reproduction steps or static evidence;
- likely cause;
- recommended fix;
- verification plan;
- whether it requires backend work or is frontend-only.

## Deliverable

The result goes into [FRONTEND_AUDIT_FINDINGS.md](./FRONTEND_AUDIT_FINDINGS.md). Code changes begin only after the user approves a selected set of findings and the associated implementation plan.
