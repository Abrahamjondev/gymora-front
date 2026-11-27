# Gymora Frontend Audit Findings

**Audit date:** 2026-07-22
**Branch:** `modification`
**Status:** Audit remediation batch approved and implemented on `modification`; remaining items are explicitly marked below.
**Code changes:** Incremental frontend fixes completed without changing backend contracts.

## Priority scale

- **P0 — Blocker:** page or critical flow is unusable, data is corrupted, or a payment/auth issue is likely.
- **P1 — High:** common user flow is broken or misleading and should be fixed before the next release.
- **P2 — Medium:** noticeable UX/accessibility/performance issue with a practical workaround.
- **P3 — Polish:** low-risk refinement or consistency improvement.

## Findings

Findings below are source- and/or browser-backed. Recommendations are not implementation approval.

### P1 — High-risk / release-blocking candidates

Implementation status: AUD-001 is resolved at the environment-mapping level; AUD-002 is partially addressed by frontend query minimization and still needs a backend public projection; AUD-003 is addressed in the frontend query-state layer.

#### AUD-001 — GraphQL environment mismatch makes the local app look empty

- **Area:** runtime/integration
- **Evidence:** `.env.local:3-4` targets `http://localhost:4001/graphql`; the project instructions describe the backend as `http://localhost:3003/graphql`. During this audit both ports refused connections. On `/community` and `/workout`, the browser logged `[Network error]: TypeError: Failed to fetch` and rendered the empty-state copy.
- **Behavior:** A missing backend is indistinguishable from a successful zero-result response. This blocks trustworthy UI verification and can mislead users into thinking the platform has no content.
- **Likely cause:** frontend environment and current backend runtime are not aligned; the Apollo network-error path only logs to the console.
- **Recommendation:** decide one canonical local API port, make the frontend env and backend startup/compose config agree, then add an explicit development connectivity check. Do not silently change `.env.local` until the canonical port is confirmed.
- **Verification:** query the canonical `/graphql` endpoint, load all four public list pages, confirm no network errors and confirm that an actual empty response is rendered as empty rather than loading.
- **Backend work:** configuration/runtime coordination; no GraphQL contract change required.

#### AUD-002 — Public trainer/member queries request private and credential-bearing fields

- **Area:** privacy/security/data contract
- **Evidence:** frontend `apollo/user/query.ts:9-34` requests `memberPhone`, `memberAddress`, `memberWarnings`, `memberBlocks`, `deletedAt`, and `accessToken` from `GET_TRAINER_MEMBERS`; the same sensitive fields are requested by `GET_MEMBER` around lines 46-78. Backend `apps/gymora-api/src/components/member/member.resolver.ts:80-94` marks both `getMember` and `getTrainerMembers` with `WithoutGuard`. `member.service.ts:198-231` returns a full aggregation result without a public projection. The GraphQL `Member` DTO exposes these fields at `member.ts:21-97`, and phone/address are persisted in `schemas/Member.model.ts:21-68`.
- **Behavior:** An unauthenticated public query is allowed to ask for phone/address and internal moderation fields. `accessToken` must never be part of a public member selection, even if current aggregation documents normally return it as `null`.
- **Likely cause:** admin/profile query fields were reused for public trainer cards instead of using a safe public DTO/selection.
- **Recommendation:** create a backend-safe public member projection/DTO containing only display fields and public counters; remove phone, address, warnings, blocks, deletedAt, and accessToken from public frontend queries. Keep sensitive fields only in authenticated self/admin operations.
- **Verification:** run the exact public query without a bearer token and assert sensitive fields are absent from the schema/response; verify admin/self profile flows still receive the fields they are authorized to use.
- **Backend work:** required for a complete fix; frontend query trimming is necessary but not sufficient if the public GraphQL type still exposes sensitive fields.

#### AUD-003 — Network failures have no inline error or retry state

- **Area:** loading/error UX
- **Evidence:** `apollo/client.ts:46-55` sends GraphQL messages to a global alert but only `console.log`s `networkError`. `pages/workout/index.tsx:62-75` reads `error` but never renders it. Course, trainer, and community list pages do not render query errors. Their empty-state branches (`workout:341`, `course:295`, `trainer:236`, `community:218-223`) can appear after a failed request.
- **Behavior:** The user sees a spinner, stale content, or “no results” with no actionable retry. Global toasts are not a durable state and are suppressed for some messages.
- **Likely cause:** each page owns list state, while Apollo’s global error link has no reusable UI-level query state.
- **Recommendation:** add a reusable `ListState`/`QueryState` pattern with first-load skeleton, refetch busy indicator, translated error copy, and a retry button wired to `refetch`. Preserve stale cards during refetch but visually mark the list busy. Do not rely on console output for user recovery.
- **Verification:** abort/mock the GraphQL request for each list page; confirm error state, retry, loading-to-empty transition, and stale-data behavior.
- **Backend work:** no contract change required.

### P2 — Medium-priority functional, UX, and accessibility issues

Implementation status: AUD-004, AUD-005, AUD-006, AUD-007, AUD-008, AUD-009, AUD-010, and AUD-012 are addressed in the approved frontend batch. AUD-011 remains open because the safe regex/search change belongs in the backend service layer.

#### AUD-004 — Mobile hydration mismatch in the shared layout

- **Area:** SSR/responsive rendering
- **Evidence:** `libs/hooks/useDeviceDetect.ts:3-17` returns `desktop` during SSR but reads `matchMedia` immediately in the browser. `libs/components/layout/LayoutBasic.tsx:50-85` renders different root IDs and trees (`pc-wrap` vs `mobile-wrap`) from that value. At 390px, the browser console reported: `Prop id did not match. Server: "pc-wrap" Client: "mobile-wrap"`.
- **Behavior:** React must reconcile different server/client trees. This can cause hydration warnings, duplicated or stale attributes, layout flicker, and unreliable screen-reader/automation output.
- **Recommendation:** keep one hydration-stable shell and use CSS media queries for layout differences, or render a hydration-safe placeholder until the client device value is known. Avoid branching the entire page tree on a client-only media query.
- **Verification:** reload all public routes at 390px and desktop width; require zero hydration warnings and identical semantic root structure.
- **Backend work:** no.

#### AUD-005 — Successful empty results are labeled as “loading” forever

- **Area:** list status copy
- **Evidence:** `pages/workout/index.tsx:212-215`, `pages/course/index.tsx:146-149`, `pages/trainer/index.tsx:149-152`, and `pages/community/index.tsx:154-157` choose the badge by `total > 0`, otherwise using `loading*`. They do not include a loaded/empty branch.
- **Behavior:** A successful response with zero records displays both a “LOADING …” badge and a no-results panel. This was observed on `/course` after the request settled.
- **Recommendation:** drive the badge from query status: `loading` → loading copy, `!loading && total > 0` → count, `!loading && total === 0` → translated empty copy. Keep the empty state distinct from transport errors.
- **Verification:** mock `metaCounter.total = 0` with HTTP 200 and confirm the badge changes to the empty state; repeat for all four lists and all locales.
- **Backend work:** no.

#### AUD-006 — Applying a filter does not return the viewport to the results start

- **Area:** filter navigation
- **Evidence:** `libs/hooks/useUrlFilter.ts:42-50` updates the URL with `scroll: false`, and there is no scroll-to-results behavior in the list handlers. The filter console is sticky in `scss/workout.scss:73-88` and mobile `3618-3625`, but sticky positioning does not reset the user’s current scroll position.
- **Behavior:** A user deep in a long result list changes a category/sort/search filter and remains at the old scroll position, potentially looking at the middle or bottom of a newly replaced list.
- **Recommendation:** after filter/search/sort changes, scroll a stable results anchor to the top (smoothly where appropriate). Keep pagination behavior separate so page changes do not unexpectedly jump unless desired. The shared hook is the right place for this policy.
- **Verification:** seed enough results to scroll, move to the lower half, apply each filter type, and assert the result anchor is visible at the top.
- **Backend work:** no.

#### AUD-007 — Filter controls are not fully accessible or semantically interactive

- **Area:** accessibility/keyboard UX
- **Evidence:** list pages render native `.wl-sort` selects without `aria-label` or an associated `<label>` (`workout:240`, `course:174`, `trainer:177`, community equivalent). The browser snapshot showed an unnamed `combobox`. Segmented/category buttons use only the `is-active` class (`course:186-208`) and do not expose `aria-pressed`. Search clear controls are clickable `<span>` elements (`workout:228-237`, `course:162-171`, `trainer:165-175`). Result cards are clickable `<div>` elements (`workout:293`, `course:243-254`, `trainer:190`, `community:229-234`). `LikeButton` chip variant is also a clickable `<span>` at `libs/components/common/LikeButton.tsx:61-90`.
- **Behavior:** keyboard users cannot reliably discover the sort purpose, selected filter state, clear action, or card activation. Focus and Enter/Space behavior is inconsistent.
- **Recommendation:** use a shared filter component. MUI `Select` with `InputLabel`/`labelId` or an explicit translated `aria-label` is appropriate; MUI `ToggleButtonGroup`/`Chip` can provide state semantics, but native controls are also fine when labeled. Replace clickable spans/divs with buttons/links and give like controls translated labels and pressed state.
- **Verification:** run keyboard-only tab/Enter/Space checks and an accessibility snapshot on all four lists at desktop/mobile widths.
- **Backend work:** no.

#### AUD-008 — URL filter state is parsed without schema validation

- **Area:** URL state/data integrity
- **Evidence:** `libs/hooks/useUrlFilter.ts:26-35` performs `JSON.parse(raw) as T` with no runtime validation, enum whitelist, page/limit bounds, or nested `search` normalization. Backend DTOs validate values only after the request reaches GraphQL.
- **Behavior:** a shared or manually edited URL can inject invalid page/limit/sort/direction/search shapes, producing backend validation errors or broken controls. The current list pages then have no inline retry/error state.
- **Recommendation:** normalize the parsed URL against each list’s known defaults and allowed enum values; clamp page/limit and discard unknown fields before setting state. Keep backend validation as the final authority.
- **Verification:** test malformed JSON, arrays, invalid sort/direction, negative pages, oversized limits, and unknown search fields; require a safe default request and no uncaught UI error.
- **Backend work:** no contract change; backend validation remains required.

#### AUD-009 — Expired sessions have no recovery path

- **Area:** authentication reliability
- **Evidence:** backend JWTs expire after 30 days in `apps/gymora-api/src/components/auth/auth.module.ts:11-22`. Frontend `apollo/client.ts:19-27` hard-codes token validity to `true` and returns `null` from `fetchAccessToken`; its network error path only logs. `LayoutBasic.tsx:45-48` decodes any stored token on mount without an expiry/recovery branch.
- **Behavior:** after expiry, authenticated operations can fail while the stale token and user state remain in local storage/reactive state. The user is not automatically logged out or sent to sign-in.
- **Recommendation:** implement one explicit recovery policy: refresh if the backend supports it, otherwise detect `UNAUTHENTICATED`/401 centrally, clear token/user state, and redirect once to sign-in with a translated message. Add a safe decode/expiry guard for malformed local storage tokens.
- **Verification:** use an expired/malformed test token on a private route and confirm one clean recovery without redirect loops or repeated alerts.
- **Backend work:** refresh requires backend support; logout-on-expiry can be frontend-only.

#### AUD-010 — Detail pages silently lose secondary sections on query failure

- **Area:** partial loading/error states
- **Evidence:** `pages/trainer/detail.tsx:75-140` tracks loading only for member/trainer, while workouts, courses, reviews, articles, followers, and followings have no rendered error/loading state. `pages/course/detail.tsx:99-104` ignores trainer query loading/error. `pages/community/detail.tsx:69-81` and `pages/workout/detail.tsx:88-93` do not expose review/comment query errors in the page state.
- **Behavior:** the main profile/article/workout can render while related sections silently disappear, making a backend or authorization failure look like “no content.”
- **Recommendation:** give each secondary section a compact skeleton, empty state, and retry affordance; keep the primary entity state separate so one failed subsection does not blank the whole page.
- **Verification:** fail each secondary query independently and confirm an explanatory section state plus retry.
- **Backend work:** no.

#### AUD-011 — Search input can generate invalid or expensive backend regexes

- **Area:** cross-layer search robustness
- **Evidence:** backend services construct raw regexes from user text, for example `course.service.ts:85-86`, `workout.service.ts:121-125`, `member.service.ts:208`, and `board-article.service.ts:59`. The frontend submits free-form search strings from the four list pages.
- **Behavior:** characters such as `[` can make a regex invalid; complex patterns can be expensive. The request then becomes a server error or slow query instead of a normal “no matches” result.
- **Recommendation:** escape user text before building a literal case-insensitive regex (or use a safer indexed search strategy), trim and length-limit the frontend input, and preserve the reusable error/retry state.
- **Verification:** search for regex metacharacters, long input, Unicode, and empty/whitespace input on every list.
- **Backend work:** recommended; frontend length/trim guard is supplementary.

#### AUD-012 — Homepage sections disappear without loading/error feedback

- **Area:** landing content resilience
- **Evidence:** `HotWorkouts.tsx:17-23`, `TopCourses.tsx:27-33`, `EliteTrainers.tsx:18-24`, and `CommunityPulse.tsx:28-34` keep local arrays and `return null` when empty. No query error or section-level fallback is rendered.
- **Behavior:** during a slow/failing backend response, the landing page has unexplained holes; users cannot tell whether content is loading, unavailable, or intentionally omitted.
- **Recommendation:** add stable section skeletons while loading and a restrained translated fallback/error state after failure. If intentional hiding is preferred, reserve the layout space or use a consistent “currently unavailable” pattern so the page does not jump.
- **Verification:** throttle and fail each homepage query independently; confirm layout stability and an understandable state.
- **Backend work:** no.

### P3 — Polish and maintainability backlog

#### AUD-013 — Lint warnings should be reduced in focused passes

- **Evidence:** `yarn lint` and `yarn build` pass, but report missing hook dependencies across list/detail/admin/auth pages and many `@next/next/no-img-element` warnings. Examples include `pages/course/index.tsx:71`, `pages/trainer/index.tsx:73`, `pages/workout/index.tsx:82`, and repeated `<img>` warnings across detail/admin/MyPage pages.
- **Recommendation:** fix hook dependency warnings with intentional stable callbacks or documented one-time effects; migrate high-impact images to `next/image` with controlled remote/local sources. Treat this as a separate cleanup batch so functional fixes remain easy to review.

## Verified but not promoted to a bug

- The course/trainer list pages contain an effect that calls `refetch` when `searchFilter` changes while `useQuery` also receives `variables`. A mocked browser trace showed one POST on initial load and one POST after a filter change, so Apollo deduplication prevented a confirmed duplicate network request in the current runtime. It is still a cleanup candidate, not a release finding.
- The filter console is already sticky on desktop/mobile (`scss/workout.scss`); the missing behavior is scroll reset after applying a filter, not absence of a sticky panel.

## Deferred / needs user decision

- **AUD-002:** requires backend-safe public member projection and an agreed list of fields that are intentionally public.
- **AUD-003/AUD-009:** choose one shared error/session-recovery UX and translation copy before implementation.
- **AUD-006:** choose smooth scroll versus instant scroll and whether pagination should also reset the viewport.
- **AUD-007:** choose whether to standardize on MUI controls or keep native controls with a shared accessible wrapper.
- **AUD-011:** choose literal escaped search versus a backend indexed search change.

## Verification log

| Check | Result | Notes |
| --- | --- | --- |
| Documentation structure | Passed | Audit docs and approval policy created under `gymora/docs/ai/` |
| Backend contract review | Passed | NestJS DTOs, resolvers, services, auth, and member schema inspected; live remote GraphQL selections were verified against `http://187.77.111.100:4001/graphql` |
| Browser/runtime sweep | Partially passed | Official in-app browser runtime had no available browser session; static build/type checks and direct live GraphQL checks passed. |
| `yarn i18n:check` | Passed | 10 namespaces × 3 locales in sync |
| `yarn lint` | Passed with warnings | Existing hook-dependency and `<img>` warnings remain |
| `yarn build` | Passed with warnings | Production build compiled and generated all 90 static pages |
| `yarn tsc --noEmit` | Passed | No TypeScript errors |
| `git diff --check` | Passed | No whitespace errors |
