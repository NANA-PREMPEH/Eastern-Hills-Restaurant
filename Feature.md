Easternhills FOOD & TRANSPORT — Dual-Feature Expansion
Overview
The app will be rebranded from Eastern Hills Restaurant to Easternhills FOOD & TRANSPORT, with two distinct services accessible from a single landing page:

🍽️ Restaurant — the existing QR-menu & WhatsApp ordering system (unchanged functionality)
🚗 Car Rental — a new section that lets customers browse vehicles and contact the rental team via WhatsApp (0555029441)
When a user opens the app they will see a homepage / service-picker that lets them choose between the two services. After choosing, the respective experience loads.

User Review Required
IMPORTANT

The Car Rental section is new. Please confirm what information you'd like shown for each vehicle (e.g. make/model, daily rate, seat count, photos). For now, the plan includes a placeholder fleet of ~4 cars with name, type, daily price, and a WhatsApp "Book Now" button.

NOTE

The existing Restaurant flow (menu, cart, WhatsApp order, admin portal) will remain 100% unchanged in behaviour. Only the branding/name will be updated.

Open Questions
Car fleet data — Should car listings be admin-managed (like menu items) or hardcoded/static for now?
Car rental WhatsApp message — Should clicking "Book Now" open a pre-filled WhatsApp message (e.g. "I'd like to rent the Toyota Corolla…"), or just open a plain chat?
Navigation — Should users be able to switch between Restaurant and Car Rental without returning to the homepage (e.g. a top-level nav bar), or is the homepage picker sufficient?
Proposed Changes
Landing / Routing Layer
[MODIFY] 
App.tsx
Add a activeService: 'home' | 'restaurant' | 'car_rental' state.
Render a new <LandingPage> when activeService === 'home'.
Render existing restaurant flow when activeService === 'restaurant'.
Render new <CarRentalView> when activeService === 'car_rental'.
New Components
[NEW] src/components/LandingPage.tsx
Full-screen hero landing with the new brand name Easternhills FOOD & TRANSPORT.
Two large CTA cards:
🍽️ Restaurant → sets activeService = 'restaurant'
🚗 Car Rental → sets activeService = 'car_rental'
Premium design: dark gradient hero, animated card hover effects, brand colours (red + gold accent).
[NEW] src/components/CarRentalView.tsx
Header with back button (returns to landing), branded "Car Rental" title.
Fleet grid: 4 placeholder vehicles (Toyota Corolla, Toyota HiAce, Hyundai Tucson, VW Transporter — representative of a Ghanaian rental fleet).
Each card shows: car name, type badge, daily rate (₵), seats count, and a "Book via WhatsApp" button.
Clicking "Book via WhatsApp" opens https://wa.me/233555029441?text=... with a pre-filled enquiry message.
WhatsApp number: 0555029441 → link format 233555029441.
Footer with rental contact number.
[NEW] src/data/carFleet.ts
Static TypeScript array of CarListing objects (id, name, type, dailyRate, seats, image placeholder).
Branding Updates
[MODIFY] 
index.html
Change <title> from EHR → Easternhills Food & Transport
Add meta description for SEO.
[MODIFY] 
MenuCustomerView.tsx
Update header brand text from EASTERN HILLS RESTAURANT → EASTERNHILLS / FOOD & TRANSPORT
Add a small "← Back to Home" link in the header so customers can return to the service picker.
Footer text update.
Design Approach
The landing page will use:

Dark rich gradient background (#0f0f1a → #1a0a0a)
Gold/amber accent (#d97706) for Car Rental, red (#dc2626) for Restaurant
Large glassmorphism service cards with hover lift and glow effects
Brand font: Inter (already in use via Tailwind)
Smooth CSS transitions on card hover (transform, box-shadow)
Verification Plan
Manual Verification
Open app → landing page with two service cards is displayed
Click Restaurant → existing menu loads as before
Click Car Rental → fleet grid appears with WhatsApp "Book" buttons
Clicking "Book via WhatsApp" on a car opens WhatsApp with pre-filled message to 0555029441
Header "Back" link returns to landing page
Restaurant WhatsApp number remains 0541292381 (unchanged)
Brand name reads Easternhills FOOD & TRANSPORT across all views
Page title in browser tab reads Easternhills Food & Transport