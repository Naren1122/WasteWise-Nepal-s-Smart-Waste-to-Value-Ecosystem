# WasteWise — Minimum Product Requirements Document (PRD)

**Product:** WasteWise (Smart Waste Collection & Municipal Operations SaaS)  
**Target Market:** Nepal Local Governments & Municipalities  
**Version:** 1.0 (MVP Baseline)  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Problem Statement

Municipal solid waste management across Nepalese local governments suffers from irregular pickup schedules, lack of operational transparency, paper-based billing, low citizen accountability, and delayed grievance redressal. 

**WasteWise** is a lightweight, multi-tenant B2G/B2B/B2C SaaS platform that connects:
1. **Municipal Administrators & Ward Offices** (oversight, scheduling, invoicing),
2. **Collection Crews & Drivers** (route execution, real-time stop verification), and
3. **Citizens & Commercial Waste Generators** (schedules, digital payments, issue reporting).

**Core Value Proposition:** Provide municipalities with a single pane of glass for scheduled collection, live progress, revenue collection, and citizen complaints, while providing residents with predictable service, digital payment options, and transparent complaint tracking.

---

## 2. Product Goals & Out-of-Scope (Non-Goals)

### 2.1 Core MVP Goals
- **Multi-Tenant Municipal Operations:** Strict tenant-level isolation allowing each municipality to configure its wards, service zones, tariffs, and teams.
- **Predictable Service Scheduling:** Automate recurring ward-level pickup schedules and support ad-hoc bulky waste requests.
- **Operational Visibility:** Field-level verification of pickup completion, missed stops, and vehicle route progress.
- **Digital NPR Payments:** Direct billing and invoice settlement via Nepal’s primary digital wallets (**eSewa** and **Khalti**).
- **Citizen Engagement & Grievance Redressal:** Mobile-first portal/PWA for households to log missed pickups, dump reports, and track resolution.

### 2.2 Out-of-Scope for MVP (Non-Goals)
- Autonomous AI-driven dispatch or dynamic rerouting without human operator approval.
- Integration or replacement of government tax, budget, or civil civil-registry ERP systems.
- Proprietary turn-by-turn map navigation engine (standard map handoff to Google Maps/OSM will be used).
- Full recycling facility supply-chain ERP or industrial automated sorting mechanics.
- Automatic punitive fines or legal enforcement generated solely by AI.

---

## 3. User Personas & Role Matrix

| Role | Scope | Key Responsibilities |
| :--- | :--- | :--- |
| **SaaS Super Admin** | Platform-wide | Onboard municipality tenants, manage subscription plans, system health. |
| **Municipal Admin** | Municipality Tenant | Configure wards, service zones, waste categories, billing tariffs, and staff. |
| **Ward Officer** | Assigned Ward(s) | Review localized pickup compliance, manage citizen complaints, approve ad-hoc pickups. |
| **Operations Manager** | Municipality / Contractor | Assign vehicles and crews, track route progress, handle missed-stop escalations. |
| **Driver / Crew Lead** | Assigned Vehicle & Route | View stops, log route start/finish, navigate stops, report route delays. |
| **Collection Worker** | Assigned Crew | Mark stops as Collected, Missed, or Rejected with optional photo/reason. |
| **Citizen / Household** | Own Residence | View pickup schedule, pay monthly waste fees via eSewa/Khalti, report issues. |
| **Commercial Generator** | Business Premises | Manage bulk waste requests, track multi-location invoices, log waste declarations. |

---

## 4. MVP Core Functional Requirements

### 4.1 Tenant & Ward Management
- **FR-1.1:** Support municipality creation with custom metadata (Nepali/English name, logo, contact, timezone: `Asia/Kathmandu`, currency: `NPR`).
- **FR-1.2:** Configure municipal wards (e.g., Ward 1 to Ward 32) and operational service zones within each ward.
- **FR-1.3:** Define standardized waste streams (Organic/Biodegradable, Inorganic/Recyclable, Hazardous, Bulky).

### 4.2 Citizen & Property Registry
- **FR-2.1:** Citizen signup and login via mobile phone number (OTP-ready) or email/password.
- **FR-2.2:** Profile creation with service address, ward assignment, property type (residential, commercial, institutional), and optional GPS pin.
- **FR-2.3:** Support multiple service locations under a single citizen or commercial account.

### 4.3 Scheduling & Ad-Hoc Service Requests
- **FR-3.1:** Recurring schedule generator by ward and waste category (e.g., Ward 4: Organic on Sun/Wed, Recyclable on Fri).
- **FR-3.2:** On-demand request workflow for bulky waste (furniture, construction debris) with municipal approval and quotation.
- **FR-3.3:** Holiday and municipal emergency schedule override calendar.

### 4.4 Route Execution & Field Crew Workflow
- **FR-4.1:** Dispatcher tools to group stops into routes and assign drivers, crews, and vehicles.
- **FR-4.2:** Lightweight, mobile-friendly PWA for collection crews operating under low-bandwidth conditions.
- **FR-4.3:** Stop outcome logging: `Collected`, `Partial`, `Missed` (with reason: Road blocked, Gate locked, Waste not separated), or `Cancelled`.
- **FR-4.4:** Optional photo attachment for missed or contaminated waste incidents.
- **FR-4.5:** Vehicle location transmission during active route shifts for dispatcher overview and citizen ETA notifications.

### 4.5 Billing, Invoicing & Digital Payments
- **FR-5.1:** Automated monthly recurring invoice generation based on ward-configured flat tariffs or property type.
- **FR-5.2:** Integration with **eSewa** (ePay v2) and **Khalti** (Web Checkout / E-Payment API) supporting end-to-end NPR settlement.
- **FR-5.3:** Real-time webhook payment confirmation, receipt generation, and status synchronization.
- **FR-5.4:** Manual offline payment reconciliation for citizens paying in cash at ward offices.

### 4.6 Complaints & Grievance Redressal
- **FR-6.1:** Citizen complaint logging for missed pickups, illegal dumping, staff misconduct, or vehicle overflow.
- **FR-6.2:** Mandatory geo-tagging or ward selection and photo attachment for dumping complaints.
- **FR-6.3:** Status tracking workflow: `Submitted` → `Under Review` → `Assigned` → `Resolved` / `Rejected`, with SMS/push notification updates.

---

## 5. Key End-to-End User Journeys

```
Journey 1: Citizen Registration to Service Delivery & Payment
[Citizen Signs Up] ➔ [Selects Ward & Location] ➔ [Subscribes to Service Plan] ➔ 
[Views Ward Pickup Calendar] ➔ [Waste Collected by Crew] ➔ [Monthly Invoice Issued] ➔ 
[Settles via eSewa / Khalti] ➔ [Digital PDF Receipt Issued]

Journey 2: Field Crew Daily Collection Run
[Dispatcher Creates Daily Route] ➔ [Crew Logs into Mobile PWA] ➔ [Starts Route Run] ➔ 
[Navigates to Scheduled Stops] ➔ [Marks Outcome: Collected / Missed] ➔ 
[Uploads Photo if Rejected] ➔ [Completes Route Run] ➔ [Summary Sent to Ward Office]

Journey 3: Grievance Lodging & Resolution
[Citizen Reports Missed Pickup] ➔ [Ward Officer Receives Ticket] ➔ 
[Re-assigns to Route Supervisor] ➔ [Special Pickup Executed] ➔ 
[Crew Uploads Proof of Resolution] ➔ [Ticket Marked Resolved & Citizen Notified]
```

---

## 6. Non-Functional Requirements (NFRs)

| Metric / Dimension | MVP Specification |
| :--- | :--- |
| **Mobile Responsiveness** | Worker and Citizen interfaces must run smoothly on low-end Android smartphones (PWA, screen width down to 360px). |
| **Network Resilience** | Field worker app must cache route stops locally and queue collection status updates when connectivity drops. |
| **Tenant Isolation** | Strict multi-tenancy; zero leakage of ward, financial, or citizen data across municipalities. |
| **Localization & Time** | Standard currency: NPR (`रू`); Timezone: `Asia/Kathmandu`; dual calendar support (Bikram Sambat BS and Gregorian AD). |
| **Security & Privacy** | End-to-end TLS encryption; salted password hashing (Argon2/bcrypt); GPS tracking restricted strictly to active working shifts. |
| **API Response Time** | P95 latency < 300ms for operational APIs under normal load. |

---

## 7. MVP Success Metrics & KPIs

1. **Collection Coverage Rate:** > 90% of scheduled stops marked with verified outcome.
2. **Digital Payment Adoption:** > 40% of municipal collection fees settled digitally via eSewa/Khalti within 6 months of rollout.
3. **Complaint Redressal SLA:** Median resolution time for missed-pickup tickets under 24 hours.
4. **Driver/Crew Route Compliance:** > 85% of assigned routes executed within the scheduled operational window.
