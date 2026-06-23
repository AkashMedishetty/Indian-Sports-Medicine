#!/usr/bin/env node

/**
 * Assign All Abstracts to the Reviewer
 * Run with: node scripts/assign-abstracts-to-reviewer.js
 */

const mongoose = require('mongoose')
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

// Abstract Schema
const AbstractFileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSizeBytes: { type: Number, required: true },
  storagePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
})

const AbstractSchema = new mongoose.Schema({
  abstractId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  registrationId: { type: String, required: true, index: true },

  track: { type: String, required: true },
  category: { type: String },
  subcategory: { type: String },

  title: { type: String, required: true },
  authors: { type: [String], default: [] },
  keywords: { type: [String], default: [] },
  wordCount: { type: Number },

  status: { 
    type: String, 
    enum: ['submitted', 'under-review', 'accepted', 'rejected', 'final-submitted'],
    default: 'submitted' 
  },
  submittedAt: { type: Date, default: Date.now },

  initial: {
    file: AbstractFileSchema,
    notes: { type: String }
  },

  final: {
    file: AbstractFileSchema,
    submittedAt: { type: Date },
    displayId: { type: String },
    notes: { type: String }
  },

  averageScore: { type: Number },
  decisionAt: { type: Date },
  assignedReviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }]
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Abstract = mongoose.models.Abstract || mongoose.model('Abstract', AbstractSchema)

async function assignAbstractsToReviewer() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    console.log(`📍 MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`)
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find the reviewer
    console.log('\n🔍 Finding reviewer...')
    const reviewer = await User.findOne({ 
      email: 'reviewer@isshmidtermcme2026.com',
      role: 'reviewer' 
    })

    if (!reviewer) {
      console.log('❌ Reviewer not found! Please run the seed-reviewer script first.')
      process.exit(1)
    }

    console.log(`✅ Found reviewer: ${reviewer.profile.firstName} ${reviewer.profile.lastName}`)
    console.log(`   ID: ${reviewer._id}`)

    // Find all abstracts that are not assigned to any reviewer
    console.log('\n📋 Finding unassigned abstracts...')
    const unassignedAbstracts = await Abstract.find({
      $or: [
        { assignedReviewerIds: { $exists: false } },
        { assignedReviewerIds: { $size: 0 } },
        { assignedReviewerIds: { $ne: reviewer._id } }
      ],
      status: { $in: ['submitted', 'under-review'] }
    })

    console.log(`📊 Found ${unassignedAbstracts.length} unassigned abstracts`)

    if (unassignedAbstracts.length === 0) {
      console.log('ℹ️  All abstracts are already assigned to reviewers')
      
      // Show current assignments
      const allAbstracts = await Abstract.find({}, 'abstractId title assignedReviewerIds')
      console.log('\n📋 Current Abstract Assignments:')
      for (const abstract of allAbstracts) {
        const isAssigned = abstract.assignedReviewerIds && abstract.assignedReviewerIds.includes(reviewer._id)
        console.log(`   ${abstract.abstractId}: ${abstract.title.substring(0, 50)}... ${isAssigned ? '✅ Assigned' : '❌ Not Assigned'}`)
      }
    } else {
      // Assign all unassigned abstracts to the reviewer
      console.log('\n🔄 Assigning abstracts to reviewer...')
      
      for (const abstract of unassignedAbstracts) {
        // Add reviewer to assignedReviewerIds if not already present
        if (!abstract.assignedReviewerIds) {
          abstract.assignedReviewerIds = []
        }
        
        if (!abstract.assignedReviewerIds.includes(reviewer._id)) {
          abstract.assignedReviewerIds.push(reviewer._id)
          await abstract.save()
          console.log(`   ✅ Assigned: ${abstract.abstractId} - ${abstract.title.substring(0, 50)}...`)
        }
      }

      console.log(`\n🎉 Successfully assigned ${unassignedAbstracts.length} abstracts to reviewer!`)
    }

    // Final statistics
    console.log('\n📊 Final Statistics:')
    const totalAbstracts = await Abstract.countDocuments()
    const assignedToReviewer = await Abstract.countDocuments({
      assignedReviewerIds: reviewer._id
    })

    console.log(`   Total Abstracts: ${totalAbstracts}`)
    console.log(`   Assigned to Reviewer: ${assignedToReviewer}`)
    console.log(`   Assignment Rate: ${totalAbstracts > 0 ? Math.round((assignedToReviewer / totalAbstracts) * 100) : 0}%`)

    console.log('\n🚀 Reviewer can now access abstracts at:')
    console.log('   URL: http://localhost:3000/reviewer')
    console.log('   Email: reviewer@isshmidtermcme2026.com')
    console.log('   Password: 1234567890')

  } catch (error) {
    console.error('❌ Error assigning abstracts:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the script
if (require.main === module) {
  assignAbstractsToReviewer()
}

module.exports = { assignAbstractsToReviewer }
