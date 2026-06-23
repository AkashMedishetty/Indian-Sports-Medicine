/**
 * Admin and Reviewer User Seeder
 */

import bcrypt from 'bcryptjs'
import User from '../models/User'
import { ConferenceConfig } from '../../config/conference.config'

export async function seedAdminUser(config: ConferenceConfig) {
  try {
    const adminEmail = 'hello@purplehatevents.in'
    const adminPassword = '1234567890'
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail })
    
    if (existingAdmin) {
      console.log('   ℹ️  Admin user already exists')
      return existingAdmin
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      password: hashedPassword,
      profile: {
        title: 'Mr.',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+91-9999999999',
        designation: 'System Administrator',
        institution: config.organizationName,
        address: {
          street: config.venue.address || '',
          city: config.venue.city,
          state: config.venue.state,
          country: config.venue.country,
          pincode: config.venue.pincode || '000000'
        }
      },
      registration: {
        registrationId: 'ADMIN-001',
        type: 'complimentary',
        status: 'paid',
        registrationDate: new Date()
      },
      role: 'admin',
      isEmailVerified: true
    })
    
    console.log(`   ✅ Admin created: ${adminEmail}`)
    return admin
    
  } catch (error) {
    console.error('   ❌ Error creating admin:', error)
    throw error
  }
}

export async function seedReviewerUser(config: ConferenceConfig) {
  try {
    const reviewerEmail = 'reviewer@purplehatevents.in'
    const reviewerPassword = '1234567890'
    
    // Check if reviewer exists
    const existingReviewer = await User.findOne({ email: reviewerEmail })
    
    if (existingReviewer) {
      console.log('   ℹ️  Reviewer user already exists')
      return existingReviewer
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(reviewerPassword, 12)
    
    // Create reviewer user
    const reviewer = await User.create({
      email: reviewerEmail,
      password: hashedPassword,
      profile: {
        title: 'Dr.',
        firstName: 'Reviewer',
        lastName: 'User',
        phone: '+91-9999999998',
        designation: 'Abstract Reviewer',
        institution: config.organizationName,
        address: {
          street: config.venue.address || '',
          city: config.venue.city,
          state: config.venue.state,
          country: config.venue.country,
          pincode: config.venue.pincode || '000000'
        }
      },
      registration: {
        registrationId: 'REVIEWER-001',
        type: 'complimentary',
        status: 'paid',
        registrationDate: new Date()
      },
      role: 'reviewer',
      isEmailVerified: true
    })
    
    console.log(`   ✅ Reviewer created: ${reviewerEmail}`)
    return reviewer
    
  } catch (error) {
    console.error('   ❌ Error creating reviewer:', error)
    throw error
  }
}

export async function seedAllUsers(config: ConferenceConfig) {
  const admin = await seedAdminUser(config)
  const reviewer = await seedReviewerUser(config)
  
  return { admin, reviewer }
}
