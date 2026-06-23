# Conference Backend Core - Integration Guide

This document explains how the **NeuroVascon-2026** project integrates the reusable **conference-backend-core** system in a plug-and-play manner.

## 🎯 Overview

The `conference-backend-core` is a complete, reusable conference management system that can be integrated into any Next.js project with minimal configuration. This project demonstrates the integration pattern.

---

## 📁 Project Structure

```
NeuroVascon-2026/
├── app/                          # Next.js App Router
│   ├── admin/
│   │   └── page.tsx             # Admin panel (uses ComprehensiveAdminPanel)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── registrations/   # Re-exports from conference-backend-core
│   │   │   └── payments/        # Re-exports from conference-backend-core
│   │   └── payment/
│   │       └── pricing/         # Re-exports from conference-backend-core
│   └── providers.tsx            # Session & Toast providers
│
├── conference-backend-core/      # Reusable system (DO NOT MODIFY)
│   ├── app/api/                 # Complete API routes
│   ├── components/              # All UI components
│   ├── config/                  # Configuration files
│   ├── lib/                     # Backend logic, models, utils
│   └── hooks/                   # React hooks
│
├── tsconfig.json                # Path aliases configured
└── package.json                 # Dependencies
```

---

## 🔧 Integration Steps

### 1. **TypeScript Path Aliases**

Configure `tsconfig.json` to resolve conference-backend-core paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./conference-backend-core/lib/*"],
      "@/config/*": ["./conference-backend-core/config/*"]
    }
  }
}
```

**Why?** This allows the conference-backend-core API routes to import their dependencies correctly without modification.

### 2. **API Route Wrappers**

Instead of copying API routes, create lightweight wrappers that re-export from conference-backend-core.

**Why Wrappers?**
- Next.js App Router requires routes in `app/api/` directory
- Wrappers are tiny (2-3 lines) and just re-export
- You only create wrappers for routes you actually use
- Provides flexibility to override specific routes if needed

**Example: `app/api/admin/registrations/route.ts`**
```typescript
// Re-export the registrations API from conference-backend-core
export { GET, POST } from '@/conference-backend-core/app/api/admin/registrations/route'
```

**Required Wrappers for Admin Panel:**
1. `app/api/admin/registrations/route.ts` - Registration management
2. `app/api/admin/payments/route.ts` - Payment tracking
3. `app/api/payment/pricing/route.ts` - Pricing tiers
4. `app/api/admin/config/pricing-tiers/route.ts` - Pricing configuration

**Benefits:**
- ✅ Zero code duplication (just 2-line re-exports)
- ✅ Single source of truth
- ✅ Easy updates (update core, all conferences benefit)
- ✅ Maintains plug-and-play architecture
- ✅ Type-safe and explicit

### 3. **Admin Panel Integration**

**File: `app/admin/page.tsx`**
```typescript
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ComprehensiveAdminPanel } from '@/conference-backend-core/components/admin/ComprehensiveAdminPanel'
import { Navigation } from '@/conference-backend-core/components/Navigation'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role
      if (userRole !== 'admin') {
        router.push('/dashboard')
      }
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </>
    )
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'admin') {
    return null
  }

  return (
    <>
      <Navigation />
      <ComprehensiveAdminPanel />
    </>
  )
}
```

**Key Points:**
- ✅ Adds Navigation component
- ✅ Implements authentication & authorization
- ✅ Shows loading state
- ✅ Uses ComprehensiveAdminPanel from core

### 4. **Providers Setup**

**File: `app/providers.tsx`**
```typescript
'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/conference-backend-core/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
```

**What it does:**
- ✅ Wraps app with NextAuth session provider
- ✅ Adds toast notifications globally

### 5. **Required Dependencies**

Add these to `package.json`:

```json
{
  "dependencies": {
    "puppeteer-core": "^21.0.0",
    "@sparticuz/chromium": "^121.0.0"
  }
}
```

Then run:
```bash
npm install --legacy-peer-deps
```

**Note:** Use `--legacy-peer-deps` to resolve React version conflicts with 3D libraries.

---

## 🎨 Component Import Fixes

The conference-backend-core components had incorrect import paths. These were fixed:

### Before (❌ Incorrect):
```typescript
import { Button } from '../components/ui/button'
import { useToast } from '../hooks/use-toast'
```

### After (✅ Correct):
```typescript
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
```

**Files Fixed:**
- `ComprehensiveAdminPanel.tsx`
- `AbstractsSubmissionsManager.tsx`
- `PricingTiersManager.tsx`
- `WorkshopManager.tsx`
- `ContactMessagesManager.tsx`
- `RegistrationTable.tsx`
- `EmailDialog.tsx`
- `AbstractDetailsModal.tsx`
- `Navigation.tsx`
- `ThemeSwitcher.tsx`
- `toaster.tsx`

---

## ⚙️ Configuration

Only **3 files** need to be edited for each conference:

### 1. `conference-backend-core/config/conference.config.ts`
```typescript
export const conferenceConfig = {
  name: "NeuroVascon 2026",
  shortName: "NeuroVascon",
  year: "2026",
  dates: {
    start: "2026-10-02",
    end: "2026-10-04"
  },
  venue: {
    name: "Hyderabad International Convention Centre",
    city: "Hyderabad",
    state: "Telangana",
    country: "India"
  },
  theme: {
    primary: "#1e40af",    // Blue
    secondary: "#7c3aed",  // Purple
    accent: "#f59e0b"      // Amber
  }
}
```

### 2. `conference-backend-core/config/pricing.config.ts`
```typescript
export const pricingConfig = {
  currency: "INR",
  tiers: {
    earlyBird: {
      startDate: "2025-01-01",
      endDate: "2026-06-30",
      categories: {
        "ossap-member": { amount: 8000, label: "OSSAP Member" },
        "non-member": { amount: 10000, label: "Non Member" }
      }
    }
  },
  workshops: [
    {
      id: "workshop-1",
      name: "Advanced Techniques",
      price: 2000
    }
  ]
}
```

### 3. `.env.local`
```env
# Database
MONGODB_URI=mongodb://localhost:27017/neurovascon2026

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateway
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
```

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Access admin panel
http://localhost:3000/admin
```

---

## 📝 Key Fixes Applied

### 1. **Template Literal Interpolation**
Fixed 4 instances where `${conferenceConfig.shortName}` wasn't being interpolated:
- Changed from double quotes to backticks
- Changed from `"${var}"` to `` `${var}` ``

### 2. **Import Path Corrections**
- Fixed 26 files with incorrect relative import paths
- Standardized to use `../ui/` for UI components
- Fixed `../hooks/` to `../ui/use-toast`

### 3. **API Route Structure**
- Created wrapper routes that re-export from core
- Maintains zero code duplication
- Easy to update and maintain

### 4. **Missing Dependencies**
- Added `puppeteer-core` for PDF generation
- Added `@sparticuz/chromium` for serverless PDF generation

---

## 🎯 Benefits of This Architecture

✅ **Zero Code Duplication** - All logic in conference-backend-core  
✅ **Single Source of Truth** - Update once, works everywhere  
✅ **Easy Maintenance** - Fix bugs in one place  
✅ **Plug & Play** - New conference = 3 config files  
✅ **Type Safe** - Full TypeScript support  
✅ **Scalable** - Add features to core, all conferences benefit  

---

## 🔄 Updating for a New Conference

1. Copy the project folder
2. Rename to new conference name
3. Edit 3 config files:
   - `conference.config.ts`
   - `pricing.config.ts`
   - `.env.local`
4. Update `package.json` name
5. Run `npm install --legacy-peer-deps`
6. Run `npm run dev`

**That's it!** Your new conference website is ready. 🎉

---

## 📚 Additional Resources

- **Conference Backend Core README**: `conference-backend-core/README.md`
- **Quick Start Guide**: `conference-backend-core/QUICK_START.md`
- **Integration Guide**: `conference-backend-core/INTEGRATION_GUIDE.md`
- **Complete Feature List**: `conference-backend-core/COMPLETE_FEATURE_LIST.md`

---

## 🐛 Troubleshooting

### Module Not Found Errors
- Ensure `tsconfig.json` has correct path aliases
- Run `npm install --legacy-peer-deps`
- Restart dev server

### API Routes Returning 404
- Check wrapper files exist in `app/api/`
- Verify they're re-exporting correct methods (GET, POST, etc.)

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `npm install --legacy-peer-deps`
- Rebuild: `npm run build`

---

**Last Updated:** November 9, 2025  
**Version:** 1.0.0  
**Conference:** NeuroVascon 2026
