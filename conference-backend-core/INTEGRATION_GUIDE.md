# 📘 Integration Guide - Conference Backend Core

Complete step-by-step guide to integrate the conference backend into your new project.

## 🎯 Overview

This guide will help you integrate the complete conference management backend into your new conference website in **less than 30 minutes**.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ MongoDB database (local or Atlas)
- ✅ SMTP email account (Gmail, SendGrid, etc.)
- ✅ Razorpay account (optional, for online payments)
- ✅ Next.js 14+ project initialized

---

## 🚀 Step-by-Step Integration

### Step 1: Copy Core Files (2 minutes)

Copy the entire `conference-backend-core` folder to your project root:

```bash
# From the source project
cp -r conference-backend-core /path/to/your/new-project/

# Or manually copy the folder
```

Your project structure should now look like:
```
your-new-project/
├── conference-backend-core/
│   ├── config/
│   ├── lib/
│   ├── hooks/
│   ├── components/
│   └── README.md
├── app/
├── components/
├── public/
└── package.json
```

### Step 2: Install Dependencies (3 minutes)

Add required packages to your `package.json`:

```bash
npm install mongoose bcryptjs next-auth nodemailer razorpay qrcode nanoid archiver exceljs
npm install -D @types/bcryptjs @types/nodemailer @types/qrcode @types/archiver
```

**Required Packages:**
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `next-auth` - Authentication
- `nodemailer` - Email service
- `razorpay` - Payment gateway
- `qrcode` - QR code generation
- `nanoid` - Unique ID generation
- `archiver` - ZIP file creation
- `exceljs` - Excel export

### Step 3: Configure Your Conference (5 minutes)

Edit `conference-backend-core/config/conference.config.ts`:

```typescript
export const conferenceConfig: ConferenceConfig = {
  // 1. Basic Information
  name: "Your Conference Full Name 2026",
  shortName: "YOURCONF2026",
  organizationName: "Your Organization",
  tagline: "Your conference tagline",
  
  // 2. Event Dates
  eventDate: {
    start: "2026-03-15",  // YYYY-MM-DD
    end: "2026-03-17"
  },
  
  // 3. Venue
  venue: {
    name: "Your Venue Name",
    address: "123 Conference Street",
    city: "Your City",
    state: "Your State",
    country: "India",
    pincode: "123456"
  },
  
  // 4. Contact
  contact: {
    email: "contact@yourconference.com",
    phone: "+91 1234567890",
    website: "https://yourconference.com",
    supportEmail: "support@yourconference.com",
    abstractsEmail: "abstracts@yourconference.com"
  },
  
  // 5. Theme Colors - MOST IMPORTANT!
  theme: {
    primary: "#3b82f6",      // Your brand color
    secondary: "#8b5cf6",    // Accent color
    accent: "#f59e0b",       // Highlights
    success: "#10b981",      
    error: "#ef4444",        
    warning: "#f59e0b",      
    dark: "#111827",         
    light: "#f9fafb"         
  },
  
  // 6. Keep other settings as is or customize as needed
  // ...
}
```

### Step 4: Environment Variables (5 minutes)

Create `.env.local` in your project root:

```env
# ===== DATABASE =====
MONGODB_URI=mongodb://localhost:27017/yourconference
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yourconference

# ===== AUTHENTICATION =====
NEXTAUTH_SECRET=your-super-secret-key-here-generate-with-openssl
NEXTAUTH_URL=http://localhost:3000
# Production:
# NEXTAUTH_URL=https://yourconference.com

# ===== PAYMENT (Razorpay) =====
RAZORPAY_KEY_ID=rzp_test_yourkey
RAZORPAY_KEY_SECRET=your_secret_key
# Get these from: https://dashboard.razorpay.com/

# ===== EMAIL (SMTP) =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
# For Gmail: Enable 2FA and generate App Password
# https://support.google.com/accounts/answer/185833

# ===== APP SETTINGS =====
APP_NAME="Your Conference 2026"
APP_URL=http://localhost:3000
NODE_ENV=development
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 5: Setup API Routes (10 minutes)

Create these API route files in your `app/api/` directory:

#### 5.1 Authentication Routes

**`app/api/auth/[...nextauth]/route.ts`**
```typescript
import { authOptions } from '@/conference-backend-core/lib/auth/auth.config'
import NextAuth from 'next-auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**`app/api/auth/register/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import User from '@/conference-backend-core/lib/models/User.model'
import { generateRegistrationId } from '@/conference-backend-core/lib/utils/idGenerator'
import emailService from '@/conference-backend-core/lib/email/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, profile, registration } = body

    // Validation
    if (!email || !password || !profile?.firstName || !profile?.lastName) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 })
    }

    await connectDB()

    // Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Email already registered'
      }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate registration ID
    const registrationId = await generateRegistrationId()

    // Create user
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      profile,
      registration: {
        ...registration,
        registrationId,
        status: 'pending',
        registrationDate: new Date()
      },
      role: 'user',
      isActive: true
    })

    // Send confirmation email
    await emailService.sendRegistrationConfirmation({
      email: newUser.email,
      name: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
      registrationId: newUser.registration.registrationId,
      registrationType: newUser.registration.type,
      workshopSelections: registration?.workshopSelections || [],
      accompanyingPersons: registration?.accompanyingPersons?.length || 0
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        id: newUser._id,
        email: newUser.email,
        registrationId: newUser.registration.registrationId
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}
```

#### 5.2 Payment Routes

**`app/api/payment/calculate/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { calculatePrice } from '@/conference-backend-core/config/pricing.config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationType, workshopIds, accompanyingPersonCount, discountCode, age } = body

    const calculation = calculatePrice({
      registrationType,
      workshopIds,
      accompanyingPersonCount,
      discountCode,
      age
    })

    return NextResponse.json({
      success: true,
      data: calculation
    })
  } catch (error) {
    console.error('Price calculation error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Calculation failed'
    }, { status: 400 })
  }
}
```

**Continue with more API routes as needed...**

### Step 6: Create UI Pages (5 minutes)

#### Landing Page Integration

**`app/page.tsx`** (Your custom landing page)
```typescript
import { useConferenceTheme } from '@/conference-backend-core/hooks/useConferenceTheme'
import Link from 'next/link'

export default function HomePage() {
  // Your custom landing page content
  
  return (
    <div>
      {/* Your hero section, speakers, etc. */}
      
      {/* Registration CTA - using theme colors */}
      <Link 
        href="/register"
        className="bg-[var(--conf-primary)] text-white px-6 py-3 rounded-lg"
      >
        Register Now
      </Link>
    </div>
  )
}
```

#### Wrap Your App

**`app/layout.tsx`**
```typescript
import { ConferenceThemeProvider } from '@/conference-backend-core/components/ThemeProvider'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConferenceThemeProvider>
          {children}
        </ConferenceThemeProvider>
      </body>
    </html>
  )
}
```

### Step 7: Add Tailwind Configuration (2 minutes)

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'
import { getTailwindThemeConfig } from './conference-backend-core/config/theme.config'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './conference-backend-core/**/*.{js,ts,jsx,tsx,mdx}', // Add this!
  ],
  theme: {
    extend: {
      ...getTailwindThemeConfig(), // Add conference theme
    },
  },
  plugins: [],
}

export default config
```

---

## ✅ Testing Your Integration

### Test Database Connection
```bash
npm run dev
# Check console for: "✅ MongoDB connected successfully"
```

### Test Registration
1. Go to `http://localhost:3000/register`
2. Fill in the form
3. Submit
4. Check MongoDB for the new user
5. Check email for confirmation

### Test Email
Create a test route: `app/api/test-email/route.ts`
```typescript
import { NextResponse } from 'next/server'
import emailService from '@/conference-backend-core/lib/email/emailService'

export async function GET() {
  const result = await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<h1>It works!</h1>',
    text: 'It works!'
  })
  
  return NextResponse.json(result)
}
```

Visit: `http://localhost:3000/api/test-email`

---

## 🎨 Using Theme in Your Custom Pages

### In React Components
```typescript
'use client'
import { useConferenceTheme } from '@/conference-backend-core/hooks/useConferenceTheme'

export function MyComponent() {
  const theme = useConferenceTheme()
  
  return (
    <div>
      {/* Using theme colors */}
      <h1 style={{ color: theme.primary }}>
        {theme.config.name}
      </h1>
      
      {/* Using CSS variables */}
      <button className="bg-[var(--conf-primary)] text-white">
        Register
      </button>
      
      {/* Using Tailwind classes */}
      <div className="bg-conference-primary">
        Themed Content
      </div>
    </div>
  )
}
```

### Check Status Hooks
```typescript
import { 
  useRegistrationStatus, 
  useAbstractSubmissionStatus 
} from '@/conference-backend-core/hooks/useConferenceTheme'

export function StatusBanner() {
  const regStatus = useRegistrationStatus()
  const absStatus = useAbstractSubmissionStatus()
  
  return (
    <div>
      <p>{regStatus.message}</p>
      {regStatus.isOpen && <button>Register Now</button>}
      
      <p>{absStatus.message}</p>
      {absStatus.isOpen && <button>Submit Abstract</button>}
    </div>
  )
}
```

---

## 📝 Next Steps

After integration:

1. **Customize Pricing** - Edit `conference-backend-core/config/pricing.config.ts`
2. **Configure Workshops** - Update workshop details in pricing config
3. **Setup Abstract Tracks** - Configure in conference.config.ts
4. **Design Your Landing** - Create custom pages linking to backend routes
5. **Test All Features** - Registration, payment, abstracts, admin panel
6. **Deploy** - See DEPLOYMENT.md for production setup

---

## 🆘 Troubleshooting

### MongoDB Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running locally or check Atlas connection string

### Email Not Sending
**Solution:** 
- Check SMTP credentials
- For Gmail: Enable 2FA and use App Password
- Check firewall/network restrictions

### Theme Not Applying
**Solution:**
- Ensure `ConferenceThemeProvider` wraps your app
- Check Tailwind config includes conference-backend-core
- Restart dev server after config changes

### Registration ID Not Generating
**Solution:**
- Check MongoDB connection
- Ensure User model is imported correctly
- Verify generateRegistrationId function is called

---

## 📚 Additional Resources

- **API Reference:** See `API_REFERENCE.md`
- **Component Docs:** See `COMPONENTS.md`
- **Deployment Guide:** See `DEPLOYMENT.md`
- **FAQ:** See `FAQ.md`

---

## ✨ You're All Set!

You now have a fully functional conference management backend integrated into your project. 

All features are ready to use:
- ✅ User Registration
- ✅ Payment Processing
- ✅ Abstract Management
- ✅ Workshop Booking
- ✅ Admin Panel
- ✅ Email Notifications
- ✅ Mobile Responsive
- ✅ Theme Customization

**Build your custom landing pages and let the backend handle everything else!**
