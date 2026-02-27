# Life OS

A personal time tracking app that logs your entire 24-hour day in 30-minute increments. Track how you actually spend your time, analyze patterns, and plan future weeks.

## Features

- **Log** — 48-slot daily grid for logging activities in 30-minute blocks. Click a slot to assign a category and add notes. Shift+click for multi-select, number keys 1-9 for quick assignment.
- **Analytics** — Pie charts, bar charts, and trend lines for daily, weekly, monthly, and yearly breakdowns.
- **Planning** — Set weekly hour goals per category with sliders, seeded from the previous week's actuals. Live pie chart shows planned distribution.
- **Categories** — 13 defaults (Sleep, Deep Work, Meetings, Exercise, etc.), fully customizable with a curated color palette.
- **Light/Dark/System mode** — Theme toggle in the header, persisted to localStorage.
- **Responsive** — Sidebar nav on desktop, bottom tabs on mobile.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Routing:** TanStack Router (file-based, auto code-splitting)
- **Backend:** Convex (real-time cloud database)
- **UI:** shadcn/ui, Tailwind CSS v4, Recharts
- **Fonts:** Geist Sans + Geist Mono

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://www.convex.dev/) account

### Setup

```bash
npm install
```

Create a `.env.local` file with your Convex deployment URL:

```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Start the Convex dev server (in a separate terminal):

```bash
npx convex dev
```

Start the app:

```bash
npm run dev
```

Categories are auto-seeded on first load.

## Project Structure

```
convex/           # Backend schema, queries, and mutations
  schema.ts       # categories, timeSlots, weeklyGoals tables
  categories.ts   # CRUD + seed
  timeSlots.ts    # getByDate, upsert, bulkAssign, summaries
  weeklyGoals.ts  # getByWeek, upsert, seedFromPreviousWeek
src/
  components/
    layout/       # AppShell, Sidebar, MobileNav
    log/          # TimeGrid, TimeSlotRow, DayNavigator, MultiSelectBar
    analytics/    # CategoryPieChart, TrendLineChart, DateRangeFilter
    planning/     # WeeklyGoalSliders, GoalPieChart, PeriodSelector
    categories/   # CategoryManager, CategoryBadge, CategoryPicker
    theme/        # ThemeProvider, ThemeToggle
    ui/           # shadcn components
  routes/         # TanStack Router file-based routes
  lib/            # utils, constants, dateUtils, slotUtils, chartUtils
```

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start dev server                    |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview production build            |
| `npx convex dev`  | Start Convex dev server             |
