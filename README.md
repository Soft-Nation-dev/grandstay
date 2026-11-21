# Guestly

Guestly is a hotel guest experience platform built as part of a team project. The idea is to make a hotel stay easier, from finding a room and making a reservation to checking in, requesting services and talking to the concierge.

The frontend also gives hotel staff, managers and super admins their own workspaces to handle the day-to-day operations behind the guest experience.

## Try it out

[Open Guestly](https://soft-nation-dev.github.io/guestly/)

You can browse rooms without an account. To explore the dashboards, head to the sign-in page and choose one of the four preview accounts.

## Running the project locally

Make sure Node.js is installed, then clone the repository and run:

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

## Backend connection

The frontend now includes a typed API client in `services/api-client.ts`. Its request and error handling follow the backend's existing `{ success, message, data }` response format. For local integration, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend origin, normally `http://localhost:4000`. The deployed static site does not use a backend URL yet, so the existing demonstration continues to work until each live feature is connected and tested. No backend keys or secrets belong in the frontend.

The backend API contract and CORS configuration are documented in the backend repository under `docs/api-contract.md`. Run `npm run test:api` to check the client contract without needing a deployed server.

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
