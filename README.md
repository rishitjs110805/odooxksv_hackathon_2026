# VendorBridge — Procurement ERP

A full-stack procurement management system built with **React + Vite** (frontend) and **FastAPI + PostgreSQL** (backend). Supports four roles: Admin, Manager, Procurement Officer, and Vendor.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Lucide Icons |
| Backend | FastAPI, Python 3.11+, Uvicorn |
| Database | PostgreSQL, asyncpg |
| Auth | JWT (HS256), bcrypt |

---

## Quick Start

### Prerequisites
- Node.js v18+
- Python 3.11+
- PostgreSQL running on port 5432

### 1. Clone

```bash
git clone https://github.com/rishitjs110805/odooxksv_hackathon_2026.git
cd odooxksv_hackathon_2026
```

### 2. Configure Environment

Edit `server/.env`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=vendorbridge
JWT_SECRET=your_jwt_secret
```

### 3. Backend

```bash
cd server
pip install -r requirements.txt
python seed.py          # run once — creates demo data
python -m uvicorn main:app --reload --port 3000
```

API available at **http://localhost:3000** · Swagger docs at **http://localhost:3000/docs**

### 4. Frontend

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Demo Accounts

All passwords: `password123`

| Email | Role | Access |
|---|---|---|
| `admin@vendorbridge.com` | Admin | Full system, user management |
| `savya@vendorbridge.com` | Manager | Approvals, RFQs, PO tracking |
| `priya@vendorbridge.com` | Procurement Officer | RFQs, quotations, vendors, invoices |
| `vendor1@supplytec.com` | Vendor | Assigned RFQs, submit quotations |
| `vendor2@officemax.com` | Vendor | Assigned RFQs, submit quotations |
| `vendor3@furnish.com` | Vendor | Assigned RFQs, submit quotations |

---

## Features by Role

### Procurement Officer
- Create RFQs with line items, deadline, vendor assignment
- Compare quotations side-by-side (price, delivery, rating)
- Initiate approval workflow for selected quotation
- Auto-generate purchase orders from approved quotations
- Manage vendor profiles, view invoices

### Manager / Approver
- Approval queue with multi-step workflow visualization
- Approve or reject quotations with remarks
- Generate PO after approval
- View reports, RFQs, POs, invoices

### Admin
- Full user management (CRUD, role assignment)
- Full vendor management
- System-wide analytics: spend by category, monthly trends, approval rates
- View all activity logs

### Vendor
- View assigned RFQs
- Submit quotations with line-item pricing and delivery terms
- Track own purchase orders and invoices
- Role-specific dashboard (no system-wide data exposed)

---

## Key Workflows

### RFQ → PO Flow
1. **Procurement Officer** creates RFQ → assigns vendors
2. **Vendor** submits quotation via portal
3. **Procurement Officer** compares quotations → initiates approval
4. **Manager** approves or rejects with remarks
5. **Procurement Officer** generates PO from approved quotation
6. **Invoice** auto-generated from PO

### Password Reset
Forgot password link is available on the login screen. In development, the reset link is returned directly in the API response (no email required).

---

## API Endpoints (Summary)

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Register user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Current user profile |
| POST | `/auth/forgot-password` | Request reset link |
| POST | `/auth/reset-password` | Set new password |
| GET/POST | `/rfqs` | List / create RFQs |
| GET/PATCH | `/rfqs/{id}` | Detail / status update |
| GET/POST | `/vendors` | List / create vendors |
| GET | `/vendors/me` | Vendor's own profile |
| PUT/DELETE | `/vendors/{id}` | Update / delete vendor |
| POST | `/quotations` | Submit quotation |
| GET | `/quotations/compare/{rfq_id}` | Side-by-side comparison |
| POST | `/approvals` | Initiate approval |
| GET | `/approvals` | List approvals (role-filtered) |
| PATCH | `/approvals/{id}/action` | Approve / reject |
| GET/POST | `/purchase-orders` | List / create POs |
| GET/POST | `/invoices` | List / create invoices |
| GET | `/dashboard` | Role-specific stats |
| GET | `/reports/spending` | Spend summary & trends |
| GET | `/activity` | Audit logs |
| GET | `/users` | All users (admin only) |
| GET | `/notifications` | Role-filtered notifications |

---

## Database Schema

```
users           — id, email, password_hash, name, role, is_active, created_at
vendors         — id, name, email, phone, gst_number, category, status, user_id, photo_url, address, city, state, pincode
rfqs            — id, title, description, category, deadline, status, created_by, created_at
rfq_items       — id, rfq_id, product_name, quantity, unit
rfq_vendors     — rfq_id, vendor_id
quotations      — id, rfq_id, vendor_id, total_amount, delivery_days, notes, status, created_at
quotation_items — id, quotation_id, rfq_item_id, unit_price, total_price
approvals       — id, quotation_id, approver_id, status, remarks, created_at, updated_at
purchase_orders — id, quotation_id, vendor_id, po_number, status, delivery_date, created_by, created_at
invoices        — id, po_id, invoice_number, tax_rate, subtotal, tax_amount, total, status, created_at
invoice_items   — id, invoice_id, description, quantity, unit_price, total_price
activity_logs   — id, user_id, action, entity_type, entity_id, details, created_at
notifications   — id, user_id, title, message, type, priority, is_read, created_at
password_reset_tokens — id, user_id, token, expires_at, used
```

---

## Project Structure

```
odooxksv_hackathon_2026/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx              # Root app, auth, routing, theme
│   │   ├── index.css            # Tailwind v4 + dark variant
│   │   ├── services/api.js      # All API calls
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar navigation
│   │   │   └── ui.jsx           # Shared components (Btn, Modal, Input, etc.)
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── Dashboard.jsx
│   │       ├── RFQs.jsx
│   │       ├── Quotations.jsx
│   │       ├── Approvals.jsx
│   │       ├── PurchaseOrders.jsx
│   │       ├── Invoices.jsx
│   │       ├── Vendors.jsx
│   │       ├── Users.jsx
│   │       ├── Reports.jsx
│   │       ├── ActivityLogs.jsx
│   │       ├── Notifications.jsx
│   │       └── Profile.jsx
│   └── package.json
└── server/                      # FastAPI backend
    ├── main.py                  # App entry point, CORS, router registration
    ├── seed.py                  # Demo data seeder
    ├── requirements.txt
    ├── .env                     # DB credentials, JWT secret
    └── src/
        ├── db/schema.py         # Auto-run migrations on startup
        ├── middleware/auth.py   # JWT decode, role helpers
        └── routes/
            ├── auth.py
            ├── rfqs.py
            ├── quotations.py
            ├── approvals.py
            ├── purchase_orders.py
            ├── invoices.py
            ├── vendors.py
            ├── users.py
            ├── dashboard.py
            ├── reports.py
            ├── activity.py
            └── notifications.py
```

---

## Re-seeding

To wipe and reset all demo data:

```bash
cd server
python seed.py
```
