#!/usr/bin/env node

/**
 * Reset Database Script
 * Clears all configuration and re-seeds
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function resetDatabase() {
  console.log('\n⚠️  DATABASE RESET')
  console.log('═'.repeat(60))
  console.log()
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI not found in .env.local')
    process.exit(1)
  }
  
  try {
    console.log('📡 Connecting to database...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected\n')
    
    console.log('🗑️  Clearing collections...')
    
    const collections = await mongoose.connection.db.listCollections().toArray()
    
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({})
      console.log(`   ✓ Cleared: ${collection.name}`)
    }
    
    console.log('\n✅ Database reset complete!')
    console.log('\n💡 Run: npm run init-conference to reseed\n')
    
  } catch (error) {
    console.error('\n❌ Reset failed:', error.message)
    console.error(error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

resetDatabase()
