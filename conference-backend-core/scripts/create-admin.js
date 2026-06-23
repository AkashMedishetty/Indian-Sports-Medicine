#!/usr/bin/env node

/**
 * Script to create an admin user for the ISCSGCON 2026 Conference Platform
 * Run with: node scripts/create-admin.js
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
// Simple registration ID generator
function generateRegistrationId() {
  return 'ADMIN-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iscsgcon2026'

// User Schema (simplified for script)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  profile: {
    title: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    institution: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    }
  },
  registration: {
    registrationId: { type: String, unique: true, required: true },
    type: { type: String, required: true },
    status: { type: String, default: 'paid' }
  },
  role: { type: String, enum: ['user', 'admin', 'reviewer'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Admin user details
    const adminData = {
      email: 'admin@iscsgcon2026hyderabad.com',
      password: 'admin123456', // Change this!
      profile: {
        title: 'Dr.',
        firstName: 'ISCSG',
        lastName: 'Admin',
        phone: '+91 9000000000',
        institution: 'ISCSGCON 2026',
        address: {
          street: 'Taj Deccan',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500001'
        }
      },
      registration: {
        registrationId: 'ADMIN-' + Date.now(),
        type: 'consultant',
        status: 'paid'
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
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 12)
      adminData.password = hashedPassword

      // Create admin user
      const adminUser = await User.create(adminData)
      console.log('✅ Admin user created successfully!')
      console.log('📧 Email:', adminData.email)
      console.log('🔑 Password: admin123456 (CHANGE THIS!)')
      console.log('🔗 Access: http://localhost:3001/admin')
    }

    console.log('\n🚀 Admin panel access:')
    console.log('   URL: http://localhost:3001/admin')
    console.log('   Email: admin@iscsgcon2026hyderabad.com')
    console.log('   Password: admin123456')
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!')

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the script
createAdmin()