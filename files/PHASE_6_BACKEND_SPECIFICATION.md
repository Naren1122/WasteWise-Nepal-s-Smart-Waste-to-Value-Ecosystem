# WasteWise Phase 6: Invoicing & Digital Nepal Payments Specification

> **Target Version**: Phase 6 Backend Engineering Spec  
> **Scope**: Municipal Invoicing, eSewa ePay v2, Khalti E-Payment v2, Counter Cash Vouchers, Immutable Ledger & Automated Recurring Billing  
> **Compliance**: Strict TypeScript (Zero `any`), Hard Multi-Tenant Isolation, DRY / Unified Gateway Adapter Pattern, Idempotent Settlement

---

## 1. Architectural Overview & System Design

Phase 6 digitizes municipal waste fee collection for citizens and municipal administrators. It encompasses automated recurring billing, one-off bulky waste invoices, integration with Nepal's two leading payment gateways (eSewa and Khalti), and over-the-counter cash payments at ward offices.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   CITIZEN / CASHIER                    │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                     Select Payment Gateway     │
               ┌────────────────────────────────┴────────────────────────┐
               ▼                                                         ▼
     [ eSewa ePay v2 ]                                         [ Khalti E-Payment v2 ]
(HMAC-SHA256 Signatures)                                    (Server-to-Server /initiate)
               │                                                         │
               │ Redirect / Webhook                                      │ Redirect / Callback
               ▼                                                         ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                      UNIFIED PAYMENT CONTROLLER                          │
    │            POST /payments/esewa/verify   POST /payments/khalti/verify   │
    └─────────────────────────────────────┬────────────────────────────────────┘
                                          │
                                          ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                       UNIFIED PAYMENT SERVICE                            │
    │  • Gateway Strategy (IPaymentProvider)                                   │
    │  • Strict Server-to-Server Lookup Verification (Zero Trust on Client)    │
    │  • Idempotency Guard (Lock on Transaction UUID)                          │
    └─────────────────────────────────────┬────────────────────────────────────┘
                                          │
                        Atomic Prisma Interactive Transaction
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
    [ Update Payment Ledger: SUCCESS ]              [ Transition Invoice: PAID ]
      • Store raw gateway response                    • Mark paidAt timestamp
      • Record transaction reference                  • Trigger Receipt Notification
```

---

## 2. Core Security & Defensive Financial Integrity Principles

1. **Zero Client Trust (Strict Server-to-Server Verification)**:
   - Client redirect URLs (`/payment/success?data=...` or `?pidx=...`) are treated as untrusted hints.
   - For **eSewa**: The backend decodes the base64 response, validates the HMAC-SHA256 signature, and executes a secondary server-to-server status check against `https://rc.esewa.com.np/api/epay/transaction/status/` (sandbox) or `https://epay.esewa.com.np/api/epay/transaction/status/` (production).
   - For **Khalti**: The backend takes `pidx` and executes a direct server-to-server POST call to `https://a.khalti.com/api/v2/epayment/lookup/` with secret key authorization header.

2. **Idempotent Webhooks & Anti-Duplicate Crediting**:
   - Webhook or callback deliveries can arrive multiple times due to gateway retries or network replays.
   - Every transaction has an immutable internal `transactionReference` (UUID v4) and external `gatewayTransactionId` (`pidx` or eSewa `ref_id`).
   - Settle operations run inside an interactive database transaction (`prisma.$transaction`) with pessimistic row isolation: if the payment or invoice is already marked `PAID` or `SUCCESS`, return HTTP 200 without duplicate state modification.

3. **Integer Monetary Math (No Floating-Point Inaccuracies)**:
   - Currency is stored in two fields or as exact decimals with integer Paisa conversion helpers:
     - eSewa accepts NPR as decimal strings (e.g. `"150.00"`).
     - Khalti strictly requires **Paisa** as an integer (e.g. `15000` for NPR 150).
   - All tax, surcharge, and fee calculations use a centralized `CurrencyUtil` (`toPaisa`, `toNpr`, `roundNpr`) to prevent floating-point rounding errors (`0.1 + 0.2 !== 0.3`).

4. **Hard Multi-Tenant Isolation**:
   - Every invoice, invoice item, payment, and receipt record is hard-bound to `tenantId`.
   - Gateways are configured per tenant or fall back to system defaults with municipal sub-merchant IDs.

5. **Immutable Financial Ledger**:
   - Records in the `payments` table are **append-only**. Once inserted and marked `SUCCESS`, records can never be updated or deleted.
   - Corrections or refunds produce new balancing entries, preserving a complete audit trail for municipal government auditors (Auditor General of Nepal / महालेखा परीक्षक).

---

## 3. Database Schema Extensions (`schema.prisma`)

```prisma
enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  OVERDUE
  CANCELLED
}

enum PaymentGateway {
  ESEWA
  KHALTI
  CASH_COUNTER
}

enum PaymentStatus {
  INITIATED
  PENDING
  SUCCESS
  FAILED
  EXPIRED
  REFUNDED
}

enum InvoiceItemType {
  SUBSCRIPTION_FEE
  BULKY_WASTE_FEE
  PENALTY_SURCHARGE
  ADJUSTMENT
}

model Invoice {
  id                  String        @id @default(uuid()) @db.Uuid
  tenantId            String        @map("tenant_id") @db.Uuid
  citizenId           String        @map("citizen_id") @db.Uuid
  propertyId          String        @map("property_id") @db.Uuid
  subscriptionId      String?       @map("subscription_id") @db.Uuid
  bulkyWasteRequestId String?       @map("bulky_waste_request_id") @db.Uuid
  
  invoiceNumber       String        @map("invoice_number") @db.VarChar(50) // e.g., INV-KTM-202611-000001
  billingMonth        Int           @map("billing_month") // 1 - 12 (Bikram Sambat or Gregorian)
  billingYear         Int           @map("billing_year")  // e.g., 2083 BS or 2026 AD
  
  subtotalAmount      Decimal       @map("subtotal_amount") @db.Decimal(12, 2)
  discountAmount      Decimal       @default(0) @map("discount_amount") @db.Decimal(12, 2)
  taxAmount           Decimal       @default(0) @map("tax_amount") @db.Decimal(12, 2)
  totalAmount         Decimal       @map("total_amount") @db.Decimal(12, 2)
  
  status              InvoiceStatus @default(ISSUED)
  dueDate             DateTime      @map("due_date")
  paidAt              DateTime?     @map("paid_at")
  notes               String?       @db.Text
  
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  tenant              Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  citizen             User               @relation(fields: [citizenId], references: [id], onDelete: Restrict)
  property            Property           @relation(fields: [propertyId, tenantId], references: [id, tenantId], onDelete: Cascade)
  subscription        Subscription?      @relation(fields: [subscriptionId, tenantId], references: [id, tenantId], onDelete: SetNull)
  bulkyWasteRequest   BulkyWasteRequest? @relation(fields: [bulkyWasteRequestId, tenantId], references: [id, tenantId], onDelete: SetNull)
  
  items               InvoiceItem[]
  payments            Payment[]

  @@unique([id, tenantId])
  @@unique([tenantId, invoiceNumber])
  @@index([tenantId, citizenId, status])
  @@index([tenantId, propertyId])
  @@index([tenantId, status, dueDate])
  @@map("invoices")
}

model InvoiceItem {
  id          String          @id @default(uuid()) @db.Uuid
  tenantId    String          @map("tenant_id") @db.Uuid
  invoiceId   String          @map("invoice_id") @db.Uuid
  itemType    InvoiceItemType @default(SUBSCRIPTION_FEE) @map("item_type")
  description String          @db.VarChar(255)
  quantity    Int             @default(1)
  unitPrice   Decimal         @map("unit_price") @db.Decimal(12, 2)
  totalPrice  Decimal         @map("total_price") @db.Decimal(12, 2)
  createdAt   DateTime        @default(now()) @map("created_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoice     Invoice  @relation(fields: [invoiceId, tenantId], references: [id, tenantId], onDelete: Cascade)

  @@unique([id, tenantId])
  @@index([tenantId, invoiceId])
  @@map("invoice_items")
}

model Payment {
  id                   String         @id @default(uuid()) @db.Uuid
  tenantId             String         @map("tenant_id") @db.Uuid
  invoiceId            String         @map("invoice_id") @db.Uuid
  payerId              String         @map("payer_id") @db.Uuid
  collectedByUserId    String?        @map("collected_by_user_id") @db.Uuid // Cashier who handled over-the-counter cash
  
  paymentGateway       PaymentGateway @map("payment_gateway")
  status               PaymentStatus  @default(INITIATED)
  amount               Decimal        @db.Decimal(12, 2)
  currency             String         @default("NPR") @db.VarChar(3)
  
  transactionReference String         @map("transaction_reference") @db.VarChar(100) // Internal UUID
  gatewayRefId         String?        @map("gateway_ref_id") @db.VarChar(150)        // eSewa refId or Khalti pidx
  gatewayResponse      Json?          @map("gateway_response")                      // Raw callback response for auditing
  
  receiptNumber        String?        @map("receipt_number") @db.VarChar(50)        // Auto-generated MUNI-REC-YYYYMM-XXXXX
  paidAt               DateTime?      @map("paid_at")
  createdAt            DateTime       @default(now()) @map("created_at")
  updatedAt            DateTime       @updatedAt @map("updated_at")

  tenant               Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoice              Invoice  @relation(fields: [invoiceId, tenantId], references: [id, tenantId], onDelete: Restrict)
  payer                User     @relation(name: "PayerRelation", fields: [payerId], references: [id], onDelete: Restrict)
  collectedBy          User?    @relation(name: "CashierRelation", fields: [collectedByUserId], references: [id], onDelete: SetNull)

  @@unique([id, tenantId])
  @@unique([tenantId, transactionReference])
  @@index([tenantId, gatewayRefId])
  @@index([tenantId, invoiceId, status])
  @@index([tenantId, payerId])
  @@map("payments")
}
```

---

## 4. DRY Architectural Design & Provider Pattern

To achieve **zero duplicate code** and maintain high scalability, all payment integrations adhere to the **Strategy / Provider Pattern**:

### 4.1 Payment Provider Strategy Interface (`payments.types.ts`)
```typescript
export interface PaymentInitiationResult {
  transactionReference: string;
  gateway: PaymentGateway;
  paymentUrl?: string; // Khalti redirect URL
  formData?: Record<string, string>; // eSewa form payload (signature, product_code, etc.)
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  gatewayRefId: string;
  paidAmount: number;
  rawResponse: Record<string, unknown>;
  errorMessage?: string;
}

export interface IPaymentProvider {
  readonly gateway: PaymentGateway;
  initiatePayment(params: {
    tenantId: string;
    invoice: InvoiceWithItems;
    payer: UserContext;
    transactionReference: string;
  }): Promise<PaymentInitiationResult>;

  verifyPayment(params: {
    tenantId: string;
    payload: unknown;
  }): Promise<PaymentVerificationResult>;
}
```

### 4.2 Factory Registration (`payments.factory.ts`)
```typescript
export class PaymentProviderFactory {
  private static providers = new Map<PaymentGateway, IPaymentProvider>();

  public static register(provider: IPaymentProvider): void {
    this.providers.set(provider.gateway, provider);
  }

  public static get(gateway: PaymentGateway): IPaymentProvider {
    const provider = this.providers.get(gateway);
    if (!provider) {
      throw new BadRequestError(`Unsupported payment gateway: ${gateway}`);
    }
    return provider;
  }
}
```

---

## 5. Gateway Integrations (Nepal Specifications)

### 5.1 eSewa ePay v2 Specification
- **Initiation Endpoint**: `https://rc-epay.esewa.com.np/api/epay/main/v2/form` (sandbox) / `https://epay.esewa.com.np/api/epay/main/v2/form` (production).
- **Signature Message**: `total_amount,transaction_uuid,product_code`.
- **Hashing**: HMAC-SHA256 encoded in Base64 using `ESEWA_SECRET_KEY`.
- **Callback Verification**:
  1. Consumer is redirected to return URL with base64 encoded query parameter `?data=...`.
  2. Backend decodes JSON payload: `{ transaction_code, status, total_amount, transaction_uuid, product_code, signature }`.
  3. Re-compute HMAC-SHA256 signature to verify message integrity.
  4. Perform secondary server-to-server status check:
     `GET https://rc.esewa.com.np/api/epay/transaction/status/?product_code=...&total_amount=...&transaction_uuid=...`
  5. Check `status === 'COMPLETE'`.

### 5.2 Khalti E-Payment v2 Specification
- **Initiation Endpoint**: `POST https://a.khalti.com/api/v2/epayment/initiate/` (sandbox) / `https://khalti.com/api/v2/epayment/initiate/` (production).
- **Headers**: `Authorization: Key {KHALTI_SECRET_KEY}`, `Content-Type: application/json`.
- **Payload**:
  ```json
  {
    "return_url": "https://muni.wastewise.gov.np/payment/khalti/callback",
    "website_url": "https://muni.wastewise.gov.np",
    "amount": 15000,
    "purchase_order_id": "INV-KTM-202611-000001",
    "purchase_order_name": "Waste Collection Fee - November 2026",
    "customer_info": {
      "name": "Ram Bahadur",
      "email": "citizen@kathmandu.gov.np",
      "phone": "9851000001"
    }
  }
  ```
- **Lookup Endpoint**:
  `POST https://a.khalti.com/api/v2/epayment/lookup/` with body `{"pidx": pidx}`.
- Status check: `status === 'Completed'`.

### 5.3 Over-the-Counter Cash Payments (`CASH_COUNTER`)
- Restricted strictly to `MUNICIPAL_ADMIN`, `DISPATCHER`, or `WARD_OFFICER` roles.
- The cashier passes `invoiceId` and received cash amount.
- An interactive transaction creates the `Payment` ledger row with `collectedByUserId = req.user.id`, transitions `Invoice` to `PAID`, and generates an official municipal receipt number `REC-{WARD}-{YEAR}-{SEQ}`.

---

## 6. Endpoints & Route Definitions

| Method | Endpoint | Description | Role Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/invoices` | List invoices (paginated, filtered by ward/status/date) | `ADMIN`, `DISPATCHER`, `WARD_OFFICER` |
| `GET` | `/api/v1/invoices/my` | Citizen's invoices for registered properties | `CITIZEN` |
| `GET` | `/api/v1/invoices/:id` | Detailed invoice view with itemized line items | `CITIZEN` (owner), Staff |
| `POST` | `/api/v1/invoices/generate-monthly` | Trigger batch monthly recurring invoice run | `SUPER_ADMIN`, `MUNICIPAL_ADMIN` |
| `POST` | `/api/v1/payments/initiate` | Initiate digital payment (returns eSewa form / Khalti URL) | `CITIZEN`, Staff |
| `POST` | `/api/v1/payments/esewa/verify` | Verify eSewa callback payload & settle invoice | Public / Webhook |
| `POST` | `/api/v1/payments/khalti/verify` | Verify Khalti `pidx` lookup & settle invoice | Public / Webhook |
| `POST` | `/api/v1/payments/cash-counter` | Record over-the-counter cash settlement & issue receipt | `WARD_OFFICER`, `ADMIN` |
| `GET` | `/api/v1/payments/:id/receipt` | Download / view printable tax receipt payload | `CITIZEN`, Staff |

---

## 7. Automated Recurring Billing Engine (BullMQ Worker)

```
[Cron: 1st of every month 00:00 NPT]
                   │
                   ▼
[BillingScheduler] -> Enqueues 'generate-monthly-invoices' job
                   │
                   ▼
[BillingQueueWorker]
   1. Fetches all active tenants.
   2. For each tenant, fetches active Subscriptions where status = 'ACTIVE'.
   3. Chunks properties into batches of 250 to prevent memory pressure.
   4. Performs idempotent generation: checks if invoice already exists for (tenantId, subscriptionId, month, year).
   5. Creates Invoice + InvoiceItems atomically.
   6. Emits summary event and enqueues SMS/Email notification alerts to citizens.
```

---

## 8. Step-by-Step Implementation Plan

1. **Step 1: Prisma Schema & Migration**:
   - Add `Invoice`, `InvoiceItem`, and `Payment` models with indexes and unique constraints.
   - Run `npx prisma db push` to synchronize Neon PostgreSQL.
   - Regenerate Prisma client.

2. **Step 2: Environment Config & Currency Utility**:
   - Add eSewa and Khalti API URLs and test keys to `src/shared/config/env.ts` and `.env.example`.
   - Create `src/shared/utils/currency.util.ts` for safe integer Paisa/NPR conversion and standard rounding.

3. **Step 3: Billing Feature Slice (`src/features/billing`)**:
   - `billing.types.ts`: DTOs and repository interfaces.
   - `billing.schema.ts`: Zod validation schemas.
   - `billing.repository.ts`: Tenant-scoped queries with pagination.
   - `billing.service.ts`: Monthly recurring billing calculation & invoice lifecycle management.
   - `billing.controller.ts`: HTTP request handling.
   - `billing.routes.ts`: Routes with role guard binding.
   - `__tests__/billing.service.spec.ts`: Colocated unit tests.

4. **Step 4: Payments Feature Slice (`src/features/payments`)**:
   - `payments.types.ts`: Strategy interfaces and DTOs.
   - `providers/esewa.provider.ts`: HMAC-SHA256 signature generator and verification client.
   - `providers/khalti.provider.ts`: Server-to-server initiate and lookup client.
   - `payments.factory.ts`: Gateway strategy resolver.
   - `payments.repository.ts`: Immutable ledger persistence and atomic invoice updates.
   - `payments.service.ts`: Idempotent settlement orchestration.
   - `payments.controller.ts` & `payments.routes.ts`.
   - `__tests__/esewa.provider.spec.ts` & `__tests__/khalti.provider.spec.ts`.
   - `__tests__/payments.service.spec.ts`.

5. **Step 5: Recurring Billing Scheduler & Server Integration**:
   - Create `billing.scheduler.ts` for daily/monthly automated invoice generation.
   - Register routes in `src/app.ts` and scheduler in `src/server.ts`.

6. **Step 6: Comprehensive Verification**:
   - Run full Vitest suite.
   - Run `tsc --noEmit` across backend and frontend.
   - Test sandbox payments with mock gateway responses.

