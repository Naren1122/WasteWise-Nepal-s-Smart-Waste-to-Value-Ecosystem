<p align="center">
  <img src="frontend/public/logo.webp" alt="WasteWise Nepal Logo" width="130" />
</p>

<h1 align="center">WasteWise Nepal</h1>

<p align="center">
  <strong>Smart Municipal Solid Waste-to-Value SaaS Platform</strong><br>
  Modernizing municipal solid waste collection, live GPS fleet telemetry, automated billing, and citizen grievance redressal across Nepal.
</p>

<p align="center">
  <a href="https://waste-wise-nepal-s-smart-waste-to-v.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>
  <a href="https://wastewise-nepal-s-smart-waste-to-value.onrender.com/health" target="_blank">
    <img src="https://img.shields.io/badge/API%20Status-Render-46E3B7?style=for-the-badge&logo=render" alt="API Status" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-Express%20%2B%20TS-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-PostGIS%20%2B%20Prisma-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO%20%2B%20Redis-red?style=for-the-badge&logo=socketdotio" alt="Socket.IO" />
</p>

---

## 🌐 Live Deployments

- **Web Application (Frontend)**: [https://waste-wise-nepal-s-smart-waste-to-v.vercel.app](https://waste-wise-nepal-s-smart-waste-to-v.vercel.app/)
- **REST API & Telemetry Gateway (Backend)**: [https://wastewise-nepal-s-smart-waste-to-value.onrender.com](https://wastewise-nepal-s-smart-waste-to-value.onrender.com)
- **API Health Check**: [`GET /health`](https://wastewise-nepal-s-smart-waste-to-value.onrender.com/health)

---

## 📖 Executive Summary

Rapid urbanization in Nepal has strained municipal solid waste collection systems. **WasteWise Nepal** is an enterprise-grade, multi-tenant SaaS platform built to transform municipal sanitation departments from reactive operations into automated, data-driven ecosystems.

WasteWise connects municipal leaders, ward offices, collection fleet drivers, and citizens through:
1. **Hard Multi-Tenancy**: Dedicated, isolated workspaces for each municipality (e.g., Kathmandu Metropolitan City, Lalitpur, Pokhara).
2. **Real-Time GPS Fleet Telemetry**: PostGIS spatial tracking and Socket.IO real-time vehicle breadcrumbs.
3. **Automated Digital Tariffs**: Fair monthly property billing integrated with Nepal's premier payment gateways (**eSewa** and **Khalti**).
4. **Photo-Verified Citizen Grievance Redressal**: Geo-tagged citizen complaint reporting with photo uploads, SLA tracking, and status triage.

---

## ✨ Core Features & Modules

### 🏢 1. Enterprise Multi-Tenancy & Ward Partitioning
- **Strict Data Isolation**: Hard tenant boundary enforcement via `tenantId` across all relational queries and PostGIS layers.
- **Hierarchical Governance**: Super Admin (cross-municipal oversight) $\rightarrow$ Municipal Admin $\rightarrow$ Ward Officer $\rightarrow$ Fleet Driver $\rightarrow$ Citizen.
- **Subdomain-less Public Discovery**: Seamless login & registration with automated municipality detection and dynamic public tenant listings.

### 🚛 2. Real-Time Fleet Tracking & Telemetry (PostGIS + Socket.IO)
- **Live Vehicle Positions**: Real-time GPS broadcast over WebSockets backed by an Upstash Redis adapter.
- **Spatial Geofencing & Breadcrumbs**: PostGIS spatial indexing for tracking history, heading, speed, and ward-boundary containment.
- **Interactive Mapping UI**: High-performance Leaflet map integration with customized SVG vehicle markers, status filters, and live breadcrumb polyline tracing.

### 💳 3. Digital Nepal Billing & Payments (eSewa & Khalti)
- **Automated Monthly Invoicing**: Tariff generation based on property type (Residential, Commercial, Industrial, Institutional).
- **eSewa ePay v2 Integration**: Cryptographic HMAC-SHA256 signature generation and automatic webhook/callback verification.
- **Khalti E-Payment Integration**: Server-to-server transaction initiation and lookup verification.
- **Defensive Payment Integrity**: Multi-layer transaction reconciliation with idempotent state updates to eliminate duplicate credits.

### 📅 4. Waste Collection Schedules & Route Dispatch
- **Ward-Level Route Assignment**: Segregated schedules for Organic, Recyclable, Hazardous, and Bulky waste.
- **Driver Collection Feeds**: Dedicated mobile-optimized driver interface for viewing daily collection runs and updating pickup progress.
- **Citizen Collection Reminders**: Clear weekly schedules categorized by waste stream and ward location.

### 📸 5. Citizen Grievance Redressal
- **Photo-Verified Complaints**: Cloudinary-backed evidence upload with precise GPS location metadata.
- **Triage Board**: Ward officers filter complaints by status (`PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`), assign priorities, and update citizens in real time.
- **Audit Trails**: Immutable history tracking of every complaint state transition.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Styling & Components** | [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) |
| **State & Data Fetching**| [TanStack Query v5](https://tanstack.com/query/latest) (React Query), [Zod](https://zod.dev/) |
| **Mapping & Geospatial** | [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/), PostGIS |
| **Backend Framework** | [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) with strict TypeScript |
| **ORM & Database** | [Prisma ORM](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/) (Neon Serverless) with PostGIS extension |
| **Realtime & Caching** | [Socket.IO](https://socket.io/), [IORedis](https://github.com/redis/ioredis), [Upstash Redis](https://upstash.com/) |
| **Payment Gateways** | [eSewa ePay v2](https://developer.esewa.com.np/), [Khalti E-Payment v2](https://docs.khalti.com/) |
| **Storage & Uploads** | [Cloudinary](https://cloudinary.com/) (Evidence photos & documents) |
| **Unit & E2E Testing** | [Vitest](https://vitest.dev/) (193+ automated tests covering security & services) |
| **Cloud Hosting** | **Vercel** (Frontend Edge CDN) + **Render** (Backend Web Service) |

---

## 📂 Repository Architecture

WasteWise uses a clean, domain-driven feature architecture:

```text
wastewise/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma             # Multi-tenant PostgreSQL + PostGIS schema
│   │   └── seed.ts                   # Master seed script (Super Admin, Kathmandu, Lalitpur)
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/                 # Multi-tenant auth, JWT rotation & RBAC guards
│   │   │   ├── tracking/             # Socket.IO gateway, GPS telemetry & PostGIS queries
│   │   │   ├── payments/             # eSewa (HMAC-SHA256) & Khalti payment adapters
│   │   │   ├── billing/              # Monthly tariff calculations & invoice generation
│   │   │   ├── complaints/           # Citizen grievance triage & Cloudinary uploads
│   │   │   ├── schedules/            # Ward-level collection schedule dispatch
│   │   │   ├── fleet/                # Vehicle & driver allocation management
│   │   │   ├── properties/           # Household & commercial property registry
│   │   │   └── analytics/            # Municipal collection & revenue reporting
│   │   ├── shared/
│   │   │   ├── config/               # Zod-validated environment schema
│   │   │   ├── database/             # Prisma client & Redis connection pool
│   │   │   ├── errors/               # Centralized AppError hierarchy
│   │   │   └── middleware/           # Tenant resolution, auth guards & rate limiters
│   │   └── server.ts                 # HTTP server bootstrap & graceful shutdown
│   └── package.json
│
├── frontend/
│   ├── public/                       # Static branding, logo & icons
│   ├── src/
│   │   ├── app/                      # Next.js App Router (Layouts, Auth, Dashboard, etc.)
│   │   ├── features/                 # Modular UI slices matching backend domains
│   │   │   ├── auth/                 # Multi-tenant login & registration forms
│   │   │   ├── tracking/             # Live Leaflet tracking map & socket listeners
│   │   │   ├── billing/              # Invoices, eSewa/Khalti checkout modals
│   │   │   ├── complaints/           # Grievance submission form & triage board
│   │   │   └── schedules/            # Ward collection calendar & filterable tables
│   │   ├── shared/                   # Atomic Shadcn components, custom hooks & API client
│   │   └── proxy.ts                  # Development reverse proxy configuration
│   └── package.json
│
├── render.yaml                       # Render Infrastructure-as-Code Blueprint
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL**: `v15+` with `postgis` extension (or a free [Neon](https://neon.tech) database)
- **Redis**: Local Redis server or free [Upstash Redis](https://upstash.com) cluster

---

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/wastewise.git
cd wastewise
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host:5432/wastewise?sslmode=require"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="super-secret-refresh-key-min-32-chars"
CORS_ORIGIN="http://localhost:3000"
APP_FRONTEND_URL="http://localhost:3000"

# Nepal Payment Gateways (Sandbox credentials)
ESEWA_PRODUCT_CODE="EPAYTEST"
ESEWA_SECRET_KEY="8gBm/:&EnhH.1/q"
ESEWA_GATEWAY_URL="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
ESEWA_STATUS_URL="https://rc.esewa.com.np/api/epay/transaction/status/"
KHALTI_SECRET_KEY="test_secret_key_7c992762283e4fc2909438d172e259e8"
KHALTI_GATEWAY_URL="https://a.khalti.com/api/v2/epayment/"
```

Push database schema & seed initial master data:
```bash
# Push schema to database
npx prisma db push

# Seed initial Super Admin and Kathmandu municipality
npm run prisma:seed

# Start backend in watch mode
npm run dev
```
Backend API will be live at `http://localhost:5000` (Health check: `http://localhost:5000/health`).

---

### 3. Frontend Setup

In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Ensure `frontend/.env.local` contains:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
```

Start the Next.js development server:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 👥 Default Demo Credentials

| Role | Email / Identifier | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@wastewise.gov.np` | `Admin@12345` | Global system config, new municipality onboarding, all audit logs |
| **Municipal Admin** | `admin@kathmandu.gov.np` | `Admin@12345` | Kathmandu fleet, ward management, staff creation, billing |
| **Citizen** | *(Self-register on site)* | *(User chosen)* | View pickup schedules, pay waste bills, submit complaints |

---

## 🧪 Testing & Code Quality

WasteWise enforces strict unit and integration testing across all business services and security guards:

```bash
cd backend

# Run Vitest test suite
npm test
```

> **Test Suite**: 27 test suites, 193 passing tests covering:
> - PostGIS duplicate location tolerance & rate limiting
> - eSewa HMAC-SHA256 signature verification & replay attack prevention
> - Timing-attack mitigation during credential verification
> - Multi-tenant isolation and privilege escalation prevention

---

## 🛡️ Security & Reliability Measures

- **Timing-Attack Protection**: Non-existent user lookups execute a synthetic constant-time hash comparison to prevent account enumeration.
- **Role Hierarchy Guards**: Public self-registration strictly enforces the `CITIZEN` role. Staff roles (`MUNICIPAL_ADMIN`, `WARD_OFFICER`, `DRIVER`) can only be provisioned by authenticated tenant admins.
- **Defensive Payment Integrity**: Strict server-side verification of payment signatures prior to invoice settlement; idempotent processing avoids double credits.
- **Graceful Shutdown**: Intercepts `SIGINT`/`SIGTERM` to cleanly drain Socket.IO streams, stop cron schedulers, and disconnect Redis & Prisma client pools.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

<p align="center">
  Developed with ❤️ for a cleaner, greener, and digitally empowered Nepal 🇳🇵
</p>

