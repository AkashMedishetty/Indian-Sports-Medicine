# Database Seeding Script

This script seeds the database with initial data required for the NeuroVascon 2026 conference application.

## Prerequisites

- MongoDB must be running
- Set `MONGODB_URI` environment variable (or it will default to `mongodb://localhost:27017/neurovascon2026`)

## What Gets Seeded

### 1. **Admin User**
- Email: `hello@purplehatevents.in`
- Password: `1234567890`
- Role: `admin`

### 2. **Reviewer User**
- Email: `reviewer@purplehatevents.in`
- Password: `1234567890`
- Role: `reviewer`

### 3. **Workshops** (3 workshops)
- Advanced Neurovascular Techniques (₹5,000)
- Endovascular Interventions (₹6,000)
- Stroke Management Workshop (₹4,500)

### 4. **Payment Configuration**
- Bank Transfer details
- Account Name: NeuroVascon 2026
- Account Number: 1234567890
- IFSC: SBIN0001234
- Bank: State Bank of India
- UPI ID: neurovascon@sbi

### 5. **Pricing Tiers** (2 tiers)
- Early Bird (20% discount, valid till March 31, 2026)
- Regular (no discount, from April 1, 2026)

### 6. **Database Indexes**
- Optimized indexes for users, workshops, and registrations

## How to Run

```bash
npm run seed
```

## Warning

⚠️ **This script will DELETE all existing data** in the following collections:
- users
- workshops
- payment_config
- pricing_tiers

If you want to preserve existing data, comment out the deletion lines in the script.

## After Seeding

You can now:
1. Login as admin at `/admin/login`
2. Login as reviewer at `/reviewer/login`
3. Configure additional settings in the admin panel
4. Test registration flow with seeded workshops and pricing
