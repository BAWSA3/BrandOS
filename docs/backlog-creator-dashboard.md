# Backlog: Creator Dashboard

## Status: BACKLOGGED
Not building now. Documented for future sprint.

---

## Overview

A centralized dashboard for creators to manage the **business side** of their brand — income tracking, brand kit storage, and invoice management. The core philosophy: make the money visible and motivating, make assets accessible, and make tax season painless.

---

## 1. Income Tracker

### Core UX
- **Big, centered income number** — the hero of the dashboard. When a creator opens it, the first thing they see is their total income, large and prominent
- The number should feel alive — subtle animation on load, color shifts (green when trending up)
- Think: a scoreboard for your creator business

### Features
- Track income by source: brand deals, sponsorships, affiliate, digital products, services, etc.
- Add income entries manually (amount, source, date, notes)
- Monthly / quarterly / yearly views
- Income trend chart (simple line graph showing trajectory)
- Goal setting: "I want to hit $X by [date]" with progress indicator

### Data Model (draft)
```typescript
interface IncomeEntry {
  id: string;
  amount: number;
  source: string;        // e.g., "Brand Deal", "Affiliate", "Consulting"
  client?: string;       // e.g., "Nike", "Notion"
  date: string;          // ISO date
  notes?: string;
  category: IncomeCategory;
  invoiceId?: string;    // Link to invoice if applicable
}

type IncomeCategory = 'brand-deal' | 'sponsorship' | 'affiliate' | 'digital-product' | 'service' | 'other';

interface IncomeGoal {
  targetAmount: number;
  targetDate: string;
  label?: string;
}
```

---

## 2. Brand Kit Storage

### Core UX
- Organized file/folder structure for all brand assets
- Easy drag-and-drop upload
- Quick preview for images, PDFs
- One-click copy/download for sharing with partners

### Structure
- **Folders**: Logos, Fonts, Colors, Templates, Guidelines, Media Kit, Photos, Videos
- User can create custom folders
- Each file has metadata: name, type, upload date, tags

### Features
- File upload with preview thumbnails
- Folder navigation (breadcrumb style)
- Search across all files
- Share link generation (for sending brand kit to partners/clients)
- Version history for key assets (e.g., logo v1, v2, v3)

### Data Model (draft)
```typescript
interface BrandKitFolder {
  id: string;
  name: string;
  parentId: string | null;  // null = root
  createdAt: string;
}

interface BrandKitFile {
  id: string;
  name: string;
  folderId: string;
  fileUrl: string;          // Storage URL
  thumbnailUrl?: string;
  fileType: string;         // MIME type
  fileSize: number;         // bytes
  tags: string[];
  uploadedAt: string;
  updatedAt: string;
}
```

---

## 3. Invoice Tracker

### Core UX
- All invoices in one place, organized and searchable
- Quick-add for new invoices (received or sent)
- Status tracking: pending, paid, overdue
- Tax season ready: filter by date range, export

### Features
- Upload invoice PDFs/images
- Manual entry: amount, client, date, status, category
- Filter by: date range, status, client, category
- Export as CSV for accountants / tax filing
- Running totals by quarter and year
- Link invoices to income entries
- Overdue alerts

### Data Model (draft)
```typescript
interface Invoice {
  id: string;
  type: 'sent' | 'received';   // Did you send it or receive it
  client: string;
  amount: number;
  date: string;                 // Invoice date
  dueDate?: string;
  paidDate?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  category: string;             // e.g., "Brand Deal", "Software", "Equipment"
  fileUrl?: string;             // Uploaded PDF/image
  notes?: string;
  taxDeductible: boolean;
}
```

---

## Key Files to Create
- `src/app/dashboard/page.tsx` — Main dashboard page with income hero
- `src/app/dashboard/brand-kit/page.tsx` — Brand kit file manager
- `src/app/dashboard/invoices/page.tsx` — Invoice tracker
- `src/components/dashboard/IncomeHero.tsx` — Big centered income display
- `src/components/dashboard/IncomeTrend.tsx` — Trend chart
- `src/components/dashboard/BrandKitExplorer.tsx` — File/folder browser
- `src/components/dashboard/InvoiceTable.tsx` — Invoice list with filters
- `src/lib/dashboard.types.ts` — All dashboard types
- Store additions in `src/lib/store.ts` — Income entries, brand kit, invoices (all persisted per brand)
- API routes for file upload (brand kit assets, invoice PDFs)

## Storage Considerations
- Brand kit files need cloud storage (S3/Cloudflare R2/Supabase Storage)
- Invoice PDFs same
- Income data and metadata can live in Zustand persist (localStorage) initially, then migrate to a DB

## Premium Consideration
- Free tier: limited storage (e.g., 100MB brand kit, 50 invoices)
- Pro tier: unlimited storage, export features, tax reports, income goals

---

## Design Notes
- Terminal/monospace aesthetic consistent with BrandOS
- Income number should use VCR OSD Mono at a large size
- Green accent for positive income trends, red for negative
- File explorer should feel native and fast, not clunky
