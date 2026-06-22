# Easternhills Food & Transport

Easternhills Food & Transport is a dual-service web app built with React, TypeScript, and Vite. It gives customers one landing page where they can choose between:

- a restaurant ordering portal
- a car rental portal

Both services are designed around quick mobile-friendly browsing and direct WhatsApp contact.

## Overview

The application includes two customer experiences and two hidden staff/admin experiences:

- Restaurant customer portal for browsing dishes, building a basket, and sending an order through WhatsApp
- Restaurant admin portal for managing menu items, images, availability, QR access, and backend diagnostics
- Car rental customer portal for browsing available vehicles and sending booking enquiries through WhatsApp
- Car rental admin portal for managing locally stored fleet listings

## Main features

- Single landing page with service selection for restaurant or car rental
- Hidden staff login flow shared across both services
- Works locally with browser storage and can optionally use a Vercel backend for shared menu data
- Mobile-first UI with WhatsApp-based checkout and enquiry flows

## Restaurant portal

### Customer features

- Loads menu items from the shared backend when available
- Falls back to local browser storage when the backend is unavailable
- Supports category filtering with `All`, `Mains`, `Sides`, `Drinks`, and `Desserts`
- Supports text search across dish names and descriptions
- Shows dish images, prices, descriptions, and categories
- Opens a dish detail modal when a customer taps a menu item
- Lets customers add, increase, decrease, or remove items from the basket
- Shows a cart drawer with live totals
- Requires customer name before checkout
- Accepts optional special notes for the order
- Sends a pre-formatted WhatsApp order to `0541292381`
- Stores up to 50 previously sent orders in local browser storage for quick session history
- Detects `?table=...` in the URL and switches the order context to dine-in table service
- Treats the order as delivery when no table parameter is present
- Includes quick navigation back to the home page or over to the car rental portal

### Hidden restaurant staff access

- The public customer UI does not show a visible admin button
- Staff can open the login by tapping the restaurant title 5 times quickly
- Staff can also long-press the title
- On desktop, staff can press `Ctrl+Shift+A`
- If `VITE_ADMIN_PIN` is not set, the first successful local staff setup creates a device-level PIN in browser storage

### Restaurant admin features

- Add new dishes
- Edit existing dishes
- Delete dishes
- Change dish availability without deleting the item
- Manage dish name, price, description, category, and image
- Choose from preset food images
- Paste a custom image URL
- Upload an image file up to 2 MB
- Upload menu images to Vercel Blob when backend storage is configured
- Fall back to local-only image persistence during local development if backend image upload is unavailable
- Filter admin listings by category or search text
- Generate a QR code preview for the app
- Print a QR flyer/card for customer access
- Run deployment diagnostics for menu database and Blob storage health

## Car rental portal

### Customer features

- Displays a fleet grid from the saved car inventory
- Shows vehicle name, type, seats, transmission, features, image or emoji, and daily rate
- Opens WhatsApp booking enquiries for a specific vehicle to `0555029441`
- Includes a general WhatsApp enquiry CTA
- Includes a direct call CTA
- Includes quick navigation back to the home page or over to the restaurant portal

### Hidden fleet staff access

- Staff can open the fleet admin login by tapping the transport title 5 times quickly
- Staff can also long-press the title
- On desktop, staff can press `Ctrl+Shift+A`
- Uses the same local/device PIN flow as the restaurant portal when `VITE_ADMIN_PIN` is not configured

### Car rental admin features

- Add new vehicles
- Edit existing vehicles
- Delete vehicles
- Disable or re-enable vehicles without deleting them
- Manage vehicle name, type, daily rate, seats, transmission, features, image, emoji, and card accent color
- Upload a vehicle image up to 2 MB
- Upload vehicle images to Vercel Blob when backend storage is configured
- Fall back to local-only image persistence during local development if backend image upload is unavailable
- Preview the vehicle card before saving
- Save fleet changes locally in browser storage
- Sync fleet changes across browsers when the shared backend is available

## Current default content

The project ships with seed data for both services:

- A default restaurant menu in [src/data/defaultMenu.ts](src/data/defaultMenu.ts)
- A default car fleet in [src/data/carFleet.ts](src/data/carFleet.ts)

Default restaurant examples include items such as Ghana Jollof Rice, Kelewele, Tilapia and Banku, Waakye, burgers, fries, and drinks.

Default fleet examples include:

- Toyota Corolla
- Toyota Land Cruiser
- Toyota HiAce
- Mercedes-Benz E-Class
- Hyundai Tucson
- Toyota Hilux

## Data flow and persistence

### Restaurant menu

- On startup, the app tries to fetch menu data from `/api/menu`
- If remote menu data is available, it becomes the live source of truth
- Remote menu data is mirrored locally for offline-friendly fallback
- If the API is unavailable, the app loads the menu from browser storage
- If no saved menu exists, the app uses the default seed menu
- Local restaurant persistence uses IndexedDB first and also mirrors to `localStorage`

### Car fleet

- On startup, the app tries to fetch the car fleet from `/api/car-fleet`
- If remote car fleet data is available, it becomes the live source of truth
- Remote car fleet data is mirrored locally for offline-friendly fallback
- If the API is unavailable, the app loads the fleet from browser storage
- If no saved fleet exists, the app loads the default fleet
- Local car fleet persistence uses `localStorage` as a mirror and fallback cache

### Staff PIN behavior

- Browser-side hidden login can use `VITE_ADMIN_PIN`
- Server-side write protection uses `ADMIN_PIN`
- If no browser PIN is provided, the app can create and store a device-level PIN locally

## Backend and API behavior

The server-side API is used for the restaurant menu and car rental fleet.

### `GET /api/menu`

- Returns the shared menu from Postgres
- Responds with `503` when remote menu storage is not configured
- Seeds the default menu into the database automatically if no menu row exists yet

### `PUT /api/menu`

- Saves the full menu payload
- Requires the `x-admin-pin` header
- Validates that the submitted payload is a proper menu item array

### `POST /api/menu/upload`

- Uploads a dish image to Vercel Blob
- Requires the `x-admin-pin` header
- Expects a data URL payload plus file name and optional content type

### `GET /api/admin/diagnostics`

- Requires the `x-admin-pin` header
- Checks database connectivity
- Checks Blob storage connectivity
- Returns environment, runtime, health status, menu item count, last update time, and Blob sample info

### `GET /api/car-fleet`

- Returns the shared car fleet from Postgres
- Responds with `503` when remote fleet storage is not configured
- Seeds the default fleet into the database automatically if no fleet row exists yet

### `PUT /api/car-fleet`

- Saves the full shared car fleet payload
- Requires the `x-admin-pin` header
- Validates that the submitted payload is a proper car listing array

### `POST /api/car-fleet/upload`

- Uploads a vehicle image to Vercel Blob
- Requires the `x-admin-pin` header
- Expects a data URL payload plus file name and optional content type

## Environment variables

Create a `.env.local` file for local development or configure these in Vercel:

```env
VITE_ADMIN_PIN="1234"
ADMIN_PIN="1234"
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
POSTGRES_URL="postgresql://user:password@host/database?sslmode=require"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
BLOB_STORE_ID="store_xxxxx"
BLOB_WEBHOOK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

### Variable details

- `VITE_ADMIN_PIN`
  Browser-side hidden staff PIN for the UI
- `ADMIN_PIN`
  Server-side PIN used to protect menu writes, uploads, and diagnostics
- `DATABASE_URL`
  Postgres connection string for shared restaurant menu storage
- `POSTGRES_URL`
  Alternate Postgres variable also supported by the backend
- `BLOB_READ_WRITE_TOKEN`
  Required for remote dish image uploads to Vercel Blob
- `BLOB_STORE_ID`
  Added automatically by the Vercel Blob integration; not used directly by the current app code
- `BLOB_WEBHOOK_PUBLIC_KEY`
  Added automatically by the Vercel Blob integration; not used directly by the current server-upload flow

For the smoothest staff flow, use the same value for `VITE_ADMIN_PIN` and `ADMIN_PIN`.

## Scripts

- `npm run dev`
  Starts the Vite dev server on port `3000`
- `npm run build`
  Builds the production bundle
- `npm run preview`
  Previews the production build locally
- `npm run lint`
  Runs TypeScript type-checking with `tsc --noEmit`
- `npm run menu:seed`
  Creates the shared menu table if needed and seeds the default menu
- `npm run menu:reset`
  Overwrites the shared menu with the default seed menu
- `npm run menu:show`
  Prints the current remote menu row

## Local development

### Prerequisites

- Node.js
- npm

### Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploying on Vercel

To enable the shared menu backend and remote image uploads:

1. Create a Vercel project for this repository.
2. Keep the Framework Preset as Vite or allow auto-detection, and let Vercel build the app with `npm run build`.
3. Add a Postgres integration such as Neon.
4. Confirm the project has either `DATABASE_URL` or `POSTGRES_URL`.
5. Create or connect a Vercel Blob store.
6. Confirm the project has `BLOB_READ_WRITE_TOKEN`.
7. Leave `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY` in place if Blob already added them to the project.
8. Set `ADMIN_PIN`.
9. Optionally set `VITE_ADMIN_PIN` to the same value.
10. Deploy or redeploy the project.

This repository now includes [vercel.json](vercel.json), which does two important things for production:

- Uses `dist` as the static output directory for the Vite build
- Rewrites unknown frontend routes to `index.html` so SPA deep links keep working on Vercel while `/api/*` functions continue to resolve from the filesystem

To pull Vercel environment variables into local development:

```bash
vercel env pull
```

## Project structure

```text
src/
  components/
    AdminPortal.tsx
    CarRentalAdminPortal.tsx
    CarRentalView.tsx
    LandingPage.tsx
    MenuCustomerView.tsx
    StaffAccessModal.tsx
  data/
    carFleet.ts
    defaultMenu.ts
  lib/
    carFleetStorage.ts
    menuApi.ts
    menuStorage.ts
    server/
      adminAuth.ts
      blobStorage.ts
      menuBackend.ts
api/
  admin/diagnostics.ts
  menu.ts
  menu/upload.ts
scripts/
  menu-backend.ts
```

## Notes and current scope

- Restaurant menu data supports shared backend persistence when the server is configured
- Car rental fleet data also supports shared backend persistence when the server is configured
- The built-in QR generator currently points to the main app entry URL
- Table-aware dine-in mode works when the app is opened with a `?table=...` query parameter
- There is no automated test suite in this repository at the moment; `npm run lint` is the main verification command
