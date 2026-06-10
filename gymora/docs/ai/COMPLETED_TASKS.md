# Completed Tasks

## 2026-06-10

- Landing page premium redesign: full-bleed athletic hero photo with editorial typography and count-up stats, discipline marquee, bento workout grid, agency-style trainer list with hover portrait, new HowItWorks / CommunityPulse / Pricing sections (all driven by existing public backend queries; pricing mirrors canonical PLAN_PRICES). AthleteReviews and FinalCTA sections were removed on user request; Top Courses rebuilt as spotlight feature card + ranked rows.
- New `scss/landing.scss` design system with full mobile responsiveness (1024/768/640 breakpoints); hovers moved from JS handlers to CSS; scroll-reveal via IntersectionObserver (`useReveal`), animated counters (`useCountUp`).
- GymNavbar center nav hidden on ≤768px (overflowed on phones). TypeScript 0 errors; no GraphQL operations changed.
- Navbar redesigned: slim 62px bar, mono-uppercase links with animated underline, user chip (avatar+nick+logout in one pill), `overlay` prop so the landing hero bleeds under a transparent navbar. Footer redesigned: 4 link columns, giant outlined GYMORA watermark, "Back to top" button.
- Follow-up: watermark removed, navbar links/nick/logout made bolder and larger for readability.
- Workout Library page redesigned (`scss/workout.scss`): editorial hero with live protocol count, sticky glass filter console (segmented difficulty + muscle chips + search + sort), image-forward cards with KCAL badge and difficulty color dots, shimmer skeletons; FREE/PREMIUM emoji badge removed; mobile placeholder replaced with fully responsive layout; mobile horizontal overflow fixed. Apollo logic unchanged.
- Workout Detail page redesigned in the same style: cinematic hero with back pill/chips/editorial title, sticky summary sidebar with difficulty color dot, hover-slide training plan rows, glass comment/review form cards with focus rings and star picker; mobile placeholder removed, fully responsive (sidebar stacks above content). Apollo logic unchanged.
- Trainers page redesigned: editorial hero with live roster badge, glass search console with new sort dropdown (whitelist-verified: memberRank/memberLikes/memberViews/createdAt), portrait cards (grayscale→color CSS hover, rank chip, overlay name/desc, bold meta), real-data stats bar (fake "COMMUNITY: Active" removed); mobile placeholder removed, fully responsive. Optimistic like logic unchanged.
- Trainer Detail redesigned + logic gaps fixed: routing corrected (list/landing now reach /trainer/detail instead of /member), review form now mirrors backend permissions (purchase-required via GET_MEMBER_PURCHASED_COURSES + already-reviewed detection), social links / rating count / rank / views now displayed, course rows with thumbnails, all workouts shown, sticky profile card design, follow busy-guard. Backend evidence: review.service.ts permission checks.
- Trainer Detail follow-up: Articles section (GET_BOARD_ARTICLES search.memberId), tabbed Followers/Following panel in sidebar (GET_MEMBER_FOLLOWERS/GET_MEMBER_FOLLOWINGS — guards and FollowSearch fields verified), person rows route by memberType.
- /member page placeholders ("will be implemented with migration") replaced with real Followers/Following/Articles tabs using the same public queries; page redesigned to td-* system; TRAINER profiles auto-redirect to /trainer/detail.
- Naming unified to "Programs" across UI (backend stays `course`): landing "Top Courses" → "Top Programs", trainer detail and copy updated. /course page redesigned: editorial hero with live count, glass console (difficulty seg + category buttons with colored dots), category-accent cards (CSS vars drive hover glow/border/CTA color), shimmer skeletons, fully responsive, mobile placeholder removed.

## 2026-06-09

- Investigated workout like persistence against the Gymora backend source.
- Fixed workout list/detail like UI so optimistic liked state is preserved and rolled back on mutation errors.
- Added authenticated-user refetches on workout list/detail pages so refreshed pages reload `meLiked` after `userVar` is restored from the stored JWT.
