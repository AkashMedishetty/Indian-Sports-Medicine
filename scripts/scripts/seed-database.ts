import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neurovascon2026'

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db()
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\n🗑️  Clearing existing data...')
    await db.collection('users').deleteMany({})
    await db.collection('workshops').deleteMany({})
    await db.collection('payment_config').deleteMany({})
    await db.collection('pricing_tiers').deleteMany({})
    
    // 1. Seed Admin User
    console.log('\n👤 Seeding Admin User...')
    const adminPassword = await bcrypt.hash('1234567890', 12)
    await db.collection('users').insertOne({
      email: 'hello@purplehatevents.in',
      password: adminPassword,
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        title: 'Mr.',
        phone: '9999999999'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: true
    })
    console.log('✅ Admin user created: hello@purplehatevents.in / 1234567890')
    
    // 2. Seed Reviewer User
    console.log('\n👤 Seeding Reviewer User...')
    const reviewerPassword = await bcrypt.hash('1234567890', 12)
    await db.collection('users').insertOne({
      email: 'reviewer@purplehatevents.in',
      password: reviewerPassword,
      role: 'reviewer',
      profile: {
        firstName: 'Reviewer',
        lastName: 'User',
        title: 'Dr.',
        phone: '8888888888'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: true
    })
    console.log('✅ Reviewer user created: reviewer@purplehatevents.in / 1234567890')
    
    // 3. Seed Workshops
    console.log('\n📚 Seeding Workshops...')
    const workshops = [
      {
        id: 'workshop-1',
        name: 'Advanced Neurovascular Techniques',
        price: 5000,
        maxSeats: 50,
        availableSeats: 50,
        instructor: 'Dr. Rajesh Kumar',
        description: 'Learn advanced techniques in neurovascular surgery',
        canRegister: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'workshop-2',
        name: 'Endovascular Interventions',
        price: 6000,
        maxSeats: 40,
        availableSeats: 40,
        instructor: 'Dr. Priya Sharma',
        description: 'Hands-on training in endovascular procedures',
        canRegister: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'workshop-3',
        name: 'Stroke Management Workshop',
        price: 4500,
        maxSeats: 60,
        availableSeats: 60,
        instructor: 'Dr. Amit Patel',
        description: 'Comprehensive stroke management protocols',
        canRegister: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    await db.collection('workshops').insertMany(workshops)
    console.log(`✅ Created ${workshops.length} workshops`)
    
    // 4. Seed Payment Configuration
    console.log('\n💳 Seeding Payment Configuration...')
    await db.collection('payment_config').insertOne({
      type: 'main',
      config: {
        bankTransfer: {
          enabled: true,
          accountName: 'NeuroVascon 2026',
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          branch: 'Mumbai Main Branch',
          upiId: 'neurovascon@sbi',
          instructions: 'Please transfer the registration fee to the account mentioned above and enter the UTR number in the registration form. Your registration will be confirmed once the payment is verified.'
        },
        razorpay: {
          enabled: false,
          keyId: '',
          keySecret: ''
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log('✅ Payment configuration created')
    
    // 5. Seed Pricing Tiers (for early bird, etc.)
    console.log('\n💰 Seeding Pricing Tiers...')
    const pricingTiers = [
      {
        name: 'Early Bird',
        code: 'EARLY2026',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-03-31'),
        discount: 20, // 20% discount
        active: true,
        categories: {
          'cvsi-member': 8000,
          'non-member': 12000,
          'international': 300, // USD
          'pg-student': 5000
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Regular',
        code: 'REGULAR2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-12-31'),
        discount: 0,
        active: true,
        categories: {
          'cvsi-member': 10000,
          'non-member': 15000,
          'international': 400, // USD
          'pg-student': 6000
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    await db.collection('pricing_tiers').insertMany(pricingTiers)
    console.log(`✅ Created ${pricingTiers.length} pricing tiers`)
    
    // 6. Create indexes for better performance
    console.log('\n📊 Creating indexes...')
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('workshops').createIndex({ id: 1 }, { unique: true })
    await db.collection('registrations').createIndex({ 'registration.registrationId': 1 }, { unique: true })
    await db.collection('registrations').createIndex({ email: 1 })
    await db.collection('registrations').createIndex({ 'registration.status': 1 })
    console.log('✅ Indexes created')
    
    console.log('\n✨ Database seeding completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   - Admin: hello@purplehatevents.in / 1234567890')
    console.log('   - Reviewer: reviewer@purplehatevents.in / 1234567890')
    console.log(`   - Workshops: ${workshops.length}`)
    console.log(`   - Pricing Tiers: ${pricingTiers.length}`)
    console.log('   - Payment Config: Configured')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await client.close()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error)
    process.exit(1)
  })
