"""
Seed the VendorBridge database with comprehensive demo data
so every page works out of the box.
"""
import asyncio
import bcrypt
from datetime import date, timedelta, datetime, timezone
from dotenv import load_dotenv
load_dotenv()
from src.db import get_pool


async def main():
    pool = await get_pool()
    async with pool.acquire() as conn:
        # ── Clean slate (order matters due to FK constraints) ──
        await conn.execute("DELETE FROM activity_logs")
        await conn.execute("DELETE FROM invoices")
        await conn.execute("DELETE FROM purchase_orders")
        await conn.execute("DELETE FROM approvals")
        await conn.execute("DELETE FROM quotation_items")
        await conn.execute("DELETE FROM quotations")
        await conn.execute("DELETE FROM rfq_vendors")
        await conn.execute("DELETE FROM rfq_items")
        await conn.execute("DELETE FROM rfqs")
        await conn.execute("DELETE FROM vendors")
        await conn.execute("DELETE FROM password_reset_tokens")
        await conn.execute("DELETE FROM users")

        # Reset sequences
        for seq in ['users_id_seq', 'vendors_id_seq', 'rfqs_id_seq', 'rfq_items_id_seq',
                     'quotations_id_seq', 'quotation_items_id_seq', 'approvals_id_seq',
                     'purchase_orders_id_seq', 'invoices_id_seq', 'activity_logs_id_seq']:
            await conn.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1")

        pw = bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode()

        # ── USERS ──
        users = [
            ("admin@vendorbridge.com", pw, "Admin User", "admin"),
            ("savya@vendorbridge.com", pw, "Savya Modi", "manager"),
            ("priya@vendorbridge.com", pw, "Priya Sharma", "procurement_officer"),
            ("vendor1@supplytec.com", pw, "Raj Electronics", "vendor"),
            ("vendor2@officemax.com", pw, "Anita Office Supplies", "vendor"),
            ("vendor3@furnish.com", pw, "Karan Furniture", "vendor"),
        ]
        for email, phash, name, role in users:
            await conn.execute(
                "INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4)",
                email, phash, name, role
            )
        print("✓ 6 users created")

        # ── VENDORS ──
        vendors_data = [
            ("Raj Electronics", "vendor1@supplytec.com", "9876543210", "29AABCU9603R1ZM", "Electronics", "active",
             "Shop 45, SP Road", "Bangalore", "Karnataka", "560002", 4),
            ("Anita Office Supplies", "vendor2@officemax.com", "9988776655", "07AAACS8765R1Z0", "Office Supplies", "active",
             "B-12 Industrial Area", "Delhi", "Delhi", "110020", 5),
            ("Karan Furniture Co.", "vendor3@furnish.com", "9123456789", "24AAACF1234R1ZP", "Furniture", "active",
             "Plot 8, MIDC", "Mumbai", "Maharashtra", "400093", 6),
            ("Quick Print Services", "print@quickprint.com", "9871234560", "27BBBCQ5678R1ZQ", "Printing", "active",
             "14 MG Road", "Pune", "Maharashtra", "411001", None),
            ("TechWorld Solutions", "info@techworld.com", "9845671234", "29CCCDT9012R1ZR", "IT Equipment", "active",
             "Tower B, IT Park", "Hyderabad", "Telangana", "500081", None),
        ]
        for v in vendors_data:
            await conn.execute(
                """INSERT INTO vendors (name, email, phone, gst_number, category, status, address, city, state, pincode, user_id)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
                *v
            )
        print("✓ 5 vendors created")

        # ── RFQs ──
        today = date.today()
        rfqs_data = [
            ("Office Laptops - Q3 2026", "Require 50 business laptops with minimum i7 processor, 16GB RAM, 512GB SSD",
             "Electronics", today + timedelta(days=14), "open", 3),
            ("Office Furniture Set", "Complete office furniture for new wing - 20 desks, 20 chairs, 5 conference tables",
             "Furniture", today + timedelta(days=21), "open", 3),
            ("Printer Paper & Stationery", "Quarterly stationery order - A4 paper, pens, files, binders",
             "Office Supplies", today + timedelta(days=7), "open", 3),
            ("Server Room Equipment", "UPS systems, cable management, network switches for server room upgrade",
             "IT Equipment", today - timedelta(days=10), "closed", 3),
        ]
        for title, desc, cat, deadline, status, created_by in rfqs_data:
            await conn.execute(
                "INSERT INTO rfqs (title, description, category, deadline, status, created_by) VALUES ($1,$2,$3,$4,$5,$6)",
                title, desc, cat, deadline, status, created_by
            )
        print("✓ 4 RFQs created")

        # ── RFQ ITEMS ──
        rfq_items = [
            # RFQ 1 - Laptops
            (1, "Dell Latitude 5540 Laptop", 30, "units", "i7-1365U, 16GB RAM, 512GB SSD, 15.6\" FHD"),
            (1, "HP ProBook 450 G10", 20, "units", "i7-1355U, 16GB RAM, 512GB SSD, 15.6\" FHD"),
            # RFQ 2 - Furniture
            (2, "Executive Office Desk", 20, "units", "160x80cm, laminated wood, cable management"),
            (2, "Ergonomic Office Chair", 20, "units", "Mesh back, adjustable height, lumbar support"),
            (2, "Conference Table (8-seater)", 5, "units", "240x120cm, wooden top, cable ports"),
            # RFQ 3 - Stationery
            (3, "A4 Copier Paper (500 sheets)", 200, "reams", "80 GSM, white"),
            (3, "Ball Point Pens (box of 50)", 10, "boxes", "Blue ink, 0.7mm tip"),
            (3, "Lever Arch Files", 100, "units", "A4 size, assorted colors"),
            # RFQ 4 - Server (closed)
            (4, "Rack-mount UPS 3KVA", 4, "units", "Online double-conversion, 3000VA"),
            (4, "48-port Managed Switch", 2, "units", "Gigabit, PoE+, L3 managed"),
        ]
        for rfq_id, name, qty, unit, specs in rfq_items:
            await conn.execute(
                "INSERT INTO rfq_items (rfq_id, product_name, quantity, unit, specifications) VALUES ($1,$2,$3,$4,$5)",
                rfq_id, name, qty, unit, specs
            )
        print("✓ 10 RFQ items created")

        # ── RFQ-VENDOR ASSIGNMENTS ──
        rfq_vendors = [(1,1),(1,5),(2,3),(2,1),(3,2),(3,4),(4,1),(4,5)]
        for rfq_id, vendor_id in rfq_vendors:
            await conn.execute(
                "INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
                rfq_id, vendor_id
            )
        print("✓ RFQ-Vendor assignments created")

        # ── QUOTATIONS (for closed RFQ #4 - full workflow demo) ──
        quotations_data = [
            # RFQ 4 (closed) - two competing quotations
            (4, 1, 285000.00, 10, "Net 30 days payment terms", "accepted"),
            (4, 5, 310000.00, 14, "50% advance, 50% on delivery", "rejected"),
            # RFQ 1 (open) - one submitted quotation
            (1, 1, 3250000.00, 7, "Bulk discount applied. 1 year warranty", "submitted"),
            (1, 5, 3450000.00, 12, "3 year extended warranty included", "submitted"),
            # RFQ 2 (open) - one submitted
            (2, 3, 875000.00, 21, "Installation included. 5 year warranty on desks", "submitted"),
        ]
        for rfq_id, vendor_id, total, days, notes, status in quotations_data:
            await conn.execute(
                """INSERT INTO quotations (rfq_id, vendor_id, total_amount, delivery_days, notes, status)
                   VALUES ($1,$2,$3,$4,$5,$6)""",
                rfq_id, vendor_id, total, days, notes, status
            )
        print("✓ 5 quotations created")

        # ── QUOTATION ITEMS ──
        q_items = [
            # Quotation 1 (RFQ 4 items: item 9 and 10)
            (1, 9, 55000.00, 220000.00),
            (1, 10, 32500.00, 65000.00),
            # Quotation 2 (RFQ 4 items)
            (2, 9, 60000.00, 240000.00),
            (2, 10, 35000.00, 70000.00),
            # Quotation 3 (RFQ 1 items: item 1 and 2)
            (3, 1, 72000.00, 2160000.00),
            (3, 2, 54500.00, 1090000.00),
            # Quotation 4 (RFQ 1 items)
            (4, 1, 78000.00, 2340000.00),
            (4, 2, 55500.00, 1110000.00),
            # Quotation 5 (RFQ 2 items: 3, 4, 5)
            (5, 3, 18500.00, 370000.00),
            (5, 4, 12000.00, 240000.00),
            (5, 5, 53000.00, 265000.00),
        ]
        for qid, item_id, unit_price, total_price in q_items:
            await conn.execute(
                "INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, total_price) VALUES ($1,$2,$3,$4)",
                qid, item_id, unit_price, total_price
            )
        print("✓ 11 quotation items created")

        # ── APPROVALS ──
        # Quotation 1 (accepted) - approved
        await conn.execute(
            """INSERT INTO approvals (quotation_id, approver_id, status, remarks)
               VALUES (1, 2, 'approved', 'Best price and acceptable delivery timeline')"""
        )
        # Quotation 2 (rejected) - rejected
        await conn.execute(
            """INSERT INTO approvals (quotation_id, approver_id, status, remarks)
               VALUES (2, 2, 'rejected', 'Price too high compared to other vendor')"""
        )
        # Quotation 3 - pending approval
        await conn.execute(
            """INSERT INTO approvals (quotation_id, status)
               VALUES (3, 'pending')"""
        )
        print("✓ 3 approvals created (1 approved, 1 rejected, 1 pending)")

        # ── PURCHASE ORDER (from approved quotation 1) ──
        await conn.execute(
            """INSERT INTO purchase_orders (quotation_id, po_number, status, delivery_date, created_by)
               VALUES (1, 'PO-000001', 'delivered', $1, 3)""",
            today - timedelta(days=3)
        )
        print("✓ 1 purchase order created")

        # ── INVOICE (from PO 1) ──
        subtotal = 285000.00
        tax_rate = 18.00
        tax_amount = round(subtotal * tax_rate / 100, 2)
        total = subtotal + tax_amount
        await conn.execute(
            """INSERT INTO invoices (po_id, invoice_number, tax_rate, subtotal, tax_amount, total, status)
               VALUES (1, 'INV-000001', $1, $2, $3, $4, 'sent')""",
            tax_rate, subtotal, tax_amount, total
        )
        print("✓ 1 invoice created")

        # ── ACTIVITY LOGS ──
        now = datetime.now(timezone.utc)
        activities = [
            (3, "created", "rfq", 1, '{"title": "Office Laptops - Q3 2026"}'),
            (3, "created", "rfq", 2, '{"title": "Office Furniture Set"}'),
            (3, "created", "rfq", 3, '{"title": "Printer Paper & Stationery"}'),
            (3, "created", "rfq", 4, '{"title": "Server Room Equipment"}'),
            (1, "submitted", "quotation", 1, '{"rfq_id": 4}'),
            (1, "submitted", "quotation", 3, '{"rfq_id": 1}'),
            (2, "approval_approved", "approval", 1, '{"remarks": "Best price"}'),
            (3, "created", "purchase_order", 1, '{"po_number": "PO-000001"}'),
            (2, "approval_rejected", "approval", 2, '{"remarks": "Price too high"}'),
        ]
        for uid, action, etype, eid, details in activities:
            await conn.execute(
                "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5::jsonb)",
                uid, action, etype, eid, details
            )
        print("✓ 9 activity logs created")

    await pool.close()
    print("\n✅ Database seeded successfully!")
    print("\nLogin credentials (all passwords: password123):")
    print("  admin@vendorbridge.com  (Admin)")
    print("  savya@vendorbridge.com  (Manager)")
    print("  priya@vendorbridge.com  (Procurement Officer)")
    print("  vendor1@supplytec.com   (Vendor - Raj Electronics)")


asyncio.run(main())
