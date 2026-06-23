#!/usr/bin/env node

/**
 * Comprehensive Database Seeding Script for ISSH Midterm CME 2026
 * Sets up admin, sample users, workshops, and test data
 * Run with: node scripts/seed-database.js
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

// Load environment variables from .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    }
  })
  console.log('📄 Loaded environment variables from .env.local')
} else {
  console.log('⚠️  No .env.local file found')
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/issh2026'

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  profile: {
    title: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: String,
    institution: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    dietaryRequirements: String,
    specialNeeds: String
  },
  registration: {
    registrationId: { type: String, unique: true, required: true },
    type: { 
      type: String, 
      enum: ['postgraduate', 'consultant', 'complimentary', 'sponsored'],
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending' 
    },
    membershipNumber: String,
    workshopSelections: [String],
    accompanyingPersons: [{
      name: String,
      age: Number,
      relationship: String,
      dietaryRequirements: String
    }],
    registrationDate: { type: Date, default: Date.now }
  },
  payment: {
    method: {
      type: String,
      enum: ['bank-transfer', 'online', 'cash'],
      default: 'bank-transfer'
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: function() { return this.payment != null; }
    },
    bankTransferUTR: String,
    transactionId: String,
    paymentDate: {
      type: Date,
      default: Date.now
    },
    verifiedBy: String,
    verificationDate: Date,
    remarks: String
  },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'reviewer'], 
    default: 'user' 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

// Workshop Schema (if you have workshops collection)
const WorkshopSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  price: { type: Number, required: true },
  maxSeats: { type: Number, default: 50 },
  availableSeats: { type: Number, default: 50 },
  canRegister: { type: Boolean, default: true },
  description: String,
  instructor: String,
  duration: String,
  date: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const Workshop = mongoose.models.Workshop || mongoose.model('Workshop', WorkshopSchema)

async function generateSampleData() {
  const sampleUsers = [
    {
      email: 'dr.smith@hospital.com',
      password: 'password123',
      profile: {
        title: 'Dr.',
        firstName: 'John',
        lastName: 'Smith',
        phone: '+91 9876543210',
        institution: 'Government Medical College',
        address: {
          street: '123 Hospital Road',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500001'
        }
      },
      registration: {
        registrationId: 'REG-' + Date.now() + '-001',
        type: 'consultant',
        status: 'confirmed',
        membershipNumber: 'ISSH12345'
      },
      payment: {
        method: 'bank-transfer',
        status: 'verified',
        amount: 5000,
        bankTransferUTR: '123456789012',
        paymentDate: new Date(),
        verifiedBy: 'admin@isshmidtermcme2026.com',
        verificationDate: new Date()
      }
    },
    {
      email: 'dr.patel@medcenter.com',
      password: 'password123',
      profile: {
        title: 'Dr.',
        firstName: 'Priya',
        lastName: 'Patel',
        phone: '+91 9876543211',
        institution: 'Private Medical Center',
        address: {
          street: '456 Medical Lane',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: '560001'
        }
      },
      registration: {
        registrationId: 'REG-' + Date.now() + '-002',
        type: 'consultant',
        status: 'pending'
      },
      payment: {
        method: 'bank-transfer',
        status: 'pending',
        amount: 5000,
        bankTransferUTR: '123456789013',
        paymentDate: new Date()
      }
    },
    {
      email: 'resident@hospital.com',
      password: 'password123',
      profile: {
        title: 'Dr.',
        firstName: 'Raj',
        lastName: 'Kumar',
        phone: '+91 9876543212',
        institution: 'Teaching Hospital',
        address: {
          street: '789 University Road',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500001'
        }
      },
      registration: {
        registrationId: 'REG-' + Date.now() + '-003',
        type: 'postgraduate',
        status: 'confirmed'
      },
      payment: {
        method: 'bank-transfer',
        status: 'verified',
        amount: 2500,
        bankTransferUTR: '123456789014',
        paymentDate: new Date(),
        verifiedBy: 'admin@isshmidtermcme2026.com',
        verificationDate: new Date()
      }
    }
  ]

  const sampleWorkshops = [
    {
      id: 'spine-surgery-basics',
      label: 'Spine Surgery Fundamentals',
      price: 2500,
      maxSeats: 30,
      availableSeats: 25,
      description: 'Introduction to basic spine surgery techniques',
      instructor: 'Dr. A.K. Reddy',
      duration: '4 hours',
      date: new Date('2026-02-06')
    },
    {
      id: 'advanced-arthroscopy',
      label: 'Advanced Arthroscopy Techniques',
      price: 3000,
      maxSeats: 25,
      availableSeats: 20,
      description: 'Advanced minimally invasive arthroscopic procedures',
      instructor: 'Dr. S. Krishnan',
      duration: '6 hours',
      date: new Date('2026-02-06')
    },
    {
      id: 'trauma-management',
      label: 'Trauma and Emergency Management',
      price: 2000,
      maxSeats: 40,
      availableSeats: 35,
      description: 'Emergency orthopaedic trauma management protocols',
      instructor: 'Dr. M. Sharma',
      duration: '3 hours',
      date: new Date('2026-02-07')
    }
  ]

  return { sampleUsers, sampleWorkshops }
}

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // 1. Create Admin User
    console.log('\n👨‍💼 Creating Admin User...')
    const adminData = {
      email: 'hello@purplehatevents.in',
      password: '1234567890',
      profile: {
        title: 'Dr.',
        firstName: 'Purple Hat',
        lastName: 'Events',
        phone: '+91 9052192744',
        institution: 'ISSH Midterm CME 2026',
        address: {
          street: 'HICC Novotel',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500001'
        }
      },
      registration: {
        registrationId: 'ADMIN-' + Date.now(),
        type: 'consultant',
        status: 'confirmed'
      },
      payment: {
        method: 'cash',
        status: 'verified',
        amount: 0,
        paymentDate: new Date(),
        verifiedBy: 'system',
        verificationDate: new Date(),
        remarks: 'Admin account - no payment required'
      },
      role: 'admin',
      isActive: true
    }

    const existingAdmin = await User.findOne({ email: adminData.email })
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminData.password, 12)
      adminData.password = hashedPassword
      await User.create(adminData)
      console.log('✅ Admin user created')
    } else {
      console.log('ℹ️  Admin user already exists')
    }

    // 2. Create Sample Users
    console.log('\n👥 Creating Sample Users...')
    const { sampleUsers, sampleWorkshops } = await generateSampleData()
    
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email })
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 12)
        userData.password = hashedPassword
        await User.create(userData)
        console.log(`✅ Created user: ${userData.email}`)
      } else {
        console.log(`ℹ️  User already exists: ${userData.email}`)
      }
    }

    // 3. Skip Workshop Creation (not needed for production)
    console.log('\n🎓 Skipping Sample Workshops (not required)...')

    // 4. Database Statistics
    console.log('\n📊 Database Statistics:')
    const userCount = await User.countDocuments()
    const adminCount = await User.countDocuments({ role: 'admin' })
    const confirmedRegistrations = await User.countDocuments({ 'registration.status': 'confirmed' })
    const pendingRegistrations = await User.countDocuments({ 'registration.status': 'pending' })
    console.log(`   Total Users: ${userCount}`)
    console.log(`   Admin Users: ${adminCount}`)
    console.log(`   Confirmed Registrations: ${confirmedRegistrations}`)
    console.log(`   Pending Registrations: ${pendingRegistrations}`)

    console.log('\n🚀 Admin Access:')
    console.log('   URL: http://localhost:3001/admin')
    console.log('   Email: hello@purplehatevents.in')
    console.log('   Password: 1234567890')

    console.log('\n📋 What has been seeded:')
    console.log('   ✅ Admin user with requested credentials')
    console.log('   ✅ Sample registered users (3 users)')
    console.log('   ✅ Proper ISSH registration types (postgraduate, consultant)')
    console.log('   ✅ Various registration statuses (pending, confirmed)')
    console.log('   ✅ Various payment statuses (pending, verified)')
    console.log('   ✅ Bank transfer UTR examples')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the script
if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase }
