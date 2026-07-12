# UpLift

Make the gym feel like a game. UpLift is a gamified workout tracker with a Clash Royale-inspired cartoon UI: build workout templates ("decks"), battle through gym sessions, earn XP, keep streaks alive, and open chests on victory screens.

## Stack

- **App**: React Native + Expo (TypeScript), Expo Router
- **State**: Zustand (session state) + TanStack Query (server state)
- **Backend**: Supabase (Postgres, Auth, Realtime) with Row Level Security
- **Caching**: TanStack Query in-memory cache persisted to AsyncStorage; in-progress workouts buffered locally with zero API calls until finish
- **Game feel**: Reanimated 3 springs, Lottie celebrations, expo-haptics

## Getting started

```bash
npm install
npx expo start
```

Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key.

## Project structure

```
app/                  # Expo Router screens
src/
  components/         # Design system (GameButton, GameCard, XPBar, ...)
  features/
    gym/              # Templates, exercise library, active workout
    gamification/     # XP engine, PR detection, levels, streaks (pure TS)
    profile/          # Player level, badges, stats
  lib/                # Supabase client, query client, key-value storage
  repositories/       # All Supabase access goes through here
  stores/             # Zustand stores
theme/                # Colors, typography, spacing tokens
```

## Planning board

Full product plan (flows, data model, architecture, gamification design, roadmap):
https://miro.com/app/board/uXjVHDF3f5c=/
