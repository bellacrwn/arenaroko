# REKO Backend

REST API for the REKO distributor, collector, pickup, wallet, rates, station, Wema onboarding, analytics, and notification workflows.

The backend is intentionally isolated in `backend/`. The React frontend was not connected or changed as part of this backend addition.

## What is implemented

- Distributor and collector registration/login
- JWT Bearer authentication and role authorization
- Existing Wema account lookup and OTP verification flow
- New Wema ALAT account-opening flow
- Material catalog and indicative rates
- Drop-station search and distance sorting
- Single or multi-material pickup requests
- Distributor pickup history, cancellation, analytics, wallet, and notifications
- Collector order discovery sorted by nearest GPS distance
- Atomic collector order acceptance
- Pickup workflow: `pending → accepted → en_route → arrived → paid`
- Verified material weight and quality adjustment
- Collector-approved customer payout
- Customer wallet credit and collector-fee credit in one transaction
- Wallet withdrawals and transaction history
- Distributor/collector dashboard summaries
- Audit records for important financial and workflow actions
- Security headers, CORS, rate limiting, validation, password hashing, and consistent errors
- Automated end-to-end API tests

## Technology

- Node.js 20+
- Express
- Zod validation
- JWT authentication
- bcrypt password hashing
- File-backed atomic JSON store for local development
- Node’s built-in test runner and Supertest

> The JSON store makes local setup simple. Before handling real users or money, replace it with PostgreSQL or another transactional production database. See **Production database upgrade** below.

---

## 1. Install and run

From the project root:

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

The API starts at:

```text
http://localhost:4000/api/v1
```

Health check:

```bash
curl http://localhost:4000/health
```

Production-style start:

```bash
npm start
```

## 2. Demo accounts

Running `npm run seed` resets local backend data and creates:

| Role | Email | Password |
| --- | --- | --- |
| Distributor | `distributor@reko.demo` | `Demo123!` |
| Collector | `collector@reko.demo` | `Demo123!` |

The seed also creates three pending pickup orders near Ikeja.

Login example:

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "distributor@reko.demo",
    "password": "Demo123!"
  }'
```

Copy `data.accessToken` from the response and send it as:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 3. Environment variables

Copy `.env.example` to `.env`.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | API port; default `4000` |
| `API_PREFIX` | API prefix; default `/api/v1` |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | Token lifetime; default `7d` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `DATA_FILE` | Path to the local JSON database |
| `WEMA_MODE` | `mock` locally; switch after implementing the live adapter |
| `WEMA_API_BASE_URL` | Approved Wema API base URL |
| `WEMA_CLIENT_ID` | Wema integration client ID |
| `WEMA_CLIENT_SECRET` | Wema integration secret |
| `WEMA_WEBHOOK_SECRET` | Wema webhook signature secret |
| `PAYOUT_MODE` | `ledger` for the local internal wallet ledger |

Generate a production JWT secret, for example:

```bash
openssl rand -base64 48
```

Never commit `.env` or live Wema credentials.

---

## 4. API response format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid.",
    "details": {}
  }
}
```

Validation failures use HTTP `422`. Authentication failures use `401`, authorization failures use `403`, conflicts use `409`, and missing resources use `404`.

---

## 5. Endpoint reference

### General

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | Service health |
| GET | `/api/v1` | No | API metadata |
| GET | `/api/v1/catalog/materials` | No | Active materials and rates |
| GET | `/api/v1/catalog/stations` | No | Stations, search, and distance filters |

### Authentication and onboarding

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Standard REKO registration |
| POST | `/api/v1/auth/login` | Email/password login |
| GET | `/api/v1/auth/me` | Current account and wallet |
| POST | `/api/v1/auth/wema/lookup` | Existing Wema account lookup |
| POST | `/api/v1/auth/wema/verify` | Wema OTP verification and REKO account creation |
| POST | `/api/v1/auth/alat/apply` | New ALAT and REKO account application |

Existing Wema lookup:

```bash
curl -X POST http://localhost:4000/api/v1/auth/wema/lookup \
  -H "Content-Type: application/json" \
  -d '{ "accountNumber": "0123456789" }'
```

In mock mode, any six-digit OTP is accepted:

```bash
curl -X POST http://localhost:4000/api/v1/auth/wema/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "UUID_FROM_LOOKUP",
    "otp": "123456",
    "role": "distributor",
    "email": "user@example.com",
    "phone": "+2348000000000"
  }'
```

### Pickups

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/pickups` | Distributor | Create a multi-material pickup |
| GET | `/api/v1/pickups` | Both | List account pickups |
| GET | `/api/v1/pickups/:pickupId` | Owner/assigned collector | Pickup details |
| POST | `/api/v1/pickups/:pickupId/cancel` | Distributor | Cancel pending/accepted pickup |

Create a pickup/cart checkout:

```bash
curl -X POST http://localhost:4000/api/v1/pickups \
  -H "Authorization: Bearer DISTRIBUTOR_TOKEN" \
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

### Collector workflow

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/collector/orders/nearby` | Pending orders sorted by distance |
| POST | `/api/v1/collector/orders/:pickupId/accept` | Atomically accept order |
| PATCH | `/api/v1/collector/orders/:pickupId/status` | Move to `en_route` or `arrived` |
| POST | `/api/v1/collector/orders/:pickupId/approve-payout` | Verify items, credit wallets, complete pickup |

Nearest orders:

```bash
curl "http://localhost:4000/api/v1/collector/orders/nearby?latitude=6.6000&longitude=3.3500&radiusKm=8" \
  -H "Authorization: Bearer COLLECTOR_TOKEN"
```

Approve payout after arrival:

```bash
curl -X POST http://localhost:4000/api/v1/collector/orders/PICKUP_ID/approve-payout \
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

Quality multipliers:

| Quality | Multiplier |
| --- | ---: |
| `clean` | 100% |
| `mixed` | 90% |
| `needs_sorting` | 75% |

### Wallet and activity

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/wallet` | Current wallet |
| GET | `/api/v1/wallet/transactions` | Wallet ledger |
| POST | `/api/v1/wallet/withdrawals` | Create a ledger withdrawal |
| GET | `/api/v1/dashboard` | Role-aware dashboard summary |
| GET | `/api/v1/dashboard/order-analytics` | Payout/weight chart points |
| GET | `/api/v1/notifications` | Account notifications |
| PATCH | `/api/v1/notifications/:id/read` | Mark notification read |

---

## 6. Backend structure

```text
backend/
├── .env.example
├── package.json
├── README.md
├── data/
│   └── .gitkeep
├── test/
│   └── api.test.js
└── src/
    ├── app.js                  Express configuration and route mounting
    ├── server.js               HTTP server and graceful shutdown
    ├── config.js               Environment configuration
    ├── db/
    │   ├── seed.js             Base rates and stations
    │   └── store.js            Atomic file-backed repository
    ├── lib/
    │   ├── async-route.js
    │   ├── entities.js
    │   ├── geo.js
    │   └── ids.js
    ├── middleware/
    │   ├── auth.js
    │   ├── errors.js
    │   └── validate.js
    ├── routes/
    │   ├── auth.js
    │   ├── catalog.js
    │   ├── collector.js
    │   ├── dashboard.js
    │   ├── notifications.js
    │   ├── pickups.js
    │   └── wallet.js
    ├── scripts/
    │   ├── reset.js
    │   └── seed.js
    └── services/
        └── wema.js
```

---

# How to update the backend

## A. Add or change an endpoint

1. Choose the matching file under `src/routes/`.
2. Define a Zod request schema.
3. Add authentication and role middleware.
4. Use `store.snapshot()` for reads or `store.transaction()` for writes.
5. Wrap async handlers with `asyncRoute()`.
6. Return the standard `{ success, data }` shape.
7. Add or update a test in `test/api.test.js`.
8. Run:

```bash
npm test
```

Example:

```js
router.post(
  '/example',
  authenticate,
  allowRoles('distributor'),
  validate(z.object({ name: z.string().min(2) })),
  asyncRoute(async (request, response) => {
    const result = await store.transaction((database) => {
      // Update database here.
      return { name: request.validated.body.name };
    });
    response.status(201).json({ success: true, data: result });
  }),
);
```

## B. Add a database field

The local database schema version is in `src/db/seed.js`:

```js
meta: { schemaVersion: 1 }
```

For a development-only change:

1. Update the objects created in `src/db/seed.js`.
2. Update all creation paths that produce that entity.
3. Update API validation and tests.
4. Reset local data:

```bash
npm run reset
# or recreate demo data
npm run seed
```

For an existing deployed database, do **not** simply reset it. Add a migration step that:

1. Reads the old schema version.
2. Transforms every affected record.
3. Writes the new version atomically.
4. Backs up the original data first.

## C. Update rates or stations

Edit `src/db/seed.js`, then run:

```bash
npm run seed
```

This resets development data. For production, rates should be managed through an authenticated admin API and rate-history table instead of changing seed files.

## D. Connect the React frontend

The frontend currently uses local prototype state. Replace local operations with API calls.

Recommended environment variable in the Vite app:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Example frontend helper:

```js
const API = import.meta.env.VITE_API_BASE_URL;

export async function api(path, options = {}) {
  const token = localStorage.getItem('reko_access_token');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || 'Request failed');
  return payload.data;
}
```

Suggested frontend mapping:

| Frontend feature | API |
| --- | --- |
| Login | `POST /auth/login` |
| Existing Wema signup | `POST /auth/wema/lookup`, then `/auth/wema/verify` |
| New ALAT signup | `POST /auth/alat/apply` |
| Pickup cart checkout | `POST /pickups` |
| Multiple-order chart | `GET /dashboard/order-analytics` |
| Nearby collector orders | `GET /collector/orders/nearby` |
| Collector accept | `POST /collector/orders/:id/accept` |
| Start trip / arrive | `PATCH /collector/orders/:id/status` |
| Approve money | `POST /collector/orders/:id/approve-payout` |
| Wallet | `GET /wallet` |

## E. Connect live Wema services

All Wema operations are isolated in:

```text
src/services/wema.js
```

To move from mock mode:

1. Obtain the approved Wema API contract and credentials.
2. Set `WEMA_MODE=live`.
3. Implement account lookup, OTP verification, and ALAT account opening in that service.
4. Add request signing, timeouts, retries, and idempotency keys according to Wema’s contract.
5. Verify webhook signatures with `WEMA_WEBHOOK_SECRET`.
6. Never log BVN, NIN, OTP, full account numbers, secrets, or access tokens.
7. Add integration tests against Wema’s sandbox.

The current backend stores only BVN/NIN last-four values and an account-number hash. Preserve that pattern.

## F. Connect a real payout provider

`PAYOUT_MODE=ledger` only updates the internal wallet ledger.

Before live money movement:

1. Add a provider adapter under `src/services/`.
2. Create payout idempotency keys.
3. Mark transactions `pending` before calling the provider.
4. Update them only from a verified provider response or webhook.
5. Add reconciliation jobs.
6. Keep wallet mutation and transaction creation in one database transaction.
7. Never trust a payout amount sent by the browser; calculate it server-side as this backend does.

## G. Production database upgrade

The file store is not appropriate for multiple server instances or financial production traffic.

Recommended PostgreSQL entities:

- `users`
- `collector_profiles`
- `wallets`
- `wallet_transactions`
- `materials`
- `rate_history`
- `pickups`
- `pickup_items`
- `stations`
- `notifications`
- `wema_onboarding_sessions`
- `audit_logs`

When replacing the store:

1. Preserve the `store.snapshot()` and `store.transaction()` concepts behind a repository layer.
2. Add unique constraints for email, provider account reference, and pickup public ID.
3. Lock an order row when a collector accepts it so two collectors cannot accept the same request.
4. Use a serializable transaction for payout approval and both wallet credits.
5. Add database migrations to CI/CD.

## H. Deploy safely

Before deployment:

```bash
npm test
NODE_ENV=production npm start
```

Production checklist:

- Set a strong `JWT_SECRET`
- Set exact `CORS_ORIGINS`
- Use HTTPS only
- Use PostgreSQL
- Add Redis-backed distributed rate limits if running multiple instances
- Add structured logs and request tracing
- Add secret management
- Add backups and migration rollback
- Add Wema sandbox and payout reconciliation tests
- Add monitoring, alerts, and uptime checks
- Rotate credentials regularly

---

## 7. Testing

Run the complete flow:

```bash
npm test
```

The tests cover:

1. Health check
2. Distributor and collector registration
3. Multi-material pickup creation
4. Nearest-order lookup
5. Collector acceptance
6. En-route and arrived transitions
7. Verified weight and payout approval
8. Customer and collector wallet credits

Use a separate temporary database for tests; the test suite removes it afterward.
