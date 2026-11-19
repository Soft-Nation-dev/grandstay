# Guestly

Guestly is a hotel guest experience platform built as part of a team project. The idea is to make a hotel stay easier, from finding a room and making a reservation to checking in, requesting services and talking to the concierge.

The frontend also gives hotel staff, managers and super admins their own workspaces to handle the day-to-day operations behind the guest experience.

## Try it out

The site is moving to [Guestly](https://soft-nation-dev.github.io/guestly/). Until the repository rename is complete, use the [current website](https://soft-nation-dev.github.io/grandstay/).

You can browse rooms without an account. To explore the dashboards, head to the sign-in page and choose one of the four preview accounts.

## Running the project locally

Make sure Node.js is installed, then clone the repository and run these commands once the repository rename is complete:

```bash
git clone https://github.com/Soft-Nation-dev/guestly.git
cd guestly
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

## Hotel dataset

The original cleaned hotel workbook is now represented by four JSON files in `data/hotel-dataset/`. We kept the original values, converted Excel dates to readable ISO dates and included each source sheet once. The analysis workbook is a reference, not a second set of bookings.

`services/hotel-dataset.ts` is the entry point for reading and summarising the records. Staff and managers can browse the imported history, and the manager dashboard calculates its figures from the records. The guest preview is linked to sample profile G0072 for previous reservations and recommendations. New bookings and live actions remain separate from the imported records.

During backend integration, upload the workbook at the backend, agree on validation and reconciliation rules, and replace the dataset service with API calls. Keep the original statuses and source IDs; do not convert imported payments or bookings into verified transactions or active room allocations without validation. No real accounts or access credentials are created from this dataset.

## Checking and deploying changes

```bash
npm run lint
npm run build
```

GitHub Actions runs the frontend checks and prepares a static GitHub Pages build. GitHub Pages hosts the frontend only; a live backend will need its own hosting. The normal Next.js development setup is kept separate from the static build. The Pages build uses the repository name to set the base path automatically.

Built with Next.js, React, TypeScript and Tailwind CSS.
