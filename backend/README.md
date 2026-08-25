# REKO Supabase Backend

Production-oriented Express API backed by Supabase PostgreSQL, Supabase Auth, private Storage, Row Level Security, database transactions, and Realtime.

There is no local JSON database. All persistent application data lives in your Supabase project.

## What Supabase handles

- **PostgreSQL:** users, pickups, pickup items, wallets, rates, stations, notifications, and audit logs
- **Auth:** email/password and phone OTP sessions
- **Storage:** private pickup photos with signed uploads
- **Realtime:** pickup and notification changes
- **Row Level Security:** direct browser access is restricted to the signed-in user’s records
- **Database functions:** atomic order acceptance, workflow changes, payout approval, cart checkout, cancellation, and withdrawals

The Express API stays on Render/Railway and keeps the Supabase service-role key private. It handles Wema onboarding, authorization, calculations, and financial workflows.

---

# 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create an account.
2. Select **New project**.
3. Choose an organisation and enter a project name such as `reko-production`.
4. Generate and save a strong database password.
5. Select the region closest to your users.
6. Wait for the project to finish provisioning.

In **Project Settings → API**, locate:

- Project URL
- Anon/publishable key
- Service-role/secret key

Never place the service-role key in React, Vite variables, GitHub, or any browser bundle.

---

# 2. Apply the database migrations

The migrations are in:

```text
backend/supabase/migrations/
├── 202608260001_initial_schema.sql
└── 202608260002_api_functions.sql
```

## Option A: Supabase SQL Editor

1. Open the Supabase dashboard.
2. Go to **SQL Editor → New query**.
3. Paste and run `202608260001_initial_schema.sql`.
4. Create another query.
5. Paste and run `202608260002_api_functions.sql`.

Run them in that order.

## Option B: Supabase CLI

From `backend/`:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

The project reference is the first part of your Supabase URL:

```text
https://YOUR_PROJECT_REF.supabase.co
```

The migrations create:

- `profiles`
- `wallets`
- `materials`
- `rate_history`
- `stations`
- `pickups`
- `pickup_items`
- `wallet_transactions`
- `withdrawals`
- `notifications`
- `wema_onboarding_sessions`
- `audit_logs`
- Private `pickup-photos` Storage bucket
- Auth profile/wallet creation trigger
- RLS policies
- Realtime publications
- Atomic PostgreSQL workflow functions
- Initial material rates and Lagos stations

---

# 3. Configure authentication

In Supabase, open **Authentication → Providers**.

## Email/password

Enable email authentication.

During early testing, you may disable **Confirm email** so signup returns a session immediately. For production, enable email confirmation and update the frontend to show a “check your email” screen when `requiresEmailConfirmation` is `true`.

## Phone OTP

Enable phone authentication and configure a supported SMS provider. The backend exposes:

```text
POST /api/v1/auth/phone/send
POST /api/v1/auth/phone/verify
```

## Redirect URLs

Under **Authentication → URL Configuration**, add your production frontend URL and any local callback URLs.

---

# 4. Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill `.env`:

```env
NODE_ENV=development
PORT=4000
API_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:5173

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
SUPABASE_STORAGE_BUCKET=pickup-photos

WEMA_MODE=mock
PAYOUT_MODE=ledger
```

Start the API:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:4000/health
```

API base URL:

```text
http://localhost:4000/api/v1
```

---

# 5. API endpoints

## Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Supabase email/password registration |
| POST | `/auth/login` | Supabase email/password login |
| POST | `/auth/phone/send` | Send phone OTP |
| POST | `/auth/phone/verify` | Verify phone OTP |
| GET | `/auth/me` | Current profile and wallet |
| POST | `/auth/logout` | Revoke the current Supabase session |
| POST | `/auth/wema/lookup` | Existing Wema account lookup |
| POST | `/auth/wema/verify` | Verify Wema OTP and create Supabase account |
| POST | `/auth/alat/apply` | Open mock ALAT account and create Supabase account |

Every protected request uses the Supabase access token:

```text
Authorization: Bearer SUPABASE_ACCESS_TOKEN
```

## Catalog

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/catalog/materials` | Current material rates |
| GET | `/catalog/stations` | Stations, material filters, and distances |

## Pickups

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/pickups/photos/upload-url` | Distributor | Private signed photo upload |
| POST | `/pickups` | Distributor | Atomic multi-material/cart checkout |
| GET | `/pickups` | Both | Account pickup list |
| GET | `/pickups/:id` | Related account | Pickup detail |
| POST | `/pickups/:id/cancel` | Distributor | Atomic cancellation |

## Collector workflow

| Method | Endpoint | Purpose |
| --- | --- |
| GET | `/collector/orders/nearby` | Pending orders sorted by GPS distance |
| POST | `/collector/orders/:id/accept` | Lock and accept an order atomically |
| PATCH | `/collector/orders/:id/status` | Move to `en_route` or `arrived` |
| POST | `/collector/orders/:id/approve-payout` | Verify weight, credit both wallets, complete order |

## Wallet and dashboard

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/wallet` | Current wallet |
| GET | `/wallet/transactions` | Wallet ledger |
| POST | `/wallet/withdrawals` | Atomic withdrawal ledger entry |
| GET | `/dashboard` | Role-aware summary |
| GET | `/dashboard/order-analytics` | Payout or weight chart points |
| GET | `/notifications` | Notifications |
| PATCH | `/notifications/:id/read` | Mark notification read |

---

# 6. Example requests

## Register

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "role": "distributor",
    "firstName": "Ada",
    "lastName": "Okafor",
    "email": "ada@example.com",
    "phone": "+2348000000000",
    "password": "Secure123!"
  }'
```

## Create a pickup cart

```bash
curl -X POST http://localhost:4000/api/v1/pickups \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "materialId": "metal", "estimatedWeight": 20 },
      { "materialId": "plastic", "estimatedWeight": 10 }
    ],
    "address": {
      "label": "12 Allen Avenue, Ikeja, Lagos",
      "latitude": 6.6018,
      "longitude": 3.3515
    },
    "pickupWindow": "Tomorrow · 9:00–11:00 AM"
  }'
```

## Find nearest collector orders

```bash
curl "http://localhost:4000/api/v1/collector/orders/nearby?latitude=6.6000&longitude=3.3500&radiusKm=8" \
  -H "Authorization: Bearer COLLECTOR_TOKEN"
```

## Approve payout

```bash
curl -X POST http://localhost:4000/api/v1/collector/orders/PICKUP_UUID/approve-payout \
  -H "Authorization: Bearer COLLECTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerConfirmed": true,
    "items": [
      { "materialId": "metal", "verifiedWeight": 21, "quality": "clean" },
      { "materialId": "plastic", "verifiedWeight": 9.5, "quality": "mixed" }
    ]
  }'
```

Quality multipliers are calculated inside PostgreSQL:

| Quality | Multiplier |
| --- | ---: |
| `clean` | 100% |
| `mixed` | 90% |
| `needs_sorting` | 75% |

The browser cannot supply its own payout amount.

---

# 7. Private pickup photos

1. Request an upload URL from `/pickups/photos/upload-url`.
2. Upload the image directly to the returned Supabase signed URL.
3. Store the returned `path` in `photoPaths` when creating the pickup.

Paths are placed under the authenticated user ID. The bucket is private and RLS blocks access to another user’s folder.

Do not use public URLs for customer pickup photos.

---

# 8. Realtime frontend updates

The migration adds `pickups` and `notifications` to Supabase Realtime.

Install the frontend client:

```bash
npm install @supabase/supabase-js
```

Browser environment variables use only the anon/publishable key:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-render-api.onrender.com/api/v1
```

Example subscription:

```js
supabase
  .channel('my-pickups')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'pickups' },
    (payload) => refreshPickups(payload),
  )
  .subscribe();
```

RLS determines which records a signed-in browser may receive.

---

# 9. Deploy on Render

Create a Render Web Service:

- **Root directory:** `backend`
- **Build command:** `npm ci`
- **Start command:** `npm start`
- **Health path:** `/health`

Set:

```env
NODE_ENV=production
CORS_ORIGINS=https://your-frontend-domain.com
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=pickup-photos
WEMA_MODE=mock
PAYOUT_MODE=ledger
```

No Render persistent disk is required because data is in Supabase.

---

# 10. How to update the backend safely

## Change a table or function

Never edit a migration that has already been applied to a shared project.

Create a new migration:

```bash
cd backend
npx supabase@latest migration new describe_your_change
```

Edit the generated SQL, then apply it:

```bash
npx supabase@latest db push
```

Commit the new migration with the API code that requires it.

## Add an API endpoint

1. Add the Zod request schema.
2. Require `authenticate` and the correct `allowRoles` middleware.
3. Use `supabaseAdmin` only inside the server.
4. Put multi-table money/order writes in a PostgreSQL function.
5. Revoke that function from `anon` and `authenticated` if only the backend should call it.
6. Grant it to `service_role`.
7. Add tests and update this README.

## Change material rates

Use SQL and create rate history:

```sql
begin;
insert into public.rate_history(material_id,rate,reason)
values('metal',225,'Market adjustment');
update public.materials set rate=225 where id='metal';
commit;
```

For production, build a role-protected admin screen instead of manually editing rows.

## Add a pickup status

Update all of these together:

1. The `pickups.status` check constraint in a new migration
2. The allowed transition database function
3. Route validation
4. Frontend status labels
5. Realtime handling
6. Tests

## Add a new material

```sql
insert into public.materials(id,name,rate,trend,examples)
values('glass','Glass',70,0,'Bottles and jars');
```

Then update any frontend icon mapping.

---

# 11. Wema integration

Wema operations remain isolated in:

```text
src/services/wema.js
```

`WEMA_MODE=mock` supports local UI development. For live use:

1. Obtain Wema’s approved API contract and sandbox credentials.
2. Implement account lookup, OTP verification, and ALAT account opening in the service.
3. Use timeouts, idempotency keys, and approved request signing.
4. Verify webhook signatures.
5. Never log full account numbers, BVN, NIN, OTP, tokens, or secrets.
6. Store only hashes and last-four values as the current schema does.

---

# 12. Security rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
- Frontend code uses only `SUPABASE_ANON_KEY`.
- Keep RLS enabled.
- Keep pickup photos private.
- Calculate payout server-side/database-side.
- Financial mutations run in atomic PostgreSQL functions.
- Use provider idempotency keys before real payouts.
- Enable Supabase Auth rate limits and bot protection.
- Configure exact production CORS origins.
- Rotate secrets after accidental exposure.
- Review Supabase Auth and database logs.

---

# 13. Tests

```bash
npm test
```

The local suite verifies:

- Health endpoint
- Validation before database calls
- Authentication requirements
- Lagos distance calculations
- Presence of RLS, Storage, Realtime, and financial SQL functions

After creating your Supabase project, add a separate staging integration suite that registers disposable users and tests the full pickup/payout workflow against a staging project. Never run destructive integration tests against production.

---

## Backend structure

```text
backend/
├── .env.example
├── package.json
├── README.md
├── supabase/
│   └── migrations/
│       ├── 202608260001_initial_schema.sql
│       └── 202608260002_api_functions.sql
├── test/
│   └── api.test.js
└── src/
    ├── app.js
    ├── config.js
    ├── server.js
    ├── supabase.js
    ├── lib/
    ├── middleware/
    ├── routes/
    └── services/
```
