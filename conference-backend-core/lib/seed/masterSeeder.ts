/**
 * Master Seeder
 * Orchestrates all seeding operations
 */

import { ConferenceConfig } from '../../config/conference.config'
import { seedPricingTiers, seedWorkshops, seedAccompanyingPerson } from './pricingSeeder'
import { seedAllUsers } from './adminSeeder'

export async function seedAll(config: ConferenceConfig) {
  console.log('🌱 Starting database seeding...\n')
  
  try {
    // 1. Pricing Tiers
    console.log('1/4 Seeding pricing tiers...')
    await seedPricingTiers(config)
    
    // 2. Workshops
    console.log('2/4 Seeding workshops...')
    await seedWorkshops(config)
    
    // 3. Accompanying Person
    console.log('3/4 Seeding accompanying person config...')
    await seedAccompanyingPerson(config)
    
    // 4. Admin & Reviewer Users
    console.log('4/4 Creating admin & reviewer users...')
    await seedAllUsers(config)
    
    console.log('\n✅ Database seeding complete!\n')
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    throw error
  }
}

export default seedAll
