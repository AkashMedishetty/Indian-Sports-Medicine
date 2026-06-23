#!/usr/bin/env node

/**
 * Create Sample Reviewer for Testing
 * Run with: node scripts/seed-reviewer.js
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

// Load environment variables from .env files
function loadEnvFile(filePath, fileName) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf8')
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          process.env[key.trim()] = value
        }
      }
    })
    console.log(`📄 Loaded environment variables from ${fileName}`)
    return true
  }
  return false
}

// Try to load environment variables from multiple sources
const envLocalPath = path.join(__dirname, '..', '.env.local')
const envPath = path.join(__dirname, '..', '.env')

let envLoaded = false
envLoaded = loadEnvFile(envLocalPath, '.env.local') || envLoaded
envLoaded = loadEnvFile(envPath, '.env') || envLoaded

if (!envLoaded) {
  console.log('⚠️  No .env or .env.local file found, using default values')
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
    }
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
    }
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
    amount: Number,
    paymentDate: Date,
    verifiedBy: String,
    verificationDate: Date
  },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'reviewer'], 
    default: 'user' 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function createReviewer() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    console.log(`📍 MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`) // Hide credentials in logs
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Create Sample Reviewer
    console.log('\n👨‍⚕️ Creating Sample Reviewer...')
    const reviewerData = {
      email: 'reviewer@isshmidtermcme2026.com',
      password: '1234567890',
      profile: {
        title: 'Dr.',
        firstName: 'Abstract',
        lastName: 'Reviewer',
        phone: '+91 9876543220',
        institution: 'ISSH Midterm CME 2026 Review Committee',
        address: {
          street: 'HICC Novotel',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500081'
        }
      },
      registration: {
        registrationId: 'REVIEWER-' + Date.now(),
        type: 'consultant',
        status: 'confirmed'
      },
      payment: {
        method: 'cash',
        status: 'verified',
        amount: 0,
        paymentDate: new Date(),
        verifiedBy: 'system',
        verificationDate: new Date()
      },
      role: 'reviewer',
      isActive: true
    }

    const existingReviewer = await User.findOne({ email: reviewerData.email })
    if (!existingReviewer) {
      const hashedPassword = await bcrypt.hash(reviewerData.password, 12)
      reviewerData.password = hashedPassword
      await User.create(reviewerData)
      console.log('✅ Sample reviewer created')
    } else {
      console.log('ℹ️  Sample reviewer already exists')
    }

    // Check for existing reviewers
    console.log('\n📊 Reviewer Statistics:')
    const reviewerCount = await User.countDocuments({ role: 'reviewer' })
    const allReviewers = await User.find({ role: 'reviewer' }, 'email profile.firstName profile.lastName')
    
    console.log(`   Total Reviewers: ${reviewerCount}`)
    if (allReviewers.length > 0) {
      console.log('   Existing Reviewers:')
      allReviewers.forEach(reviewer => {
        console.log(`   - ${reviewer.profile.firstName} ${reviewer.profile.lastName} (${reviewer.email})`)
      })
    }

    console.log('\n🚀 Reviewer Access:')
    console.log('   URL: http://localhost:3000/admin')
    console.log('   Email: reviewer@isshmidtermcme2026.com')
    console.log('   Password: 1234567890')

    console.log('\n📋 Sample Reviewer Created:')
    console.log('   ✅ Email: reviewer@isshmidtermcme2026.com')
    console.log('   ✅ Password: 1234567890')
    console.log('   ✅ Role: reviewer')
    console.log('   ✅ Registration completed')
    console.log('   ✅ Ready to review abstracts')

  } catch (error) {
    console.error('❌ Error creating reviewer:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the script
if (require.main === module) {
  createReviewer()
}

module.exports = { createReviewer }
