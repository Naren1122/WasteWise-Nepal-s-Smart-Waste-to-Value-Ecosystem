# WasteWise Global Project & Engineering Rules

> **Scope**: Entire Repository (Frontend, Backend, and Shared Packages)  
> **Target Stack**: Multi-Tenant Modular Architecture (Node.js/Express + TypeScript, Next.js App Router + TypeScript, PostgreSQL/PostGIS + Prisma ORM, Redis, BullMQ, Socket.IO, Tailwind CSS, TanStack Query, Zod)

---

## 1. Feature-Based Architecture & Directory Structure

Organize both frontend and backend by **business domain/feature**, not by technical layer. Features must be self-contained and loosely coupled.

### 1.1 Backend Feature Structure (`server/src` or `apps/api/src`)
```
src/
├── features/ (or modules/)
│   └── [feature-name]/                # e.g., auth, tracking, billing, fleet, complaints
│       ├── [feature].controller.ts    # Request handling & HTTP status only
│       ├── [feature].service.ts       # Core business logic & orchestration
│       ├── [feature].repository.ts    # Data access & Prisma queries (tenant-scoped)
│       ├── [feature].routes.ts        # Route definitions & middleware binding
│       ├── [feature].schema.ts        # Zod input validation schemas
│       ├── [feature].types.ts         # Feature-specific domain types & DTOs
│       ├── [feature].errors.ts        # Custom domain exceptions (optional)
│       └── __tests__/                 # Feature-specific unit & integration tests
├── shared/                            # Strictly cross-cutting utilities only
│   ├── config/                        # Env validation & global configs
│   ├── database/                      # Prisma client, migrations & extensions
│   ├── errors/                        # Global AppError, ErrorCodes & Error handler
│   ├── middleware/                    # Auth, tenant context, rate limiting, logging
│   ├── utils/                         # Pure helper functions (date, crypto, math)
│   └── types/                         # Global shared types (ApiResponse, PaginatedResult)
└── app.ts / server.ts                 # App bootstrap & middleware registration
```

### 1.2 Frontend Feature Structure (`client/src` or `apps/web/src`)
```
src/
├── app/                               # Next.js App Router (routing & layouts only)
│   ├── (auth)/login/page.tsx          # Route entry points
│   ├── (dashboard)/
│   │   ├── fleet/page.tsx
│   │   └── tracking/page.tsx
│   └── api/                           # Route handlers (if applicable)
├── features/                          # Feature slices (contains business logic & UI)
│   └── [feature-name]/                # e.g., tracking, complaints, billing
│       ├── components/                # Feature-specific UI components
│       ├── hooks/                     # Custom React hooks (e.g., useLiveTracking, useInvoices)
│       ├── api/ or services/          # API client calls (TanStack Query hooks / fetchers)
│       ├── types/                     # Feature-specific interfaces & Zod schemas
│       ├── utils/                     # Feature-specific calculations / formatters
│       └── __tests__/                 # Component and hook tests
└── shared/                            # Global reusable UI and utilities
    ├── components/
    │   ├── ui/                        # Atomic design components (Button, Input, Modal, Badge)
    │   ├── feedback/                  # Toast, Skeleton, EmptyState, ErrorState
    │   └── layout/                    # Sidebar, Navbar, PageHeader, Container
    ├── hooks/                         # Generic hooks (useDebounce, useMediaQuery, useLocalStorage)
    ├── lib/                           # Axios/fetch instance, queryClient config
    └── utils/                         # Classnames (cn), currency formatters, date formatters
```

---

## 2. Strict TypeScript & Absolute Prohibition of `any`

TypeScript strictness is mandatory to prevent runtime failures and maintain self-documenting code.

- **Zero `any` Policy**:
  - Never use `any`. Use `unknown` when the type is truly dynamic, and narrow it using type guards, `typeof`, `instanceof`, or runtime schema parsers (`Zod`).
  - Prohibit `as any` casting. If a library lacks types, declare a typed ambient module (`*.d.ts`) or use `as unknown as ExpectedType` with documented justification.
- **Strict Compiler Settings**:
  - `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, `"noUncheckedIndexedAccess": true`.
- **Explicit Return Types**:
  - All public/exported service methods, API route handlers, and utility functions must specify explicit return types.
  - Do not let complex inferred types leak across architectural boundaries.
- **Discriminated Unions over Loose Booleans**:
  - Represent multi-state processes using discriminated unions instead of multiple nullable fields and flags:
    ```typescript
    // BAD
    type VehicleStatus = { isMoving?: boolean; isIdle?: boolean; isMaintenance?: boolean };

    // GOOD
    type VehicleState =
      | { status: 'MOVING'; speedKmh: number; heading: number }
      | { status: 'IDLE'; idleSince: Date }
      | { status: 'MAINTENANCE'; reason: string };
    ```
- **Type Narrowing with Zod**:
  - All external data (HTTP bodies, query params, WebSocket payloads, environment variables) must be parsed through Zod schemas. Infer TypeScript types directly from schemas:
    ```typescript
    export const CreatePickupSchema = z.object({
      wardId: z.string().uuid(),
      wasteType: z.enum(['ORGANIC', 'RECYCLABLE', 'HAZARDOUS', 'BULKY']),
      estimatedWeightKg: z.number().positive().optional(),
    });
    export type CreatePickupDto = z.infer<typeof CreatePickupSchema>;
    ```

---

## 3. Code Maintainability, Modularity & File Size Limits

Keep code small, readable, and single-purpose.

- **File Length Limits**:
  - Maximum **150–200 lines** per file. If a file exceeds 200 lines, split it:
    - Extract sub-components into dedicated files.
    - Move business logic out of components/controllers into custom hooks or services.
    - Move complex utility functions and data transforms into helper files.
- **Function Size Limits**:
  - Functions must stay under **30–40 lines**. If a function does multiple things, extract helper functions with clear descriptive names.
- **Single Responsibility Principle (SRP)**:
  - **Controllers**: Only extract request parameters, validate via Zod, call service, and send HTTP response. No database queries or business algorithms inside controllers.
  - **Services**: Pure business rules and orchestration. No direct HTTP objects (`req`, `res`).
  - **Repositories / Query Helpers**: Database access, filtering, pagination, and multi-tenant scoping.
  - **UI Components**: Render UI and delegate interactions to event handlers. Push async calls, state orchestration, and socket events into custom hooks.

---

## 4. DRY (Don't Repeat Yourself) & Code Reusability

Eliminate redundant logic without creating premature or overly coupled abstractions.

- **Unified API Response Envelope**:
  - Standardize all backend responses with a shared wrapper:
    ```typescript
    export interface ApiResponse<T> {
      success: true;
      data: T;
      message?: string;
      meta?: {
        timestamp: string;
        tenantId: string;
      };
    }

    export interface PaginatedResponse<T> extends ApiResponse<T[]> {
      pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }
    ```
- **Reusable Frontend Primitives**:
  - Extract reusable design tokens into `src/shared/components/ui/` (buttons, dialogs, dropdowns, inputs, data tables). Never write ad-hoc modal overlays or form inputs repeatedly.
- **Shared Data Utilities**:
  - Nepali currency formatting (`NPR`), date formatting (AD/BS if needed), GPS distance calculation (`haversineDistance`), and string sanitization must reside in `shared/utils` and be unit tested.
- **Do Not Duplicate Validation**:
  - Share or mirror Zod schemas between frontend and backend where appropriate to ensure identical validation rules.

---

## 5. Centralized Global Error Handling (Zero Redundant Try-Catch)

Eliminate repetitive `try/catch` boilerplate in controllers and route handlers.

### 5.1 Backend Error Strategy
- **Custom `AppError` Hierarchy**:
  - Create a strongly-typed base `AppError` extending `Error`:
    ```typescript
    export class AppError extends Error {
      constructor(
        public readonly message: string,
        public readonly statusCode: number = 500,
        public readonly errorCode: string = 'INTERNAL_SERVER_ERROR',
        public readonly details?: unknown
      ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
      }
    }
    export class NotFoundError extends AppError {
      constructor(resource: string, id?: string) {
        super(id ? `${resource} with id '${id}' not found` : `${resource} not found`, 404, 'NOT_FOUND');
      }
    }
    export class UnauthorizedError extends AppError {
      constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
      }
    }
    export class ForbiddenError extends AppError {
      constructor(message = 'Access denied') {
        super(message, 403, 'FORBIDDEN');
      }
    }
    export class ValidationError extends AppError {
      constructor(details: unknown) {
        super('Invalid request data', 422, 'VALIDATION_ERROR', details);
      }
    }
    export class ConflictError extends AppError {
      constructor(message: string) {
        super(message, 409, 'CONFLICT');
      }
    }
    ```
- **No Manual `try/catch` in Express Controllers**:
  - Use an `asyncHandler` wrapper or native Express 5 / `express-async-errors` to catch rejected promises and forward them to the global error middleware automatically:
    ```typescript
    export const asyncHandler = (fn: RequestHandler): RequestHandler => 
      (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
    ```
- **Global Error Middleware**:
  - One final middleware in Express to intercept all errors, log stack traces in non-production, sanitize sensitive error details, and return a consistent JSON response:
    ```json
    {
      "success": false,
      "error": {
        "code": "NOT_FOUND",
        "message": "Ward with id '123' not found",
        "timestamp": "2026-11-02T12:00:00.000Z"
      }
    }
    ```

### 5.2 Frontend Error Strategy
- **React Error Boundaries**: Wrap page routes and complex widgets (like Live Tracking Maps) with Next.js `error.tsx` or component boundaries to prevent single-widget crashes from breaking the whole application.
- **Centralized API Client Interceptor**:
  - Catch 401 Unauthorized errors globally and trigger token refresh or session redirect.
  - Show user-friendly toast alerts on network or 500 errors without requiring manual catch blocks in every UI component.
- **TanStack Query Global Error Handler**:
  - Configure `QueryCache` and `MutationCache` default error callbacks.

---

## 6. Performance Optimization & Efficient Data Fetching

Optimize loading times, minimize network payloads, and support municipal scale.

### 6.1 Backend & Database Performance
- **Mandatory Pagination**:
  - Every list endpoint must be paginated. Default page size: 20, maximum: 100.
  - Use cursor-based pagination for high-volume append-heavy feeds (GPS logs, audit trails, event feeds).
  - Use limit-offset pagination for administrative data tables (wards, users, vehicles).
- **Index Optimization & PostGIS**:
  - Enforce database indexes on all foreign keys, lookup codes, and compound queries: `(tenant_id, created_at)`, `(tenant_id, status)`.
  - Use PostGIS spatial indexes (`GIST`) for geometry/geography columns (property locations, route polylines, bin GPS points).
  - Never perform unindexed `ST_DWithin` spatial calculations on unbounded tables.
- **Selective Query Projections**:
  - In Prisma queries, always specify `select` or `omit` to fetch only required fields. Never perform indiscriminate `SELECT *` on large schemas.
- **Caching & Background Offloading**:
  - Cache static or slow-changing configurations (municipal billing rates, ward boundaries) in Redis.
  - Offload heavy tasks (batch invoices, SMS blasts, PDF reports) to BullMQ background workers. Never execute blocking long tasks in HTTP request cycles.

### 6.2 Frontend Performance
- **React Server Components (RSC) & Streaming**:
  - Fetch initial data on the server with Next.js Server Components to reduce client bundle size and eliminate initial loading waterfalls.
  - Use `<Suspense fallback={<Skeleton />}>` for modular data streaming.
- **Client Caching with TanStack Query**:
  - Use TanStack Query with appropriate `staleTime` (e.g., 5 minutes for master data, 0–5 seconds for live vehicle locations).
  - Deduplicate identical requests automatically; avoid storing server response state in global client stores (Zustand/Redux).
- **Code Splitting & Lazy Loading**:
  - Dynamically import heavy third-party libraries (Mapbox GL, Leaflet, Chart.js, PDF renderers) using `next/dynamic` or `React.lazy` with `ssr: false`.
- **Image & Asset Optimization**:
  - All images (grievance proof photos, profile avatars) must use `next/image` with WebP format and responsive `sizes`.
- **Search & Input Throttling**:
  - Debounce search inputs, filter selectors, and map drag/zoom events (minimum 300ms debounce).

---

## 7. Multi-Tenancy Isolation & Security Rules

Multi-tenancy is the foundation of WasteWise. Leakage across municipal tenants is a zero-tolerance failure.

- **Hard Tenant Isolation**:
  - Every table except global system metadata must contain a `tenant_id` foreign key.
  - All database queries must enforce an explicit `tenant_id` clause:
    ```typescript
    // REQUIRED PATTERN
    prisma.property.findMany({
      where: {
        tenantId: req.tenant.id,
        wardNumber: 4,
      },
    });
    ```
- **Context Injection**:
  - Tenant context is resolved at the middleware layer via subdomain or authenticated JWT claim.
  - Never allow client requests to override `tenant_id` via request body or query parameter.
- **Payment Signature Verification (Defensive Integrity)**:
  - eSewa HMAC-SHA256 signatures and Khalti server-to-server lookups must be strictly verified on the backend before updating any invoice state.
  - Webhooks and payment callback endpoints must be idempotent to prevent duplicate credits.
- **Input Sanitization & Secrets Security**:
  - Never trust client inputs; sanitize strings and validate schemas with Zod before processing.
  - Never commit `.env` files or API secrets. Access environment variables only through a validated configuration module (e.g., `src/shared/config/env.ts`).

---

## 8. Naming Conventions & Code Style

- **Files & Folders**: `kebab-case` (e.g., `vehicle-tracker.component.tsx`, `invoice-generator.service.ts`).
- **React Components**: `PascalCase` (e.g., `GrievanceTriageBoard`).
- **Functions & Methods**: `camelCase` (e.g., `calculateTariff`, `resolveTicket`).
- **Types & Interfaces**: `PascalCase` (e.g., `WasteCollectionSchedule`, `PaymentVerificationResult`). Do not use `I` prefix (use `User`, not `IUser`).
- **Enums & Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`, `PAYMENT_STATUS_PAID`). Prefer `as const` object maps over TypeScript `enum` for better bundle optimization.
- **Boolean Variables**: Prefix with `is`, `has`, `should`, or `can` (e.g., `isActive`, `hasUnpaidInvoices`).

---

## 9. Testing & Code Quality Assurance

- **Colocated Unit Tests**:
  - Place unit test files right next to the code under test (e.g., `tariff.service.ts` -> `tariff.service.spec.ts`).
- **Vertical Slice Integration Tests**:
  - Every new feature must include integration tests covering the route, service, and database interaction with multi-tenant isolation verification.
- **Mocking External APIs**:
  - Always mock third-party external APIs (eSewa, Khalti, Sparrow SMS, S3) in test environments using dedicated mock adapters.

---

## 10. Strict UI/UX Design System & Responsive Rules

This design system is mandatory across all frontend pages and features to guarantee an alluring, enterprise-grade, client-ready aesthetic with 100% component consistency.

### 10.1 Typography & Native Free Font Stack
- **Font Stack**: Always use native `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`.
  - Zero external web font downloads (0 KB network latency, 0 Layout Shift/CLS).
  - Clear rendering on low-cost government Android devices, iPads, and High-DPI Desktop monitors.
- **Fluid Font Scale (No Micro-Fonts)**:
  - Mobile Base (`< 640px`): `15px` (`text-[15px]` / `line-height: 1.5rem`). **Never drop below 15px for body/inputs on mobile**.
  - Desktop Base (`> 1024px`): `15px–16px` (`text-[16px]`).
  - Section Headings: `18px` (Mobile) / `22px–24px` (Desktop).
  - Page Titles: `22px` (Mobile) / `28px–32px` (Desktop).
  - The absolute smallest text in the entire system is `12px` (strictly for uppercase status badges).

### 10.2 Mandatory Component Standardization (Zero Ad-Hoc UI)
Never create one-off buttons, raw HTML inputs, or bespoke modals. All components must import from `@/shared/components/ui/` with exact matching height, font, and border radius:

- **Buttons (`Button`)**:
  - **Height**: Standard `h-10` (40px) on Desktop; `h-12` (48px) full-width on Mobile touch screens (`w-full sm:w-auto`).
  - **Font**: Fixed `text-[15px]` font-medium (`Segoe UI/Tahoma`).
  - **Corner Radius**: Fixed `rounded-lg` (8px).
  - **Color Tokens**:
    - Primary: `bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-[0.98]`
    - Secondary: `bg-slate-100 hover:bg-slate-200 text-slate-900`
    - Outline: `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`
    - Destructive: `bg-rose-600 hover:bg-rose-700 text-white shadow-sm`
- **Text Inputs & Dropdowns (`Input` & `Select`)**:
  - **Height**: Exactly matches Button height (`h-10` / 40px desktop, `h-11` / 44px mobile).
  - **Font & Text**: Fixed `text-[15px] font-normal text-slate-900 placeholder:text-slate-400`.
  - **Border & Focus Ring**: `border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20`.
- **Status Badges (`Badge`)**:
  - Fixed `h-6 px-2.5 text-[12px] font-semibold tracking-wide uppercase rounded-full border inline-flex items-center`.
  - `ACTIVE`: `bg-emerald-50 text-emerald-700 border-emerald-200`
  - `PENDING`: `bg-amber-50 text-amber-700 border-amber-200`
  - `INACTIVE`: `bg-rose-50 text-rose-700 border-rose-200`
- **Cards (`Card`)**:
  - Fixed `bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow`.

### 10.3 Responsive Screen Rules (Mobile, Tablet, Desktop)
- **Mobile (< 640px)**:
  - Single-column flow (`grid-cols-1`, `flex-col`).
  - Minimum touch target for all clickable elements is **44 × 44 px**.
  - Modals adapt into bottom sliding sheets (`Sheet`).
  - Tables convert into stacked card views.
- **Tablet (640px – 1024px)**:
  - 2-Column layout (`grid-cols-1 sm:grid-cols-2 gap-4`).
  - Collapsible icon sidebar to maximize screen real estate.
- **Desktop / Laptop (> 1024px)**:
  - Multi-column complex dashboard grids (`grid-cols-3` or `grid-cols-4`).
  - Max container width capped at `max-w-7xl` with `px-6` to `px-8` gutters.

### 10.4 Modern React 19 UI Paradigms
- Use `useTransition` for smooth non-blocking tab switches and view transitions.
- Use `useOptimistic` for instant feedback on status changes and item updates.
- Use `useActionState` for streamlined form actions and server responses.


