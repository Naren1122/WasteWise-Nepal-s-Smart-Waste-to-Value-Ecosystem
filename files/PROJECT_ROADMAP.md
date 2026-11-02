# WasteWise — Phased Implementation Roadmap

**Project:** WasteWise (Smart Waste Collection & Municipal Operations SaaS)  
**Execution Strategy:** Test-Driven Vertical Slices (Backend + Frontend + Integration Tests per Phase before advancement)  
**Target Architecture:** Multi-tenant Modular Monolith (Node.js/Express + TypeScript, Next.js 14+ App Router, PostgreSQL/PostGIS, Redis, Socket.IO)  
**Version:** 1.0  

---

## Roadmap Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASED EXECUTION PIPELINE                       │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 1: Project Skeleton, Multi-Tenant Core & Authentication        │
│    └── Backend: Express/TS, Prisma ORM, Auth JWT/RBAC, Tenant Isolation│
│    └── Frontend: Next.js App, Auth forms, Dashboard Shell, Tenant Guard│
│    └── Testing: Automated Auth & Multi-tenant boundary tests           │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 2: Master Data, Wards, Zones & Citizen/Property Registry        │
│    └── Backend: Wards, Zones, Property PostGIS points, Citizen CRUD   │
│    └── Frontend: Admin Ward Manager, Citizen Property Pin Drop Portal  │
│    └── Testing: Geo-point validations, Ward-property association tests │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 3: Service Catalog, Subscriptions & Automated Scheduling        │
│    └── Backend: Tariff rules, Subscriptions, Recurring Job Generator   │
│    └── Frontend: Tariff configurator, Citizen Calendar, Bulky Request │
│    └── Testing: Schedule generator matrix tests, Bulky workflow tests │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 4: Fleet Management, Dispatch & Field Worker PWA                │
│    └── Backend: Vehicles, Daily Routes, Stop Outcomes, Offline Sync    │
│    └── Frontend: Dispatcher Route Board, Driver Mobile PWA (Offline)   │
│    └── Testing: Stop outcome state machine, Offline sync queue tests   │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 5: Real-Time GPS Tracking & Live Map Gateway                    │
│    └── Backend: Socket.IO rooms, Throttled GPS ingestion, Shift guard  │
│    └── Frontend: Dispatcher Live Map, Citizen Vehicle Arrival Tracker  │
│    └── Testing: WebSocket connection tests, Mock GPS feed simulation   │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 6: Invoicing & Digital Nepal Payments (eSewa & Khalti)          │
│    └── Backend: Billing engine, eSewa ePay v2, Khalti API v2, Ledger   │
│    └── Frontend: Citizen Billing portal, eSewa/Khalti checkout buttons │
│    └── Testing: Tamper-proof hash check, Idempotent webhook tests      │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 7: Citizen Grievances & Redressal (Complaints)                  │
│    └── Backend: Ticket lifecycle, Photo upload, Ward SLA assignment    │
│    └── Frontend: Citizen Complaint form, Ward Officer triage board     │
│    └── Testing: Ticket state transition & escalation tests             │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 8: Municipal Analytics, Reporting & Production Readiness        │
│    └── Backend: Aggregation workers, PDF/CSV export, Audit trail       │
│    └── Frontend: Executive Analytics Dashboard, Coverage KPI charts   │
│    └── Testing: Full end-to-end smoke test suite & performance audit   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Phase Breakdown

### Phase 1: Project Foundation, Multi-Tenant Core & Authentication
* **Objective:** Establish the foundational codebase, unified monorepo or backend/frontend structure, database schema baseline, and multi-tenant authentication with role-based access control (RBAC).
* **Backend Deliverables:**
  - TypeScript Express server setup with structured layering (Controllers, Services, Repositories).
  - Database schema & ORM setup (`tenants`, `wards`, `users`).
  - Tenant context middleware (`tenant_id` extraction from headers/subdomains).
  - JWT authentication: registration, login, token refresh, password hashing with bcrypt.
  - Role-based authorization middleware (Super Admin, Municipal Admin, Ward Officer, Driver, Worker, Citizen).
* **Frontend Deliverables:**
  - Next.js 14+ (App Router, Tailwind CSS, Lucide icons, TypeScript) project setup.
  - Authentication UI: Login, Registration with Role selector, Forgot Password.
  - Protected route middleware and session store (Zustand / React Context).
  - Main responsive application shell (Sidebar, Topbar with Tenant and Ward switcher).
* **Verification & Testing (Exit Gate):**
  - Unit & Integration tests for user registration, login, and token refresh.
  - Multi-tenancy leak test: Verify user from Tenant A cannot access data from Tenant B.
  - All automated tests pass before Phase 2 begins.

---

### Phase 2: Master Data, Wards, Zones & Citizen Property Registry
* **Objective:** Enable municipalities to configure geographical service boundaries and allow citizens to register household/commercial premises with precise GPS pins.
* **Backend Deliverables:**
  - REST endpoints for Wards and Service Zones CRUD with boundary geometries.
  - Properties & Premises registry endpoints (`/api/v1/properties`).
  - Spatial validation (point-in-polygon verification ensuring property is within assigned ward).
* **Frontend Deliverables:**
  - Admin/Ward Officer portal: Ward and Service Zone configuration tables.
  - Citizen portal: "My Properties" dashboard.
  - Interactive map component (Leaflet/Mapbox) with drag-and-drop pin placement for address geocoding.
* **Verification & Testing (Exit Gate):**
  - Automated tests for property creation, update, and ward boundary validation.
  - UI test verifying responsive property registration on mobile and desktop.

---

### Phase 3: Service Catalog, Subscriptions & Scheduling Engine
* **Objective:** Digitize waste collection service plans, automate recurring pickup calendars by ward, and support on-demand bulky waste pickup requests.
* **Backend Deliverables:**
  - Service Plans and Tariffs CRUD (Flat fee in NPR, waste stream: Organic/Recyclable/Hazardous).
  - Property Subscriptions management.
  - Background cron/job runner to generate daily scheduled pickup manifests based on ward rules.
  - Bulky waste request workflow (`SUBMITTED` → `QUOTED` → `APPROVED` → `SCHEDULED`).
* **Frontend Deliverables:**
  - Municipal Admin: Service plan and tariff configuration builder.
  - Citizen Portal: Ward pickup calendar (color-coded by waste type), bulky waste request dialog.
  - Ward Officer: Bulky waste approval and quotation screen.
* **Verification & Testing (Exit Gate):**
  - Unit test verifying the recurring schedule generator across different weekdays and calendar months.
  - E2E test of the bulky waste request approval lifecycle.

---

### Phase 4: Fleet Management, Route Dispatch & Field Worker PWA
* **Objective:** Equip dispatchers with vehicle and crew assignment capabilities, and provide collection workers with a mobile-first, offline-capable PWA to execute daily routes.
* **Backend Deliverables:**
  - Fleet management endpoints (`vehicles`, crew assignments).
  - Daily Route generation and stop sequencing (`routes`, `route_stops`).
  - Stop outcome state machine: `COLLECTED`, `PARTIAL`, `MISSED`, `REJECTED`.
  - Batch offline sync endpoint for field workers with intermittent internet connectivity.
* **Frontend Deliverables:**
  - Dispatcher Web Dashboard: Daily route creation, crew assignment, and manifest review.
  - Mobile Field Worker / Driver PWA:
    - Lightweight, high-contrast mobile interface (works on low-end Android).
    - Route stop list with map navigation handoff.
    - One-tap stop verification with reason selector and photo attachment for rejected stops.
    - IndexedDB offline queue with visual sync indicator.
* **Verification & Testing (Exit Gate):**
  - Offline mode test: Disconnect network, mark 5 stops, reconnect, verify batch synchronization.
  - Stop outcome state transition verification.

---

### Phase 5: Real-Time GPS Tracking & Live Map Gateway
* **Objective:** Enable real-time operational oversight for municipal dispatchers and live arrival ETA tracking for citizens.
* **Backend Deliverables:**
  - Socket.IO server integrated with Redis Pub/Sub adapter.
  - Room isolation: `tenant:{id}:ops`, `route:{id}`.
  - GPS ingestion endpoint and WebSocket broadcast with 10-meter / 30-second throttler.
  - Shift-boundary guard: Discard location broadcasts unless driver is on an active route.
* **Frontend Deliverables:**
  - Dispatcher Live Operations Map: Real-time vehicle marker animation, route breadcrumbs, and active speed/status cards.
  - Citizen Live Tracker Widget: "Garbage Truck Approaching" notification with live map and approximate ETA.
* **Verification & Testing (Exit Gate):**
  - Socket.IO connection stress test with simulated location updates.
  - Worker privacy test: Confirm GPS transmission stops when route is marked completed.

---

### Phase 6: Invoicing & Digital Nepal Payments (eSewa & Khalti)
* **Objective:** Digitize municipal waste fee collection through automated monthly billing and direct integration with Nepal's leading digital wallets.
* **Backend Deliverables:**
  - Automated recurring monthly invoice generation.
  - eSewa (ePay v2) integration: HMAC-SHA256 signature generator and verification webhook.
  - Khalti (API v2) integration: Payment initiation session creator and lookup verifier.
  - Immutable payment transaction ledger table (`payments`).
  - Cash payment voucher workflow for ward office counters.
* **Frontend Deliverables:**
  - Citizen Invoices Screen: List of pending and paid bills with PDF receipt download.
  - Integrated Payment Modal: Select between eSewa and Khalti with redirect/lookup handler.
  - Municipal Finance Dashboard: Real-time collection metrics, digital vs cash breakdown, and reconciliation ledger.
* **Verification & Testing (Exit Gate):**
  - eSewa and Khalti sandbox test payments (successful checkout, canceled payment, hash tamper detection).
  - Idempotency test: Multiple webhook deliveries do not duplicate credits.

---

### Phase 7: Citizen Grievances & Issue Redressal (Complaints)
* **Objective:** Provide citizens with a grievance reporting channel and give ward officers a ticket management board.
* **Backend Deliverables:**
  - Complaints API (`/api/v1/complaints`) with image upload and GPS tagging.
  - Status lifecycle machine: `SUBMITTED` → `TRIAGED` → `ASSIGNED` → `RESOLVED` → `REJECTED`.
  - Automated notification triggers (SMS/Email mock/integration) on status changes.
* **Frontend Deliverables:**
  - Citizen Mobile/Web Complaint Form: Category selector (missed pickup, dumping, behavior), photo upload, GPS map pin.
  - Ward Officer Kanban / Triage Board: Filter complaints by ward, assign to supervisors, attach resolution proof photo.
* **Verification & Testing (Exit Gate):**
  - End-to-end complaint lodging, triage, resolution, and citizen notification verification.

---

### Phase 8: Municipal Analytics, Reporting & Production Hardening
* **Objective:** Deliver executive dashboards, data export capabilities, and conduct comprehensive system integration and load testing.
* **Backend Deliverables:**
  - Analytics rollup service (Daily collection completion rate, missed pickup breakdown, revenue collected).
  - CSV and PDF report exporter for municipal councils and ward committees.
  - Audit log queries and system health endpoints (`/health`).
* **Frontend Deliverables:**
  - Municipal Executive Analytics Dashboard with responsive charts (Recharts / Chart.js).
  - Printable Ward Summary Reports and Financial Reconciliation exports.
* **Verification & Testing (Exit Gate):**
  - End-to-end smoke test covering complete lifecycle (Registration → Schedule → Route Run → Payment → Complaint).
  - API load testing and P95 latency validation (< 300ms).

---

## Execution Protocol

For each phase:
1. **Backend Implementation:** Develop models, migrations, services, and REST/WebSocket endpoints.
2. **Backend Automated Tests:** Write and execute integration and unit tests.
3. **Frontend Implementation:** Develop corresponding UI pages, components, and state management.
4. **End-to-End Integration Verification:** Connect frontend to backend, test happy and edge-case paths.
5. **Phase Sign-Off:** Review phase deliverables before beginning the next phase.

