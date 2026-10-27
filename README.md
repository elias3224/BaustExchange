# 🎓 BAUST Exchange

<div align="center">

![BAUST Exchange Banner](public/images/baust-building.png)

**The Dedicated Peer-to-Peer Campus Marketplace for Bangladesh Army University of Science and Technology (BAUST)**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5_Beta-purple?style=flat-square&logo=auth0)](https://authjs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-00758F?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

[🌐 Live Production Website](https://baust-exchange.vercel.app) • [📖 Documentation](#table-of-contents) • [🚀 Quick Start](#getting-started)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Marketplace Categories](#-marketplace-categories)
- [Security & Verification](#-security--verification)
- [Payment Gateways (PRO & Pinning)](#-payment-gateways-pro--pinning)
- [Getting Started](#-getting-started)
  - [Prerequisites](#1-prerequisites)
  - [Installation](#2-installation)
  - [Environment Variables](#3-environment-configuration)
  - [Database Setup](#4-database-migration--seed)
  - [Running the App](#5-running-locally)
- [Production Deployment](#-production-deployment)
- [Admin Moderation](#-admin-moderation)
- [Project Structure](#-project-structure)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

**BAUST Exchange** is a modern, student-centric web platform engineered to eliminate the chaos and scam risks of buying and selling in unorganized social media groups. Designed exclusively for the **BAUST (Bangladesh Army University of Science and Technology, Saidpur)** student body and faculty, it provides an authenticated, structured, and scam-free campus ecosystem to trade academic resources, room essentials, and electronics.

---

## ✨ Key Features

### 🛒 Campus Marketplace & Listings
- **Multi-Type Transactions**: Post items to **Sell**, **Exchange**, **Give Away (Free/Donation)**, or **Sell-or-Exchange**.
- **Rich Media**: High-speed image upload support (up to 6 photos per item) powered by Vercel Blob with local disk fallback.
- **Granular Filtering**: Filter by BAUST Academic Department (`CSE`, `EEE`, `ME`, `Civil`, `IPE`, `BBA`, `English`, `Sciences`), Category, Item Condition (`New`, `Like New`, `Good`, `Used`, `Damaged`), Price Range, and Transaction Type.
- **Listing Lifecycle**: Real-time status toggling: `Active` ➔ `Sold` / `Exchanged` / `Given Away` / `Removed`.

### 🔄 Structured Exchange Request System
- **Formal Trade Offers**: Students can send structured purchase or barter proposals with a custom message and an optional trade item.
- **Dual Confirmation Workflow**: Item owners can `Accept`, `Reject`, `Cancel`, or mark transactions as `Completed`.
- **Automatic Inventory Updates**: Completing an exchange automatically updates the item's listing state and notifies both parties.

### 🔍 Wanted Requests Board
- **Campus ISO (In Search Of)**: Students looking for rare semester textbooks, lab kits, or drawing tools can post a Wanted Request.
- **Automated Matchmaking**: An in-memory keyword matching engine triggers instant `MATCH` notifications to buyers whenever a matching listing is posted.

### 💬 Direct Peer Messaging & Notifications
- **Private In-App Chat**: 1-to-1 secure chat threads linked directly to listing contexts to negotiate prices and coordinate on-campus handoffs (e.g., Cafeteria, Library, Admin Lobby).
- **Notification Center**: Real-time in-app alerts and optional transactional emails via SMTP for incoming requests, status updates, and new messages.

### 🛡️ Campus Trust & Verification
- **Google OAuth 2.0 Only**: Strict single sign-on authentication; zero plain passwords stored.
- **AI-Powered ID Card OCR Verification**: Server-side OCR engine using `Tesseract.js` + `Sharp` to detect BAUST credentials and grant verified campus badges.
- **Role Separation**: Tailored workflows for `Student`, `Teacher`, and `Admin` users.

### 👑 Premium Features & Monetization
- **PRO Membership (৳49/month)**: Access to unlimited listings, verified seller priority, and badge perks.
- **Featured Listing Pinning (৳20/week)**: Pin listings to the top of category feeds for maximum visibility.
- **Dual Payment Channels**: Instant automated payment via **SSLCommerz Gateway** (bKash, Nagad, Rocket, Cards) or manual bKash/Nagad TrxID review.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier"]
        Browser["Next.js Responsive Web App\n(React 19 + Tailwind CSS)"]
    end

    subgraph Security["Security & Auth Middleware"]
        AuthMiddleware["JWT Route Guard\n(src/middleware.ts)"]
        GoogleAuth["Google OAuth 2.0\n(Auth.js v5)"]
        RateLimiter["IP Rate Limiter\n(Token Bucket)"]
    end

    subgraph AppServer["Application Tier (Next.js 15)"]
        PageRouter["App Router\nServer & Client Components"]
        APIHandlers["REST API Route Handlers\n(/api/*)"]
        OCRService["ID Card OCR Engine\n(Tesseract.js + Sharp)"]
        PaymentService["SSLCommerz & Manual\nPayment Processor"]
    end

    subgraph DataTier["Data & Storage Tier"]
        PrismaORM["Prisma ORM 6"]
        Database[("MySQL 8+ / TiDB Serverless\nRelational Database")]
        BlobStorage["Vercel Blob / Local Storage\n(Item & ID Card Images)"]
    end

    Browser --> AuthMiddleware
    AuthMiddleware --> GoogleAuth
    AuthMiddleware --> RateLimiter
    RateLimiter --> PageRouter
    PageRouter --> APIHandlers
    APIHandlers --> OCRService
    APIHandlers --> PaymentService
    APIHandlers --> PrismaORM
    APIHandlers --> BlobStorage
    PrismaORM --> Database
```

---

## 💻 Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15.5](https://nextjs.org/) (App Router) | Full-stack React framework with SSR and Server Actions |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) | Strict end-to-end type safety |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Dark Navy & Teal/Emerald campus design system |
| **Database** | [MySQL 8+](https://www.mysql.com/) / [TiDB Cloud](https://tidbcloud.com/) | Relational database with full transaction support |
| **ORM** | [Prisma 6.19](https://www.prisma.io/) | Type-safe schema definition, migrations, and queries |
| **Authentication** | [Auth.js (NextAuth v5)](https://authjs.dev/) | Session management and Google OAuth 2.0 |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) & [Tesseract.js](https://tesseract.projectnaptha.com/) | ID card preprocessing, contrast enhancement, and OCR |
| **Payments** | [SSLCommerz](https://www.sslcommerz.com/) & bKash/Nagad | Automated digital checkout + manual TrxID verification |
| **Storage** | [@vercel/blob](https://vercel.com/docs/storage/vercel-blob) | Serverless cloud file storage with local filesystem fallback |
| **Icons & UI** | [Lucide React](https://lucide.dev/) | Consistent, clean icon library |

---

## 📦 Marketplace Categories

BAUST Exchange organizes listings into 8 distinct academic and campus living categories:

1. 📚 **Books & Notes**: Textbooks, course slide prints, lecture notes, lab manuals (CSE, EEE, ME, Civil, IPE).
2. 💻 **Electronics**: Scientific calculators, laptops, chargers, Arduino/Raspberry Pi boards, monitors.
3. 🛋️ **Furniture**: Study desks, chairs, bed frames, book racks, study lamps.
4. 👕 **Clothing**: Department lab coats, university hoodies, sports jerseys.
5. ✒️ **Stationery**: Drawing boards, mini-drafters, geometry sets, architectural pens.
6. 🎓 **Academic Materials**: Engineering instruments, survey equipment, breadboards, IC kits.
7. 🏸 **Sports & Fitness**: Badminton rackets, cricket bats, footballs, gym gear.
8. 🚲 **Others**: Bicycles, musical instruments, daily hostel essentials.

---

## 🔒 Security & Verification

- **Identity Access Control**: Role-based access control (`student`, `teacher`, `admin`) enforced strictly on the server (`src/lib/authz.ts`).
- **Student ID Card OCR**: 
  1. Student uploads their physical BAUST ID card.
  2. The server runs OCR analysis scanning for BAUST university header keywords and department/student tokens.
  3. Image and OCR confidence score are placed in the admin review queue (`/admin`).
  4. Once approved, the user gains a **Verified BAUST Community Badge**.
- **Defense-in-Depth**:
  - Request rate-limiting to prevent API spam and brute-forcing.
  - Zod validation on every POST/PATCH request body.
  - Blocked users are immediately rejected across all server endpoints.

---

## 💳 Payment Gateways (PRO & Pinning)

### 1. Instant SSLCommerz Gateway (Automated)
- Initiated at `POST /api/payments/sslcommerz/init`.
- Redirects to SSLCommerz hosted checkout supporting **bKash, Nagad, Rocket, Visa, Mastercard, and Internet Banking**.
- Server validates transactions via `POST /api/payments/sslcommerz/callback` and background IPN (`/api/payments/sslcommerz/ipn`).
- On successful validation, PRO status or item pinning is activated instantly.

### 2. Manual Mobile Money Fallback (Admin-Verified)
- Students send the fee to the official campus bKash/Nagad number (`01703125674`).
- Student submits their sender number and **Transaction ID (TrxID)**.
- Administrators review and approve/reject payments from the Admin Panel.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or later
- **npm** or **pnpm**
- **MySQL Database**: Local MySQL 8.0+ or cloud instance ([TiDB Cloud Serverless](https://tidbcloud.com) / [Aiven](https://aiven.io))

### 2. Installation

```bash
git clone https://github.com/eliascsebaust19/BaustExchange1.git
cd BaustExchange1
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Populate the required configuration variables:

```env
# Database (MySQL 8+ connection string)
DATABASE_URL="mysql://root:password@127.0.0.1:3306/baust_exchange"

# Authentication (NextAuth / Auth.js v5)
AUTH_SECRET="your-generated-secret-here" # Generate via: npx auth secret
AUTH_TRUST_HOST="true"

# Google Cloud OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Uploads & Storage (Optional: required for cloud storage)
BLOB_READ_WRITE_TOKEN=""

# Listing Moderation (true = instant live; false = admin approval required)
LISTING_AUTO_APPROVE="true"

# Initial Admin Promotion (comma-separated emails)
SEED_ADMIN_EMAILS="admin@baust.edu.bd"

# SSLCommerz Payment Gateway (Optional / Sandbox)
SSLCOMMERZ_STORE_ID="your-store-id"
SSLCOMMERZ_STORE_PASSWORD="your-store-password"
SSLCOMMERZ_IS_LIVE="false"

# Transactional Email (Optional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="BAUST Exchange <noreply@baustexchange.com>"
```

### 4. Database Migration & Seed

Run Prisma to push the schema and seed default marketplace categories:

```bash
# Push schema to MySQL database
npm run db:push

# Seed default categories and initial admins
npm run db:seed
```

### 5. Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Production Deployment

### Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Connect a hosted MySQL instance:
   - **Recommended**: [TiDB Cloud Serverless](https://tidbcloud.com) (MySQL compatible, free tier).
   - Set connection pool parameters: `?sslaccept=strict&connection_limit=5`.
4. Configure all environment variables in Vercel settings (especially `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AUTH_TRUST_HOST="true"`).
5. Add your production domain callback to Google Cloud Console:
   ```
   https://YOUR-APP.vercel.app/api/auth/callback/google
   ```
6. Deploy! Prisma client generation runs automatically during `postinstall` / `build`.

---

## 🛡️ Admin Moderation

To promote an initial user to Administrator:

```bash
npm run make-admin -- your-email@gmail.com
```

Once promoted, log in and visit `/admin` to access:
- **Listing Oversight**: Approve pending listings, pin featured items, or remove guideline violations.
- **ID Card Queue**: Review uploaded student ID cards, inspect OCR notes, and grant verified seller status.
- **Payment Verification**: Verify manual bKash/Nagad TrxIDs and activate subscriptions.
- **User Management**: Block abusive accounts or adjust roles.
- **Audit Trails**: Full system activity logs with timestamps and IP addresses.

---

## 📁 Project Structure

```
BaustExchange1/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Listing, ExchangeRequest, etc.)
│   └── seed.ts                # Initial category and admin seeder
├── public/
│   ├── images/                # Campus photos, logo assets, UI graphics
│   └── uploads/               # Local image upload directory
├── scripts/
│   ├── make-admin.ts          # CLI admin promotion utility
│   └── test-idcard-ocr.ts     # OCR verification testing script
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated route group
│   │   │   ├── admin/         # Admin moderation dashboard
│   │   │   ├── dashboard/     # User dashboard & metrics
│   │   │   ├── marketplace/   # Main marketplace browser & search
│   │   │   ├── item/[id]/     # Listing detail view & exchange actions
│   │   │   ├── post-item/     # Multi-step item creation form
│   │   │   ├── wanted/        # Wanted board & requests
│   │   │   ├── messages/      # 1-to-1 direct messaging system
│   │   │   ├── notifications/ # Notification center
│   │   │   └── profile/       # User profile & ID card upload
│   │   ├── api/               # Next.js Server REST Route Handlers
│   │   │   ├── admin/         # Admin management endpoints
│   │   │   ├── listings/      # Listing CRUD & image upload
│   │   │   ├── exchange-requests/ # Request lifecycle endpoints
│   │   │   ├── payments/      # SSLCommerz & manual payment hooks
│   │   │   └── profile/verify-id/ # Server-side OCR validation
│   │   ├── login/             # Clean Google authentication page
│   │   ├── layout.tsx         # Root application layout
│   │   └── page.tsx           # Production-ready compact landing page
│   ├── components/            # Reusable React components (UI, Admin, Forms)
│   └── lib/                   # Utility libraries
│       ├── auth.ts            # Auth.js / NextAuth options
│       ├── authz.ts           # Server-side authorization helpers
│       ├── idCardVerify.ts    # OCR verification logic
│       ├── prisma.ts          # Prisma client singleton
│       └── ratelimit.ts       # In-memory IP rate limiter
├── tailwind.config.ts         # Tailwind CSS styling tokens
└── tsconfig.json              # TypeScript compiler configuration
```

---

## 📜 Contributing & License

Contributions, bug reports, and suggestions are welcome! Feel free to open an issue or submit a pull request.

This project is licensed under the **MIT License**.

> *Disclaimer: BAUST Exchange is an independent university community project created by students for the students and faculty of BAUST. It is not an officially managed military/university service.*
