#!/usr/bin/env node

/**
 * Conference Initialization Script
 * One command to set up everything!
 * 
 * Usage: npm run init-conference
 */

import mongoose from 'mongoose'
import readline from 'readline'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// ES Module directory resolution
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve))
}

async function initConference() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                                                            ║')
  console.log('║        🎯 CONFERENCE SYSTEM INITIALIZATION                ║')
  console.log('║                                                            ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')
  
  // Check environment
  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI not found in .env.local')
    console.log('\n📝 Please create .env.local file with:')
    console.log('   MONGODB_URI=mongodb://localhost:27017/your-conference-db')
    console.log('   NEXTAUTH_SECRET=your-secret-key')
    console.log('   NEXTAUTH_URL=http://localhost:3000\n')
    process.exit(1)
  }
  
  try {
    // Load conference config
    console.log('📋 Loading conference configuration...')
    
    const { conferenceConfig } = await import('../conference-backend-core/config/conference.config.js')
    
    console.log(`\n   Conference: ${conferenceConfig.name}`)
    console.log(`   Organization: ${conferenceConfig.organizationName}`)
    console.log(`   Date: ${conferenceConfig.eventDate.start} to ${conferenceConfig.eventDate.end}`)
    console.log(`   Venue: ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}\n`)
    
    // Connect to database
    console.log('📡 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to database\n')
    
    // Check if already initialized
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }
    
    const configCount = await mongoose.connection.db
      .collection('configurations').countDocuments()
    
    if (configCount > 0) {
      console.log('⚠️  Database already contains configuration data.')
      const answer = await ask('   Reset and reinitialize? (yes/no): ')
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Initialization cancelled\n')
        rl.close()
        await mongoose.disconnect()
        process.exit(0)
      }
      
      console.log('\n🗑️  Clearing existing configuration...')
      await mongoose.connection.db.collection('configurations').deleteMany({})
      console.log('✅ Configuration cleared\n')
    }
    
    // Import seeders
    const { seedPricingTiers, seedWorkshops, seedAccompanyingPerson } = 
      await import('../conference-backend-core/lib/seed/pricingSeeder.js')
    
    // Seed database
    console.log('🌱 Seeding database...\n')
    
    console.log('   1/4 Seeding pricing tiers...')
    await seedPricingTiers(conferenceConfig)
    
    console.log('   2/4 Seeding workshops...')
    await seedWorkshops(conferenceConfig)
    
    console.log('   3/4 Seeding accompanying person config...')
    await seedAccompanyingPerson(conferenceConfig)
    
    console.log('   4/4 Creating admin & reviewer users...')
    
    // Import admin seeder
    const { seedAllUsers } = await import('../conference-backend-core/lib/seed/adminSeeder.js')
    await seedAllUsers(conferenceConfig)
    
    console.log('\n   📋 Login Credentials:')
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('   👤 Admin:    hello@purplehatevents.in / 1234567890')
    console.log('   👤 Reviewer: reviewer@purplehatevents.in / 1234567890')
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // Generate API wrappers
    console.log('\n🔧 Generating API route wrappers...')
    const { generateAllWrappers } = await import('./generate-all-wrappers.js')
    await generateAllWrappers()
    
    // Create directories
    console.log('\n📁 Creating directory structure...')
    const dirs = [
      'public/uploads/photos',
      'public/uploads/abstracts',
      'public/uploads/documents',
      'public/certificates',
      'public/badges',
      'public/invoices'
    ]
    
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir)
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`   ✓ ${dir}`)
    })
    
    console.log('\n')
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║                                                            ║')
    console.log('║              🎉 INITIALIZATION COMPLETE!                  ║')
    console.log('║                                                            ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('\n')
    console.log('📋 Next Steps:')
    console.log('   1. Start dev server:    npm run dev')
    console.log('   2. Admin Panel:         http://localhost:3000/admin')
    console.log('   3. Login:               hello@purplehatevents.in / 1234567890')
    console.log('   4. Reviewer Portal:     http://localhost:3000/reviewer')
    console.log('   5. Login:               reviewer@purplehatevents.in / 1234567890')
    console.log('\n✨ Your conference system is ready!\n')
    
  } catch (error: any) {
    console.error('\n❌ Initialization failed:', error.message)
    console.error(error)
  } finally {
    rl.close()
    await mongoose.disconnect()
    process.exit(0)
  }
}

// Run initialization
initConference()
