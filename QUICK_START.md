# Quick Start Guide - VendorBridge Procurement System

## 🚀 Getting Started

### Prerequisites
- Node.js & npm (for frontend)
- Python 3.8+ (for backend)
- PostgreSQL 12+ (for database)

### Quick Setup

#### 1. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Frontend will be available at: **http://localhost:5173**

#### 2. Backend Setup
```bash
cd server
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
Backend API available at: **http://localhost:8000**
API Docs (Swagger): **http://localhost:8000/docs**

#### 3. Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE vendorbridge;"

# Create tables (auto-runs on app start)
python -c "
from src.db import schema
print('Schema:', schema.SCHEMA_SQL[:100])
"
```

---

## 👤 Test Accounts & Roles

### Procurement Officer
```
Username: Manav Panchal
Role: Procurement Officer
Features: Create RFQs, Compare Quotations, Generate POs
```

### Manager / Approver
```
Username: Amit Kumar
Role: Manager / Approver
Features: Review Approvals, Monitor Workflows, Track POs
```

### Admin
```
Username: Priya Sharma
Role: Admin
Features: Manage Users, Manage Vendors, View Analytics
```

### Vendor
```
Username: Neha Singh
Role: Vendor
Features: Submit Quotations, View RFQs, Track Orders
```

---

## 📋 Key Workflows

### Workflow 1: Create & Approve RFQ

**Step 1: Login as Procurement Officer**
- Go to http://localhost:5173
- Select "Procurement Officer"
- Click "Login as Procurement Officer"

**Step 2: Create RFQ**
- Click "Dashboard" → "New RFQ" button
- Navigate to "RFQs" section
- Click "Create RFQ"
- Fill in:
  - Title: "Office Supplies Procurement"
  - Description: "Q1 office supplies"
  - Deadline: Select date
- Click "Create RFQ"

**Step 3: View Dashboard Metrics**
- Dashboard updates with new RFQ count
- See "Active RFQs: 4"

**Step 4: Compare Quotations**
- Go to "Quotations" section
- Select RFQ from dropdown
- View all vendor quotations in comparison table
- System highlights "Best Match" based on:
  - Price (35% weight)
  - Quality (40% weight)
  - Delivery Time (25% weight)

**Step 5: Approval Process**
- Login as "Manager / Approver"
- Go to "Approvals" section
- Review pending approval
- Click "Approve" or "Reject"
- Add remarks if rejecting
- See status update

---

### Workflow 2: Vendor Management

**Add a Vendor:**
- Login as Procurement Officer or Admin
- Go to "Vendors" section
- Click "Add Vendor"
- Fill in:
  - Vendor Name
  - Category (Hardware, Furniture, etc.)
  - Email
  - Phone
- Click "Add Vendor"

**View Vendor Details:**
- Click on any vendor in the table
- See:
  - Performance rating
  - On-time delivery %
  - Total orders
  - Contact information
  - GST number

---

### Workflow 3: User Management (Admin Only)

**View All Users:**
- Login as "Admin" (Priya Sharma)
- Go to "Users" section
- See all system users with:
  - Name
  - Email
  - Role badge
  - Status
  - Join date

**Search Users:**
- Use search box to filter by name or email

---

### Workflow 4: View Analytics (Admin Only)

**Access Reports:**
- Login as Admin
- Go to "Analytics" section
- View:
  - Total spend metrics
  - Approval rate percentage
  - Active vendors count
  - Spend breakdown by category
  - Monthly trends

---

## 🎯 Key Features Tour

### Dashboard
- **Role-Specific Metrics**: Different for each role
- **Quick Actions**: One-click access to key features
- **Status Overview**: Current procurement status

### RFQ Management
- Create RFQs with multiple line items
- Auto-assign RFQ IDs
- Track status changes
- Assign to specific vendors
- View RFQ history

### Quotation Comparison
- View all quotations for an RFQ
- Sort by price, delivery, quality
- Color-coded quality scores
- Highlight best vendor
- Quick decision making

### Approval Workflow
- Multi-step approval process
- Visual workflow indicator
- Approval/Rejection with remarks
- Status tracking
- Audit trail

### Purchase Orders
- Auto-generate from approved quotations
- Unique PO numbering
- Delivery tracking
- Invoice generation
- Payment status

### Vendor Management
- Complete vendor database
- Performance metrics
- Contact management
- Category-based filtering
- Search functionality

### User Management (Admin)
- User role assignment
- Active/Inactive status
- User search and filtering
- Join date tracking

### Analytics Dashboard
- Procurement spend analysis
- Approval rate metrics
- Category-wise breakdown
- Vendor performance
- Monthly trends

---

## 🔐 Security & Access Control

### Role-Based Navigation
Each user sees only relevant menu items:

**Procurement Officer Menu:**
- Dashboard
- RFQs
- Quotations
- Purchase Orders
- Vendors
- Activity

**Manager Menu:**
- Dashboard
- Approvals
- Purchase Orders
- Reports
- Activity

**Admin Menu:**
- Dashboard
- Users
- Vendors
- Analytics
- Activity

---

## 📊 Data & Mock Information

### Sample Vendors
- Infra Supplies Pvt Ltd (Hardware)
- Office Furnishings Co (Furniture)
- DigiParts Industries (Electronics)
- GreenSource Materials (Stationery)

### Sample RFQs
- Office Furniture Procurement Q1
- IT Infrastructure Upgrade
- Stationery Supply FY26
- Laptop Fleet Procurement

### Sample Quotations
Multiple quotations per RFQ with varying:
- Unit prices
- Delivery timelines
- Quality scores
- Warranty terms

---

## 💡 Tips & Best Practices

1. **Always compare quotations** before approving
2. **Add remarks** when rejecting requests
3. **Regular vendor audits** for better performance
4. **Monitor spending** through analytics
5. **Review activity logs** for audit trail
6. **Keep vendor info updated** for accuracy

---

## ⚠️ Common Issues

### Issue: Frontend not loading
**Solution:**
```bash
cd client
npm install
npm run dev
```

### Issue: Backend API error
**Solution:**
```bash
cd server
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Issue: Database connection error
**Solution:**
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Create database if missing
psql -U postgres -c "CREATE DATABASE vendorbridge;"
```

---

## 📞 Support & Troubleshooting

### Reset All Data
```bash
# Clear mock data and restart
rm -rf client/node_modules
npm install
```

### View Backend Logs
```
Check console output for FastAPI server
```

### Check API Health
```bash
curl http://localhost:8000/health
```

---

## 🎓 Learning Resources

- Workflow diagrams in IMPLEMENTATION_GUIDE.md
- API documentation at `/docs`
- Database schema in `/server/src/db/schema.py`
- Component structure in `/client/src/App.jsx`

---

## ✅ Verification Checklist

- [ ] Frontend loads at localhost:5173
- [ ] Can login with different roles
- [ ] Dashboard shows role-specific content
- [ ] Can create RFQs
- [ ] Can compare quotations
- [ ] Can approve/reject requests
- [ ] Can manage vendors
- [ ] Can view analytics (admin)
- [ ] Can view activity logs
- [ ] Notifications working (toasts)
- [ ] Sidebar navigation updates per role
- [ ] Search and filters working
- [ ] Status badges color-coded correctly

---

**Last Updated**: June 2026
**System Version**: 1.0.0
**Status**: Ready for Production Use
