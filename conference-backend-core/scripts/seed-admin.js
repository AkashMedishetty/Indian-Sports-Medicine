#!/usr/bin/env node

/**
 * Script to create admin user for ISSH Midterm CME 2026 Conference Platform
 * Run with: node scripts/seed-admin.js
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
console.log('🔗 Using MongoDB URI:', MONGODB_URI.substring(0, 20) + '...')

// User Schema (matching the current application schema)
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

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Admin user details as requested
    const adminData = {
      email: 'hello@purplehatevents.in',
      password: '1234567890',
      profile: {
        title: 'Dr.',
        firstName: 'Purple Hat',
        lastName: 'Events',
        phone: '+91 9052192744',
        institution: 'Purple Hat Events',
        address: {
          street: 'Event Management Office',
          city: 'Kurnool',
          state: 'Andhra Pradesh',
          country: 'India',
          pincode: '518002'
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

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email })
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', adminData.email)
      
      // Update role to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin'
        await existingAdmin.save()
        console.log('✅ Updated existing user to admin role')
      }
      
      // Update password if different
      const isPasswordValid = await bcrypt.compare(adminData.password, existingAdmin.password)
      if (!isPasswordValid) {
        const hashedPassword = await bcrypt.hash(adminData.password, 12)
        existingAdmin.password = hashedPassword
        await existingAdmin.save()
        console.log('✅ Updated admin password')
      }
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 12)
      adminData.password = hashedPassword

      // Create admin user
      const adminUser = await User.create(adminData)
      console.log('✅ Admin user created successfully!')
    }

    console.log('\n🚀 Admin account details:')
    console.log('   URL: http://localhost:3001/admin')
    console.log('   Email: hello@purplehatevents.in')
    console.log('   Password: 1234567890')
    console.log('\n✅ Admin user is ready for use!')

    // Check database statistics
    const userCount = await User.countDocuments()
    const adminCount = await User.countDocuments({ role: 'admin' })
    const registrationCount = await User.countDocuments({ role: 'user' })
    
    console.log('\n📊 Database Statistics:')
    console.log(`   Total Users: ${userCount}`)
    console.log(`   Admin Users: ${adminCount}`)
    console.log(`   Regular Registrations: ${registrationCount}`)

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the script
if (require.main === module) {
  seedAdmin()
}

module.exports = { seedAdmin }
