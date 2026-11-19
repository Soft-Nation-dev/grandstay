# GrandStay

GrandStay is a hotel guest experience platform built as part of a team project. The idea is to make a hotel stay easier, from finding a room and making a reservation to checking in, requesting services and talking to the concierge.

The frontend also gives hotel staff, managers and super admins their own workspaces to handle the day-to-day operations behind the guest experience.

## Try it out

[Open GrandStay](https://soft-nation-dev.github.io/grandstay/)

You can browse rooms without an account. To explore the dashboards, head to the sign-in page and choose one of the four preview accounts.

## Running the project locally

Make sure Node.js is installed, then clone the repository and run:

```bash
git clone https://github.com/Soft-Nation-dev/grandstay.git
cd grandstay
npm ci
npm run dev
```

Open http://localhost:3000 in your browser.

## How the project is organized

- `app/` contains the pages and routes.
- `components/` contains reusable interface elements and feature screens.
- `data/mock.ts` holds the starting sample data.
- `services/` and `hooks/` handle data access and updates.
- `types/` and `lib/` hold shared data definitions and application logic.
- `public/images/` contains the hotel photographs and design assets.
- `tests/` contains the automated browser checks.

## Where we are now

The frontend is ready for the team to explore and integrate. For now, accounts, reservations and other records are kept in the browser. Payment, identity review and room access are simulated, so please use fictional details.

When the backend is ready, we can connect it through the existing services and hooks instead of rebuilding the pages. Real authentication, permissions, room availability, payment verification, private document storage and shared records will need to be handled by the backend.

## Checking and deploying changes

```bash
npm run lint
npm run build
```

GitHub Actions runs the frontend checks and prepares a static GitHub Pages build. GitHub Pages hosts the frontend only; a live backend will need its own hosting. The normal Next.js development setup is kept separate from the static build.

Built with Next.js, React, TypeScript and Tailwind CSS.
