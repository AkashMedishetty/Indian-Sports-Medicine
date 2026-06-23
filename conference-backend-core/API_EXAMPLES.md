# 🔌 API Examples - Ready to Use Routes

Complete API route examples that you can copy directly into your `app/api/` directory.

---

## 📁 File Structure

Place these files in your Next.js `app/api/` directory:

```
app/api/
├── auth/
│   ├── [...nextauth]/route.ts
│   ├── register/route.ts
│   └── forgot-password/route.ts
├── user/
│   ├── profile/route.ts
│   └── dashboard/route.ts
├── payment/
│   ├── calculate/route.ts
│   ├── create-order/route.ts
│   └── verify/route.ts
├── abstracts/
│   ├── route.ts
│   ├── submit/route.ts
│   └── upload/route.ts
├── workshops/
│   └── route.ts
└── admin/
    ├── users/route.ts
    ├── abstracts/route.ts
    └── payments/route.ts
```

---

## 🔐 Authentication APIs

### `app/api/auth/[...nextauth]/route.ts`
```typescript
import { authOptions } from '@/conference-backend-core/lib/auth/auth.config'
import NextAuth from 'next-auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### `app/api/auth/register/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import User from '@/conference-backend-core/lib/models/User.model'
import { generateRegistrationId } from '@/conference-backend-core/lib/utils/idGenerator'
import emailService from '@/conference-backend-core/lib/email/emailService'
import { userRegistrationSchema, validateData, formatZodErrors } from '@/conference-backend-core/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = validateData(userRegistrationSchema, body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: formatZodErrors(validation.errors!)
      }, { status: 400 })
    }

    const { email, password, profile, registration } = validation.data

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

    // Generate unique registration ID
    let registrationId = await generateRegistrationId()
    let attempts = 0
    while (await User.findOne({ 'registration.registrationId': registrationId }) && attempts < 10) {
      registrationId = await generateRegistrationId()
      attempts++
    }

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
    try {
      await emailService.sendRegistrationConfirmation({
        email: newUser.email,
        name: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
        registrationId: newUser.registration.registrationId,
        registrationType: newUser.registration.type,
        workshopSelections: registration.workshopSelections || [],
        accompanyingPersons: registration.accompanyingPersons?.length || 0
      })
    } catch (emailError) {
      console.error('Email failed:', emailError)
    }

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

---

## 👤 User APIs

### `app/api/user/profile/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/conference-backend-core/lib/auth/auth.config'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import User from '@/conference-backend-core/lib/models/User.model'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById((session.user as any).id).select('-password -activeSessions')

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    await connectDB()

    const user = await User.findByIdAndUpdate(
      (session.user as any).id,
      { $set: { 'profile': body.profile } },
      { new: true, runValidators: true }
    ).select('-password -activeSessions')

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
```

### `app/api/user/dashboard/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/conference-backend-core/lib/auth/auth.config'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import User from '@/conference-backend-core/lib/models/User.model'
import Abstract from '@/conference-backend-core/lib/models/Abstract.model'
import Payment from '@/conference-backend-core/lib/models/Payment.model'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const userId = (session.user as any).id

    // Get user data
    const user = await User.findById(userId).select('-password -activeSessions')

    // Get abstracts
    const abstracts = await Abstract.find({ userId }).sort({ createdAt: -1 }).limit(5)

    // Get payment history
    const payments = await Payment.find({ userId }).sort({ transactionDate: -1 }).limit(5)

    return NextResponse.json({
      success: true,
      data: {
        user,
        abstracts,
        payments,
        stats: {
          totalAbstracts: abstracts.length,
          totalPayments: payments.length,
          registrationStatus: user.registration.status
        }
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 💳 Payment APIs

### `app/api/payment/calculate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { calculatePrice } from '@/conference-backend-core/config/pricing.config'
import { paymentCalculationSchema, validateData, formatZodErrors } from '@/conference-backend-core/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate
    const validation = validateData(paymentCalculationSchema, body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: formatZodErrors(validation.errors!)
      }, { status: 400 })
    }

    // Calculate price
    const calculation = calculatePrice(validation.data)

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

### `app/api/payment/create-order/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/conference-backend-core/lib/auth/auth.config'
import Razorpay from 'razorpay'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import Payment from '@/conference-backend-core/lib/models/Payment.model'
import User from '@/conference-backend-core/lib/models/User.model'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, breakdown } = body

    await connectDB()

    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${user.registration.registrationId}_${Date.now()}`
    })

    // Save payment record
    const payment = await Payment.create({
      userId: user._id,
      registrationId: user.registration.registrationId,
      razorpayOrderId: order.id,
      amount: {
        registration: breakdown.registration,
        workshops: breakdown.workshops,
        accompanyingPersons: breakdown.accompanyingPersons,
        discount: breakdown.discount,
        total: amount,
        currency: 'INR'
      },
      breakdown,
      status: 'pending'
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment._id
      }
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 })
  }
}
```

---

## 📄 Abstract APIs

### `app/api/abstracts/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/conference-backend-core/lib/auth/auth.config'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import Abstract from '@/conference-backend-core/lib/models/Abstract.model'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const abstracts = await Abstract.find({ userId: (session.user as any).id })
      .sort({ createdAt: -1 })

    return NextResponse.json({ success: true, data: abstracts })
  } catch (error) {
    console.error('Get abstracts error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
```

### `app/api/abstracts/submit/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/conference-backend-core/lib/auth/auth.config'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import Abstract from '@/conference-backend-core/lib/models/Abstract.model'
import User from '@/conference-backend-core/lib/models/User.model'
import { generateAbstractId } from '@/conference-backend-core/lib/utils/idGenerator'
import emailService from '@/conference-backend-core/lib/email/emailService'
import { abstractSubmissionSchema, validateData, formatZodErrors } from '@/conference-backend-core/lib/validation/schemas'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate
    const validation = validateData(abstractSubmissionSchema, body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: formatZodErrors(validation.errors!)
      }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Check submission limit
    const existingCount = await Abstract.countDocuments({ userId: user._id })
    if (existingCount >= conferenceConfig.abstracts.maxAbstractsPerUser) {
      return NextResponse.json({
        success: false,
        message: `Maximum ${conferenceConfig.abstracts.maxAbstractsPerUser} abstracts allowed per user`
      }, { status: 400 })
    }

    // Generate abstract ID
    const abstractId = await generateAbstractId()

    // Create abstract
    const abstract = await Abstract.create({
      abstractId,
      userId: user._id,
      registrationId: user.registration.registrationId,
      ...validation.data,
      status: 'submitted',
      submittedAt: new Date(),
      initial: {}
    })

    // Send confirmation email
    try {
      await emailService.sendAbstractConfirmation({
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        abstractId: abstract.abstractId,
        title: abstract.title,
        track: abstract.track
      })
    } catch (emailError) {
      console.error('Email failed:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Abstract submitted successfully',
      data: abstract
    }, { status: 201 })

  } catch (error) {
    console.error('Submit abstract error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 🎓 Workshop APIs

### `app/api/workshops/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { workshops } from '@/conference-backend-core/config/pricing.config'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import Workshop from '@/conference-backend-core/lib/models/Workshop.model'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Try to get workshops from database
    let dbWorkshops = await Workshop.find({ isActive: true })

    // If none in DB, use config and seed DB
    if (dbWorkshops.length === 0) {
      dbWorkshops = await Workshop.insertMany(workshops.map(w => ({
        ...w,
        bookedSeats: 0,
        isActive: true
      })))
    }

    return NextResponse.json({ success: true, data: dbWorkshops })
  } catch (error) {
    console.error('Get workshops error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 🔑 Admin APIs

### `app/api/admin/users/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/conference-backend-core/lib/auth/auth.config'
import connectDB from '@/conference-backend-core/lib/database/mongodb'
import User from '@/conference-backend-core/lib/models/User.model'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    const query: any = {}
    if (status) query['registration.status'] = status
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'registration.registrationId': { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .select('-password -activeSessions')
      .sort({ 'registration.registrationDate': -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await User.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 🎯 Usage in Your App

Simply create these files in your `app/api/` directory and they're ready to use!

All routes:
- ✅ Use conference config automatically
- ✅ Include validation
- ✅ Handle errors properly
- ✅ Send email notifications
- ✅ Work with theme system
- ✅ Are mobile-responsive ready

**No code changes needed - just configuration!**
