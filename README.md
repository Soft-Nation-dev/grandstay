# Guestly Frontend

Guestly is a hotel website and guest dashboard. Guests can view rooms, book a stay, check in, request services and use the concierge. Hotel staff and managers also have their own pages for daily hotel work.

## Open the website

[Guestly website](https://soft-nation-dev.github.io/guestly/)

The website can still run as a demo when no backend address has been added. The demo uses sample data. Payments, check-in approvals and door access in demo mode are not real.

## Run the frontend on your computer

- Install Node.js 22.
- Clone the repo and open the Guestly folder.
- Run `npm ci`.
- Run `npm run dev`.
- Open `http://localhost:3000`.

To connect your local frontend to a running backend:

- Copy `.env.example` to `.env.local`.
- Set `NEXT_PUBLIC_API_URL=http://localhost:4000`, or use the backend's actual origin.
- Restart the Next.js development server.
- Check the login, rooms, checkout, check-in, services and manager pages.

## Connect the published website

The GitHub Pages workflow is ready to read the backend address from the repository's Actions variables.

- Deploy the backend to an HTTPS address first.
- Open this GitHub repository's **Settings > Secrets and variables > Actions > Variables**.
- Add a repository variable named `NEXT_PUBLIC_API_URL`.
- Set the value to the backend origin, for example `https://api.example.com`. Do not add `/api/v1` at the end.
- Make sure the backend allows `https://soft-nation-dev.github.io` in its CORS settings.
- Run the **GitHub Pages** workflow again from the Actions tab, or push a new commit to `main`.
- Open the published website and confirm it now uses real accounts and backend records.

Only the public backend URL should go into `NEXT_PUBLIC_API_URL`. Never put JWT secrets, database passwords, Paystack secret keys or other private values in a frontend variable.

## Test the frontend

Run these commands from the frontend folder:

```bash
npm ci
npm run test:api
npm run lint
npm run build
```

The GitHub Actions checks also run browser tests for the demo and the connected API screens. The connected browser checks use a local test fixture and are not a replacement for trying the deployed backend.

## Main project folders

- `app/` - website pages.
- `components/` - page sections and dashboard screens.
- `services/` and `hooks/` - API calls and UI data handling.
- `types/` and `lib/` - shared types and helpers.
- `public/images/` - hotel pictures.
- `tests/` - automated frontend tests.
- `data/hotel-dataset/` - sample historical data used by the demo.

## Before going live

- Check that the backend has a working database connection.
- Test registration, login and each account role.
- Make a test reservation and complete payment using Paystack's test mode.
- Check that the booking updates only after verified payment.
- Check document upload, staff review, room access display and service requests.
- Confirm that historical reports stay separate from real guest records.
- Test the site on mobile and desktop.
- Keep the demo mode available until the hosted connection is ready.
