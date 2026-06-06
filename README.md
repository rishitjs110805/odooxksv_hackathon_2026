# VendorBridge — Procurement ERP

A full-stack procurement management system built with **React + Vite** (frontend) and **FastAPI + PostgreSQL** (backend).

## Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.11+)
- **PostgreSQL** (running locally on port 5432)

### 1. Clone & Setup

```bash
git clone https://github.com/rishitjs110805/odooxksv_hackathon_2026.git
cd odooxksv_hackathon_2026
```

### 2. Configure Environment

Edit `server/.env` with your PostgreSQL credentials:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=vendorbridge
JWT_SECRET=your_jwt_secret
```

### 3. Start Backend

```bash
cd server
pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload --port 3000
```

> **Important**: Run `python seed.py` before starting the server for the first time. This creates demo users, vendors, RFQs, quotations, approvals, purchase orders, and invoices.

### 4. Start Frontend

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Demo Accounts

All passwords: `password123`

| Email | Role | Capabilities |
|---|---|---|
| `admin@vendorbridge.com` | Admin | Full system access, user management |
| `savya@vendorbridge.com` | Manager | Approvals, RFQ management, PO tracking |
| `priya@vendorbridge.com` | Procurement Officer | RFQs, quotations, vendors, invoices |
| `vendor1@supplytec.com` | Vendor | View assigned RFQs, submit quotations |
| `vendor2@officemax.com` | Vendor | View assigned RFQs, submit quotations |
| `vendor3@furnish.com` | Vendor | View assigned RFQs, submit quotations |

---

## Re-Seeding the Database

To reset and re-seed manually:

```bash
cd server
python seed.py
```

This wipes all existing data and creates fresh demo data.

---

## Features

- **RFQ Management** — Create, assign vendors, track deadlines
- **Quotation Comparison** — AI-weighted scoring across price, delivery, vendor rating
- **Approval Workflow** — Multi-level approve/reject with remarks
- **Purchase Orders** — Auto-generate from approved quotations
- **Invoice Generation** — GST-compliant invoices with email delivery
- **Vendor Management** — Full CRUD with status tracking
- **Dashboard** — Real-time stats, recent POs, pending invoices
- **Notifications** — Role-based alerts for approvals, deadlines, quotations
- **Activity Logs** — Complete audit trail
- **Reports** — Vendor performance, spending summary, procurement stats
- **Role-Based Access** — Admin, Manager, Procurement Officer, Vendor

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| Backend | FastAPI, Python 3.11+, Uvicorn |
| Database | PostgreSQL, asyncpg |
| Auth | JWT (HS256), bcrypt |
| Email | SMTP (Gmail App Password) |
