# 🎯 Conference Backend Core - Reusable System

A **fully reusable, plug-and-play conference management backend** that can be integrated into any conference website with minimal configuration.

## ✨ Features

### Complete Feature Set
- ✅ **User Registration & Authentication** (NextAuth.js with multi-device support)
- ✅ **Payment Processing** (Razorpay + Bank Transfer support)
- ✅ **Abstract Management System** (Submission, Review, Final Upload)
- ✅ **Workshop Management** (Seat booking, capacity management)
- ✅ **Reviewer System** (Assignment, workload management, reviews)
- ✅ **Admin Panel** (Complete dashboard, analytics, exports)
- ✅ **Email System** (Automated notifications, templates, bulk emails)
- ✅ **PDF Generation** (Invoices, certificates, QR codes)
- ✅ **Mobile Responsive** (All components optimized for mobile)
- ✅ **Theme System** (Configuration-driven colors and branding)

### Architecture Highlights
- **Zero Hardcoding**: All conference-specific details in config
- **Theme-Aware**: Automatically adapts to your brand colors
- **Mobile-First**: Fully responsive across all devices
- **Production-Ready**: Security, validation, error handling
- **Scalable**: MongoDB backend with optimized indexes
- **Type-Safe**: Full TypeScript support

## 🚀 Quick Integration (5 Minutes)

### Step 1: Copy Core Files
```bash
# Copy the entire conference-backend-core folder to your project root
cp -r conference-backend-core/* your-new-conference-project/
```

### Step 2: Configure Your Conference
Edit `conference-backend-core/config/conference.config.ts`:

```typescript
export const conferenceConfig = {
  // Basic Information
  name: "Your Conference 2026",
  shortName: "YC2026",
  organizationName: "Your Organization",
  
  // Dates
  eventDate: {
    start: "2026-02-06",
    end: "2026-02-08"
  },
  
  // Venue
  venue: {
    name: "Your Venue",
    city: "Your City",
    state: "Your State",
    country: "India"
  },
  
  // Contact
  contact: {
    email: "contact@yourconference.com",
    phone: "+91 XXXXXXXXXX",
    website: "https://yourconference.com"
  },
  
  // Theme Colors (automatically applied everywhere)
  theme: {
    primary: "#059669",      // Main brand color
    secondary: "#3b82f6",    // Accent color
    accent: "#f59e0b",       // Highlight color
    dark: "#111827",         // Dark elements
    light: "#f3f4f6"         // Light backgrounds
  }
}
```

### Step 3: Set Environment Variables
Create `.env.local`:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=https://yourconference.com

# Payment (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
```

### Step 4: Link to Your Landing Pages
In your custom pages (landing, committee, schedule), import and use the theme:

```typescript
import { useConferenceTheme } from '@/conference-backend-core/hooks/useConferenceTheme'

export default function LandingPage() {
  const theme = useConferenceTheme()
  
  return (
    <div>
      {/* Your custom landing content */}
      
      {/* Link to registration */}
      <a href="/register" style={{ backgroundColor: theme.primary }}>
        Register Now
      </a>
    </div>
  )
}
```

### Step 5: Done! 🎉
All backend features are now available:
- `/register` - Registration page
- `/auth/login` - User login
- `/dashboard` - User dashboard
- `/admin` - Admin panel
- `/abstracts` - Abstract submission
- `/reviewer` - Reviewer portal

## 📁 What's Included

### Backend APIs (`/api/*`)
```
/api/auth/*              - Authentication (login, register, password reset)
/api/user/*              - User profile & dashboard data
/api/payment/*           - Payment processing & calculations
/api/abstracts/*         - Abstract submission & management
/api/workshops/*         - Workshop seat management
/api/admin/*             - Admin operations (users, payments, exports)
/api/reviewer/*          - Reviewer assignment & reviews
/api/notifications/*     - Email notifications
/api/config/*            - Dynamic configuration
```

### Database Models (`/lib/models/*`)
- `User` - User accounts with sessions
- `Payment` - Payment transactions
- `Abstract` - Abstract submissions
- `Review` - Abstract reviews
- `Workshop` - Workshop management
- `Configuration` - Dynamic settings

### UI Components (`/components/*`)
All components are **mobile-responsive** and **theme-aware**:
- Registration forms with validation
- Payment interface (Razorpay + Bank Transfer)
- User dashboard with profile management
- Abstract submission with file upload
- Admin panel with analytics
- Reviewer portal with review forms

### Services (`/lib/*`)
- Email service with templates
- PDF generation (invoices, certificates)
- QR code generation
- Authentication & session management
- Payment calculation engine
- File upload handling

## 🎨 Theme System

The entire system automatically adapts to your theme colors configured in `conference.config.ts`.

### Automatic Color Application
- All buttons use `theme.primary`
- Links use `theme.secondary`
- Alerts/warnings use `theme.accent`
- Dark text uses `theme.dark`
- Light backgrounds use `theme.light`

### CSS Variables (Auto-generated)
The system generates CSS variables for all components:
```css
:root {
  --conference-primary: #059669;
  --conference-secondary: #3b82f6;
  --conference-accent: #f59e0b;
  /* ... and more */
}
```

## 📱 Mobile Responsive Design

Every component is built mobile-first with:
- Responsive breakpoints (320px, 768px, 1024px, 1440px)
- Touch-friendly interactions
- Optimized forms for mobile keyboards
- Adaptive layouts
- Mobile navigation patterns

## 🔒 Security Features

- JWT-based authentication
- Multi-device session management
- CSRF protection
- Rate limiting
- Input validation (Zod schemas)
- SQL injection prevention
- XSS protection
- Secure password hashing (bcrypt)

## 📊 Admin Features

Complete admin panel with:
- Real-time dashboard & analytics
- User registration management
- Payment verification & tracking
- Abstract review management
- Workshop capacity monitoring
- Bulk email communication
- Data export (CSV, Excel, ZIP)
- Configuration management

## 📧 Email Templates

Professional email templates for:
- Registration confirmation
- Payment receipt with invoice PDF
- Abstract submission confirmation
- Abstract acceptance notification
- Password reset
- Custom bulk emails
- Payment reminders

## 🧪 Testing

Run the included tests:
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run type-check       # TypeScript validation
```

## 📖 Full Documentation

See individual documentation files:
- `INTEGRATION_GUIDE.md` - Detailed integration steps
- `API_REFERENCE.md` - Complete API documentation
- `CONFIGURATION.md` - All configuration options
- `THEMING_GUIDE.md` - Theme customization
- `MOBILE_OPTIMIZATION.md` - Mobile responsiveness details
- `DEPLOYMENT.md` - Production deployment guide

## 🆘 Support

For issues or questions:
1. Check the documentation files
2. Review example implementations
3. Contact: support@conferencebackendcore.com

## 📄 License

MIT License - Use freely in your conference projects

---

**Built with ❤️ for conference organizers worldwide**
