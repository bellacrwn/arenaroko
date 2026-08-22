# REKO — Recycling, finally rewarding

A polished React/Vite product experience for REKO, a Nigerian recycling platform connecting households, collectors, drop stations, transparent rates, wallet payouts, and measurable environmental impact.

## Experience

### Marketing site

- Cinematic, responsive campaign hero with original REKO photography
- Interactive material-value estimator
- Product process, live rates, impact, collector, testimonial, and conversion sections
- Responsive navigation and accessible interaction states
- Full brand footer and email capture treatment

### Account onboarding

- Role-aware distributor and collector signup
- Existing Wema customers connect with a 10-digit account number and OTP verification
- New Wema customers complete a guided digital application for a Wema ALAT account
- Personal, identity, address, password, consent, and account-review steps
- Animated three-scene product introduction before entering the relevant dashboard
- Skip, replay, manual slide navigation, and automatic dashboard entry

### Distributor product

- Premium responsive application shell with desktop sidebar and mobile bottom navigation
- Visible sign-out controls in the sidebar, account menu, and mobile header
- Role-aware logout confirmation that securely returns to distributor sign-in
- Overview dashboard with wallet, recycling metrics, live pickup tracking, rates, nearby stations, and monthly goal
- Four-step pickup-booking experience with material, weight, photo, location, time, review, and confirmation states
- Searchable and filterable pickup history
- Interactive multiple-order analytics with payout/weight switching, range controls, chart tooltips, and material mix
- Multi-material pickup cart with weight controls, combined estimates, shared scheduling, and batch checkout
- Wallet with earnings visualisation and transactions
- Live material-rate cards and payout calculator
- Interactive drop-station explorer
- Impact dashboard with milestones and monthly history
- Help centre and support experience

### Collector product

- Dedicated collector dashboard and navigation—not a reskinned member dashboard
- Online/offline availability and configurable service area
- Location-aware order feed sorted by nearest pickup distance
- Radius and material filters with a live map-style explorer
- Order acceptance and multi-order pickup queue
- Active workflow: accepted → en route → arrived → weighed → paid
- Verified-weight and material-quality controls at collection time
- Customer payout calculation and explicit collector approval
- Automatic completion after payout approval
- Collector fees, wallet balance, weekly earnings, and completed-pickup ledger
- Collector sign-out in the sidebar, profile menu, and mobile header
- Role-aware logout confirmation that returns to collector sign-in

## Design system

The interface follows the supplied REKO concrete-and-industrial palette:

| Token | Value | Use |
| --- | --- | --- |
| Pine | `#1B4D3E` | Primary brand surfaces and actions |
| Sage | `#4A7C59` | Secondary accents and data visualisation |
| Mint | `#22C55E` | Earnings, success, live states, and impact |
| Concrete | `#D1D5DB` | Borders and neutral controls |
| Kraft | `#E5E0D8` | Eco and receipt-inspired surfaces |
| Canvas | `#F8FAFC` | Application background |
| Iron | `#1F2937` | Primary typography |

Typography uses Space Grotesk for brand displays, Inter for UI copy, and JetBrains Mono for request and transaction identifiers.

## Technology

- React
- React Router
- Vite
- Lucide React icons
- Responsive token-driven CSS
- Local React state for prototype interactions

## Run locally

Run these commands from the folder that contains `package.json` (`REKO`):

PowerShell from the parent folder:

```powershell
Set-Location .\REKO
npm install
npm run dev
```

PowerShell when already inside `REKO`:

```powershell
npm install
npm run dev
```

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Application routes

| Route | View |
| --- | --- |
| `/` | Marketing website |
| `/login` | Distributor and collector sign-in |
| `/signup` | Wema connection or new ALAT account onboarding |
| `/welcome` | Animated role-aware product introduction |
| `/app` | Distributor overview |
| `/app/pickups` | Pickup history |
| `/app/wallet` | Wallet and transactions |
| `/app/rates` | Live rates and calculator |
| `/app/stations` | Drop-station explorer |
| `/app/impact` | Environmental impact |
| `/app/help` | Help and support |
| `/collector` | Collector overview and live route |
| `/collector/orders` | Location-sorted nearby orders |
| `/collector/active` | Active pickup workflow |
| `/collector/earnings` | Collector wallet and fees |

## Project structure

```text
index.html                  App document and metadata
vite.config.js              Vite/React preview configuration
src/main.jsx                React entry and router provider
src/App.jsx                 Marketing site and member product
src/CollectorApp.jsx        Collector workspace, order matching, and payout approval
src/data.js                 Prototype materials, rates, stations, orders, and activity
src/styles.css              Marketing and member design system
src/collector.css           Collector-specific responsive design system
src/Signup.jsx              Wema/ALAT onboarding and animated introduction
src/signup.css              Signup and welcome-tour responsive design system
public/images/              REKO campaign photography
public/branding/            Runtime SVG branding
assets/branding/            Developer hand-off SVG, PNG, and ICO exports
```

## Branding hand-off

`assets/branding/` includes full-color, dark, and light vector wordmarks, the standalone REKO icon, favicon, 180×180 Apple touch icon, and 512×512 application icon.

## Prototype note

Authentication, pickups, wallet activity, rates, maps, notifications, and support are interactive frontend demonstrations backed by local state. Production deployment still requires API integration, persistent authentication, database models, maps/geolocation, storage, notification delivery, and payment processing.
