# Completed Tasks

## 2026-06-10

- Landing page premium redesign: full-bleed athletic hero photo with editorial typography and count-up stats, discipline marquee, bento workout grid, agency-style trainer list with hover portrait, new HowItWorks / CommunityPulse / Pricing sections (all driven by existing public backend queries; pricing mirrors canonical PLAN_PRICES). AthleteReviews and FinalCTA sections were removed on user request; Top Courses rebuilt as spotlight feature card + ranked rows.
- New `scss/landing.scss` design system with full mobile responsiveness (1024/768/640 breakpoints); hovers moved from JS handlers to CSS; scroll-reveal via IntersectionObserver (`useReveal`), animated counters (`useCountUp`).
- GymNavbar center nav hidden on ≤768px (overflowed on phones). TypeScript 0 errors; no GraphQL operations changed.
- Navbar redesigned: slim 62px bar, mono-uppercase links with animated underline, user chip (avatar+nick+logout in one pill), `overlay` prop so the landing hero bleeds under a transparent navbar. Footer redesigned: 4 link columns, giant outlined GYMORA watermark, "Back to top" button.

## 2026-06-09

- Investigated workout like persistence against the Gymora backend source.
- Fixed workout list/detail like UI so optimistic liked state is preserved and rolled back on mutation errors.
- Added authenticated-user refetches on workout list/detail pages so refreshed pages reload `meLiked` after `userVar` is restored from the stored JWT.
