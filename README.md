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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Optional: set `VITE_ADMIN_PIN` in `.env.local` if you want a fixed staff PIN across restarts
4. Run the app:
   `npm run dev`

## Hidden staff access

- The public `Staff Admin Login` button has been removed from the customer view.
- Staff can open the admin login by tapping the `EASTERN HILLS RESTAURANT` title 5 times quickly.
- On desktop, staff can also press `Ctrl+Shift+A`.
- If `VITE_ADMIN_PIN` is not set, the first staff login will create a PIN for that browser/device.
# Eastern-Hills-Restaurant
