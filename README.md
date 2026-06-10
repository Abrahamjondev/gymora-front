# Gymora — Elite Training Platform

A premium dark-themed fitness platform where athletes train with verified coaches: structured workout protocols, multi-week training programs with video lessons, AI-assisted nutrition planning, real-time chat, and a knowledge-sharing community.

Frontend client for the Gymora API (NestJS · GraphQL · MongoDB · Socket.IO · Stripe).

## Features

**For athletes**
- Workout library with difficulty/muscle-group filtering, search, sorting, likes and reviews
- Multi-week training programs with video lessons (YouTube/Vimeo/direct), lesson progress tracking and Stripe checkout
- Trainer roster with verified profiles, follower system, ratings and direct messaging
- AI nutrition planner (BMI/BMR/TDEE, macro targets), meal logging with AI food-photo scanning, weekly/monthly/yearly history charts
- Progress tracker with weight trend visualization
- Real-time chat (Socket.IO) with online presence
- Community articles with a rich-text editor, comments and cross-member notifications
- Monthly/yearly subscription via Stripe

**For trainers**
- Trainer studio: create/edit workouts and programs, lesson manager, free-slot counter
- Public profile with specializations, social links, articles, followers
- Trainer verification flow (admin-reviewed)

**For admins**
- Full moderation console: users, trainers (verify/reject), workouts, programs + lessons, community

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (pages router, SSG + i18n) |
| Language | TypeScript |
| Data | Apollo Client (GraphQL), graphql-upload multipart |
| Realtime | Socket.IO client |
| UI | Custom SCSS design system, MUI primitives, Toast UI Editor |
| Payments | Stripe Checkout (server-created sessions) |

## Getting Started

```bash
yarn install
yarn dev        # http://localhost:3000
```

### Environment

Create `.env` (see `next.config.js` for the mapping):

| Variable | Example | Purpose |
| --- | --- | --- |
| `REACT_APP_API_URL` | `http://localhost:3003` | REST/file base URL |
| `REACT_APP_GRAPHQL_URL` | `http://localhost:3003/graphql` | GraphQL endpoint |
| `REACT_APP_API_WS` | `ws://localhost:3003` | Socket.IO endpoint |

The Gymora API server must be running (see the backend repository).

### Scripts

```bash
yarn dev      # development server
yarn build    # production build
yarn start    # serve production build
```

## Project Structure

```
apollo/          GraphQL operations (user + admin) and Apollo client setup
libs/
  components/    UI components (layout, common, homepage, mypage, community, admin)
  hooks/         useSocket, useDeviceDetect, ...
  types/         TypeScript models mirroring backend DTOs
  enums/         Enums mirroring backend GraphQL enums
pages/           Next.js routes (workout, course, trainer, community, mypage, _admin, ...)
scss/            Design system (landing.scss, workout.scss + page systems)
```

## Design System

Dark premium theme — background `#0d0d0e`, cyan `#00dce5` primary accent, Hanken Grotesk + JetBrains Mono. Fully responsive including mobile navigation and a responsive admin console.
