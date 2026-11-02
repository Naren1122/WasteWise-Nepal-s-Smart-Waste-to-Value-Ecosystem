# WasteWise — System Design & Architecture Document

**System:** WasteWise (Multi-Tenant Smart Waste Management Platform)  
**Target Architecture:** Modular Monolith with Asynchronous Worker & Real-time Layer  
**Document Version:** 1.0  
**Status:** Approved Engineering Blueprint  

---

## 1. Architecture Overview & Design Principles

WasteWise is engineered as a **multi-tenant modular monolith** designed for high reliability, cost efficiency, and ease of deployment across municipal jurisdictions in Nepal.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT TIER                                      |
|  +------------------------------+  +--------------------------------------------+ |
|  |  Citizen Web Portal / PWA    |  |  Admin & Ward Operations Portal (Desktop)  | |
|  |  (Next.js / Tailwind / i18n) |  |  (Next.js / AntD or MUI / Mapbox / Leaflet)| |
|  +------------------------------+  +--------------------------------------------+ |
|  +------------------------------------------------------------------------------+ |
|  |           Field Worker / Driver Mobile PWA (Offline-first & GPS)             | |
|  +------------------------------------------------------------------------------+ |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS
                                           v
+-----------------------------------------------------------------------------------+
|                        INGRESS & EDGE TIER (Nginx / Cloudflare)                  |
|          SSL Termination • DDoS Protection • Static Asset Caching • WAF           |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    | HTTP REST                                   | WSS (Socket.IO)
                    v                                             v
+-----------------------------------------------------------------------------------+
|                               APPLICATION TIER                                    |
|  +------------------------------------------+  +--------------------------------+ |
|  |            Express REST API              |  |      Socket.IO Gateway         | |
|  |  • Multi-tenant context middleware       |  |  • Room-based dispatcher/ward  | |
|  |  • Authentication & RBAC guard           |  |  • Throttled GPS ingestion     | |
|  |  • Billing, Invoicing & eSewa/Khalti SDK |  |  • Live route breadcrumbs      | |
|  |  • Route & Schedule Engine               |  +---------------+----------------+ |
|  |  • Grievance & Ticket Lifecycle          |                  |                  |
|  +--------------------+---------------------+                  |                  |
|                       | Enqueue Jobs                           | Redis Pub/Sub    |
|                       v                                        v                  |
|  +------------------------------------------------------------------------------+ |
|  |                BullMQ Background Workers (Node.js Processes)                 | |
|  |  • Scheduled recurring route generation    • Payment verification retries   | |
|  |  • SMS & Email notification dispatcher     • Daily analytics rollups        | |
|  +------------------------------------------------------------------------------+ |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
+----------------------------------------+  +---------------------------------------+
|              DATA TIER                 |  |            CACHE & BROKER             |
|  PostgreSQL 16 + PostGIS Extension    |  |  Redis 7 (In-Memory Data Store)       |
|  • Row-Level Tenant Scoping            |  |  • Socket.IO Redis Adapter (Clustered)|
|  • Spatial queries (ST_DWithin, Lines) |  |  • BullMQ job queues                  |
|  • Transactional financial ledgers     |  |  • Session & rate-limiting store      |
+----------------------------------------+  +---------------------------------------+
                    |
                    v
+-----------------------------------------------------------------------------------+
|                         EXTERNAL CLOUD SERVICES & INTEGRATIONS                    |
|  • eSewa (ePay v2) & Khalti (E-Payment Web Checkout)                              |
|  • Map Tiles & Routing (OSM / Mapbox / Google Maps API)                           |
|  • SMS Gateway (Sparrow SMS / Aakash SMS Nepal)                                   |
|  • S3-Compatible Object Store (MinIO / AWS S3 for complaint & verification photos)|
+-----------------------------------------------------------------------------------+
```

### Core Design Principles:
1. **Multi-Tenancy with Hard Isolation:** Every municipal tenant is assigned a unique `tenant_id`. Database queries, cache keys, object storage paths, and WebSocket rooms are scoped strictly by `tenant_id`.
2. **Offline-Resilient Field Execution:** Field workers operate under variable cellular coverage. Stop evaluations and photo captures are stored locally in IndexedDB and synchronized with exponential backoff.
3. **Decoupled Real-time & Asynchronous Workloads:** CPU-intensive tasks (batch invoice generation, PDF receipts, bulk SMS dispatch) are processed off the main request thread by BullMQ workers backed by Redis.
4. **Defensive Financial Integrity:** Payment processing adheres to the principle of idempotent callbacks, immutable transaction ledgers, and zero trust on client-side success redirections.

---

## 2. Domain Modules & Boundaries

```
src/
├── modules/
│   ├── tenancy/          # Municipality onboarding, ward configurations, billing tariffs
│   ├── identity/         # JWT auth, user accounts, roles & permission matrices
│   ├── registry/         # Citizens, commercial generator premises, property GPS pins
│   ├── scheduling/       # Recurring collection rules, bulky waste requests, calendar
│   ├── fleet/            # Vehicles, crew allocations, daily route manifests, stop states
│   ├── tracking/         # Shift-bound GPS ingestion, Socket.IO rooms, live vehicle pins
│   ├── billing/          # Monthly invoice generator, line items, offline cashier vouchers
│   ├── payments/         # eSewa ePay v2, Khalti API v2, webhook listeners, reconciliation
│   ├── complaints/       # Ticket submission, photo proof, status transitions, SLA tracker
│   └── notifications/    # SMS (Sparrow/Aakash), push alerts, email notifications
```

---

## 3. Real-Time GPS Tracking & Socket.IO Architecture

### 3.1 Connection Lifecycle & Security
1. **Handshake & Auth:** Drivers and dispatchers authenticate during the WebSocket handshake using a short-lived JWT token. The token embeds `user_id`, `role`, and `tenant_id`.
2. **Room Partitioning:**
   - `tenant:{tenant_id}:ops` — Dispatchers and operations managers monitor all active vehicles across the municipality.
   - `tenant:{tenant_id}:ward:{ward_number}` — Ward officers track vehicles servicing their ward.
   - `route:{route_id}` — Citizens subscribing to a live vehicle arrival feed for their specific pickup route.

### 3.2 GPS Sampling & Ingestion Throttling
- **Worker Driver App:** Samples GPS location every 5 seconds.
- **Client-Side Filter:** Pings are only transmitted if the device has moved > 10 meters or if 30 seconds have elapsed since the last transmission.
- **Server-Side Ingestion:** Payload `{ route_id, lat, lng, speed, heading, timestamp }` is pushed to Redis Geospatial index (`GEOADD`) and broadcast to the relevant Socket.IO room.
- **Worker Privacy Guarantee:** Location pings are discarded unless the driver has explicitly pressed **"Start Route"** and the route state is `ACTIVE`.

---

## 4. Payment Gateway Integration Architecture (eSewa & Khalti)

Nepal's two leading payment gateways are supported using secure server-to-server validation.

### 4.1 Payment State Machine
```
[Invoice Created: UNPAID]
          │
          ▼
[Initiate Payment] ──► [Transaction Record Created: INITIATED]
          │
          ├──► eSewa Form Post / Khalti E-Payment Initiate
          │
          ▼
[Gateway Processing]
          │
          ├── Success Callback / Webhook ──► [Server-to-Server Verification]
          │                                           │
          │                        ┌──────────────────┴──────────────────┐
          │                        ▼                                     ▼
          │               [Signature Valid &                   [Hash Mismatch /
          │                Amount Matches]                      Amount Tampered]
          │                        │                                     │
          │                        ▼                                     ▼
          │               [Status: SUCCESS]                     [Status: TAMPERED]
          │                        │                                     │
          │                        ▼                                     ▼
          │            [Invoice Marked: PAID]                   [Alert Operations]
          │
          └── Cancelled / Failed by User ──► [Status: FAILED / EXPIRED]
```

### 4.2 eSewa Integration Specification (ePay v2)
- **Signature Algorithm:** HMAC-SHA256 (`total_amount,transaction_uuid,product_code`).
- **Initiation:** The frontend posts the signed transaction payload to `https://rc-epay.esewa.com.np/api/epay/main/v2/form` (test) or production equivalent.
- **Verification:** On redirect to the return URL, the backend extracts the base64 encoded response, decodes the parameters, and queries eSewa's transaction status API:
  `GET https://rc.esewa.com.np/api/epay/transaction/status/?product_code={code}&total_amount={amt}&transaction_uuid={uuid}`

### 4.3 Khalti Integration Specification (E-Payment API v2)
- **Initiation:** Server calls `POST https://a.khalti.com/api/v2/epayment/initiate/` with headers `Authorization: Key {secret_key}`.
  Payload includes `return_url`, `website_url`, `amount` (in Paisa, NPR * 100), `purchase_order_id`, and `purchase_order_name`.
- **Lookup & Verification:** Upon consumer redirect to `return_url`, the backend takes the `pidx` and executes server-to-server verification:
  `POST https://a.khalti.com/api/v2/epayment/lookup/` with payload `{"pidx": pidx}`.
- **Idempotency:** Webhook listeners record each transaction lookup in a ledger table; duplicate callbacks return HTTP 200 without double-crediting.

---

## 5. Core REST API Interface

All endpoints are prefixed with `/api/v1` and require header `X-Tenant-ID` or an authenticated Bearer token.

| Method | Endpoint | Description | Access Control |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate via email/phone and password | Public |
| `POST` | `/auth/refresh` | Rotate access and refresh JWT tokens | Authenticated |
| `GET` | `/tenants/current` | Retrieve active municipality configuration & wards | Tenant Member |
| `GET` | `/properties/my` | List citizen's registered properties & wards | Citizen |
| `POST` | `/properties` | Register property address with GPS coordinates | Citizen |
| `GET` | `/schedules/ward/:wardId` | Retrieve published collection calendar for ward | Public / Citizen |
| `POST` | `/schedules/bulky-requests`| Request on-demand bulky waste pickup | Citizen / Commercial |
| `GET` | `/routes/today` | Fetch assigned daily route and stops manifest | Driver / Crew |
| `PATCH`| `/routes/:id/start` | Start route execution (enables GPS ingestion) | Driver |
| `PATCH`| `/routes/:id/stops/:stopId`| Mark stop outcome (`COLLECTED`, `MISSED`, etc.) | Driver / Worker |
| `POST` | `/routes/:id/gps` | Ingest bulk GPS coordinates (offline sync) | Driver |
| `GET` | `/invoices/my` | List citizen invoices with payment status | Citizen |
| `POST` | `/payments/esewa/initiate`| Generate HMAC signature and payload for eSewa | Citizen |
| `POST` | `/payments/khalti/initiate`| Initiate Khalti payment session and retrieve URL | Citizen |
| `POST` | `/payments/verify` | Server-to-server payment lookup & invoice update | System / Citizen |
| `POST` | `/complaints` | File grievance ticket with photos and geo-location | Citizen |
| `PATCH`| `/complaints/:id/status` | Update ticket status and assign field personnel | Ward Officer / Admin |

---

## 6. Security, Privacy & Non-Functional Architecture

1. **Authentication & Session Security:**
   - Access tokens (JWT) have a 15-minute lifespan; refresh tokens have a 7-day lifespan with automatic token family rotation and revocation.
   - Passwords hashed using `bcrypt` (work factor 12) or `argon2id`.
2. **Tenant Scoping & Database Query Safety:**
   - Every database query enforces an explicit `WHERE tenant_id = :tenant_id` predicate.
   - ORM / query-builder extensions automatically reject queries missing a resolved tenant context.
3. **Field Worker Privacy & Data Protection:**
   - GPS coordinates are collected strictly during the active shift window. Once a driver selects **"Finish Route"**, tracking terminates immediately.
   - GPS breadcrumb history older than 90 days is summarized into aggregated distance/time metrics and raw points are purged.
4. **High Availability & Disaster Recovery:**
   - Daily automated logical database dumps (`pg_dump`) streamed to secondary encrypted S3 storage.
   - Redis cluster configured with AOF (Append-Only File) persistence for resilient queue management.

