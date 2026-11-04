# WasteWise UI/UX Design System & Strict Component Standardization Guide

> **Target Standard**: Production Enterprise SaaS (Client-Alluring, Accessible, 100% Consistent)  
> **Font Stack**: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`  
> **Base Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS + shadcn/ui (Radix Primitives)

---

## 1. Golden Rules of Visual Consistency

1. **Zero Ad-Hoc Variations**:
   - Every interactive primitive (Button, Input, Badge, Dialog, Select, Card) must originate strictly from `@/shared/components/ui/`.
   - Never write inline background overrides (e.g., `style={{ backgroundColor: 'green' }}`) or random paddings (`p-[13px]`).
2. **Fixed Height & Touch Target Hierarchy**:
   - **Default Desktop Height**: `40px` (`h-10`) across all inputs, buttons, and selects.
   - **Mobile Touch Target**: Minimum `44px` to `48px` (`h-11` or `h-12`) on screens `< 640px`.
3. **Typography Uniformity**:
   - Font family across the entire platform is locked to **Segoe UI / Tahoma**.
   - Input text and button labels are permanently locked to **`15px` (`text-base` / `font-medium`)** on Mobile and **`15px–16px`** on Desktop. No shrinking button text.

---

## 2. Standardized Component Tokens & Specifications

### 2.1 Buttons (`Button`)

All buttons must strictly follow this exact sizing and color matrix:

| Variant | Purpose | Tailwind Class Specification |
| :--- | :--- | :--- |
| **Primary (Brand)** | Main action (Submit, Register, Save) | `bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all active:scale-[0.98]` |
| **Secondary** | Secondary action (Filter, View Details) | `bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium transition-all` |
| **Outline** | Alternative choice (Cancel, Back) | `border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-all` |
| **Destructive** | Dangerous action (Deactivate, Delete) | `bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-all` |
| **Ghost** | Table row actions, icon buttons | `hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all` |

#### Button Sizes (Global Standard):
- **Default (Standard)**: `h-10 px-4 py-2 text-[15px] rounded-lg` (Used in 90% of forms/modals).
- **Mobile Large**: `h-12 px-6 py-3 text-[16px] rounded-lg w-full` (Full-width sticky submit on mobile).
- **Small (Table/Toolbar)**: `h-8 px-3 text-[13px] rounded-md` (Inside data tables and filter bars).
- **Icon Only**: `h-10 w-10 p-2 rounded-lg flex items-center justify-center`.

---

### 2.2 Text Inputs & Dropdowns (`Input` & `Select`)

To ensure visual alignment, **Input fields, Dropdown Selects, and Primary Buttons have identical heights and borders**:

| Property | Standard Specification |
| :--- | :--- |
| **Height** | `h-10` (40px) on Desktop / `h-11` (44px) on Mobile |
| **Border & Radius** | `border border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20` |
| **Font & Text** | `text-[15px] font-normal text-slate-900 placeholder:text-slate-400` |
| **Background** | `bg-white` (never greyish or transparent) |
| **Error State** | `border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-slate-900` |

---

### 2.3 Status Badges (`Badge`)

Never design custom pill tags. Use these standard semantic badges with fixed padding:

| Status Token | Background | Text Color | Border | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **`ACTIVE` / `VERIFIED`** | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | Active Property, Completed Pickup |
| **`PENDING`** | `bg-amber-50` | `text-amber-700` | `border-amber-200` | Verification Pending, Scheduled |
| **`INACTIVE` / `SUSPENDED`**| `bg-rose-50` | `text-rose-700` | `border-rose-200` | Inactive Account, Rejected |
| **`INFO` / `ROLE`** | `bg-blue-50` | `text-blue-700` | `border-blue-200` | Citizen, Ward Officer Tag |

*Badge Dimensions*: `h-6 px-2.5 text-[12px] font-semibold tracking-wide uppercase rounded-full border inline-flex items-center`.

---

### 2.4 Cards (`Card`)

Dashboard summaries and premise items must look uniform:
- **Background**: `bg-white`
- **Border**: `border border-slate-200/80`
- **Corner Radius**: `rounded-xl` (12px)
- **Shadow**: `shadow-sm hover:shadow-md transition-shadow`
- **Inner Padding**:
  - Mobile: `p-4` (16px)
  - Tablet/Laptop: `p-6` (24px)

---

## 3. Responsive Screen Adaptability Rules

### 3.1 Mobile (< 640px)
- Single column layout (`flex-col` or `grid-cols-1`).
- Primary actions fixed to full width (`w-full`).
- Form elements maintain `min-h-[44px]` touch target.
- Modals adapt into **Bottom Drawers (Sheets)** sliding up from bottom.

### 3.2 Tablet (640px – 1024px)
- 2-Column grids (`grid-cols-1 sm:grid-cols-2 gap-4`).
- Side-by-side forms where logical (e.g. Ward Select + Zone Select).
- Tables retain horizontal scrolling with sticky first column.

### 3.3 Laptop / Desktop (> 1024px)
- 3 or 4-Column summary cards (`grid-cols-1 md:grid-cols-3 lg:grid-cols-4`).
- Centered modals capped at `max-w-xl` or `max-w-2xl`.
- Persistent sidebar layout with sticky top header.

---

## 4. React 19 Engineering Conventions

- **State Transitions**: Wrap tab and modal switches in `startTransition` from `useTransition()` to prevent UI stutter.
- **Optimistic Actions**: When adding a property or updating a status, render the change immediately using `useOptimistic()`.
- **Form Actions**: Integrate React 19 `useActionState` with Zod validation.

