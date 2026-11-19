# GrandStay

A mobile-first guest experience platform for a single hotel, with guest, staff, manager and super-admin workspaces.

## Run locally

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Choose a preview account on the sign-in page to explore the role you need.

## Project structure

- `app/` — public pages and role routes
- `components/` — shared UI and feature components
- `types/` — application data contracts
- `data/mock.ts` — initial example records
- `services/` — application operations and local persistence
- `hooks/` — subscribed client state
- `lib/` — formatting, rules and supporting calculations
- `public/images/` — hotel image assets
- `tests/` — browser smoke checks

## Validate changes

```bash
npm run lint
npm run build
```

GitHub Actions also runs browser smoke checks against a production build.

## Backend handover

The current frontend is a demonstration. Use fictional account details. The local stores are not a production database, and test payments and sample identity submissions are not genuine transactions or verification.

Connect real authentication and permission checks first, followed by room inventory, reservations and Paystack verification. Then connect private ID uploads, staff reviews, room access, service requests, concierge messaging and management data.

Replace local service/store implementations and their hooks with server-backed operations. Preserve the UI components and adapt the TypeScript contracts to the agreed API. Remove the preview-account shortcuts, test-payment and identity-sample controls, and the consolidated dashboard explanation before production launch.

The hotel team provides approved content, room prices and inventory, service information and loyalty policy. Backend authorization, payment verification, private storage and audit records must remain server-controlled.
