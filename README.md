<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5ea9bc86-31c7-419b-8608-22eed8af62f5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Optional: set `VITE_ADMIN_PIN` in `.env.local` if you want a fixed hidden staff login PIN in the browser UI
3. Run the app:
   `npm run dev`

## Hidden staff access

- The public `Staff Admin Login` button has been removed from the customer view.
- Staff can open the admin login by tapping the `EASTERN HILLS RESTAURANT` title 5 times quickly.
- On desktop, staff can also press `Ctrl+Shift+A`.
- If `VITE_ADMIN_PIN` is not set, the first staff login will create a PIN for that browser/device.

## Shared backend on Vercel

- Menu items now load from a real backend when `DATABASE_URL` is configured.
- Uploaded dish images now publish to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured.
- Admin menu writes are protected by `ADMIN_PIN`. For the smoothest hidden-login flow, set `ADMIN_PIN` and `VITE_ADMIN_PIN` to the same value.
- If the backend is unavailable during local development, the app falls back to browser storage so `npm run dev` still works.

### Vercel setup

1. In Vercel, add a Postgres integration from the Marketplace. Neon is a good default.
2. Confirm your project gets a `DATABASE_URL` environment variable.
3. In Vercel Storage, create a public Blob store and confirm your project gets `BLOB_READ_WRITE_TOKEN`.
4. Add `ADMIN_PIN` in Project Settings -> Environment Variables.
5. Optional: add `VITE_ADMIN_PIN` with the same value so the hidden login can validate in the browser before opening admin mode.
6. Redeploy the project.

### Local env sync

- After connecting storage in Vercel, pull env vars locally with:
  `vercel env pull`

### Seed or reset the shared menu

- Seed the remote database with the default menu:
  `npm run menu:seed`
- Reset the remote database back to the default menu:
  `npm run menu:reset`
- Inspect the currently stored remote menu row:
  `npm run menu:show`

If you have not pulled env vars into `.env.local` yet, you can also run these against Vercel envs directly:

- `vercel env run -- npm run menu:seed`
- `vercel env run -- npm run menu:reset`

### Admin diagnostics

- Open the hidden admin portal, then use the new `Run Diagnostics` button.
- It checks the live Vercel backend for:
  - Postgres connectivity and whether the shared menu row exists
  - Blob storage connectivity and whether uploaded menu images are reachable
- If diagnostics show `Missing`, double-check `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, and `ADMIN_PIN` in Vercel.
# Eastern-Hills-Restaurant
