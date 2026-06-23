const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (key && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
  console.log('✅ Loaded environment variables from .env.local')
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/issh2026'
console.log('📡 Connecting to MongoDB...')

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db()

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...')
    await db.collection('users').deleteMany({})
    await db.collection('payment_config').deleteMany({})
    await db.collection('pricing_tiers').deleteMany({})
    await db.collection('payments').deleteMany({})
    await db.collection('abstracts').deleteMany({})
    await db.collection('registrations').deleteMany({})
    await db.collection('reviews').deleteMany({})
    console.log('✅ Cleared: users, payment_config, pricing_tiers, payments, abstracts, registrations, reviews')

    // Update email configuration
    console.log('\n📧 Updating Email Configuration...')
    await db.collection('configurations').updateOne(
      { key: 'email_settings' },
      {
        $set: {
          'value.fromName': 'ISSH Midterm CME 2026',
          'value.fromEmail': 'contact@isshmidtermcme2026.com',
          'value.replyTo': 'contact@isshmidtermcme2026.com',
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    console.log('✅ Email configuration updated to ISSH 2026')

    // 1. Seed Admin User
    console.log('\n👤 Seeding Admin User...')
    const adminPassword = await bcrypt.hash('1234567890', 12)
    await db.collection('users').insertOne({
      email: 'hello@purplehatevents.in',
      password: adminPassword,
      role: 'admin',
      profile: {
        firstName: 'PurpleHat',
        lastName: 'Events',
        title: 'Mr.',
        phone: '9999999999'
      },
      activeSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: true,
      isActive: true
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
      activeSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: true,
      isActive: true
    })
    console.log('✅ Reviewer user created: reviewer@purplehatevents.in / 1234567890')

    // 3. Registration Types — stored in conference.config.ts
    console.log('\n📋 Registration Types: Stored in conference.config.ts (manage via admin panel)')

    // 4. Workshops — configure via admin panel
    console.log('\n📚 Workshops: Skipped (configure via admin panel)')

    // 5. Seed Payment Configuration (legacy)
    console.log('\n💳 Seeding Payment Configuration...')
    await db.collection('payment_config').insertOne({
      type: 'main',
      config: {
        bankTransfer: {
          enabled: true,
          accountName: 'ISSH Midterm CME 2026',
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          branch: 'Hyderabad Main Branch',
          upiId: 'issh2026@upi',
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

    // Also seed the configurations collection (used by the new API)
    await db.collection('configurations').deleteMany({ type: 'payment', key: 'methods' })
    await db.collection('configurations').insertOne({
      type: 'payment',
      key: 'methods',
      value: {
        gateway: false,
        bankTransfer: true,
        externalRedirect: false,
        externalRedirectUrl: '',
        bankDetails: {
          accountName: 'ISSH Midterm CME 2026',
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          branch: 'Hyderabad Main Branch',
          qrCodeUrl: ''
        }
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log('✅ Payment configuration created')

    // 6. Seed Pricing Tiers — ISSH 2026 categories
    console.log('\n💰 Seeding Pricing Tiers...')
    const pricingTiers = [
      {
        name: 'Early Bird',
        code: 'EARLYBIRD',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2026-03-15'),
        discount: 0,
        active: true,
        categories: {
          'issh-member':      { amount: 5000, currency: 'INR', label: 'ISSH Member' },
          'non-issh-member':  { amount: 6000, currency: 'INR', label: 'Non ISSH Member' },
          'postgraduate':     { amount: 2500, currency: 'INR', label: 'Postgraduate' },
          'accompanying':     { amount: 3000, currency: 'INR', label: 'Accompanying Person/Spouse' }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Regular',
        code: 'REGULAR',
        startDate: new Date('2026-03-16'),
        endDate: new Date('2026-04-24'),
        discount: 0,
        active: true,
        categories: {
          'issh-member':      { amount: 6000, currency: 'INR', label: 'ISSH Member' },
          'non-issh-member':  { amount: 7000, currency: 'INR', label: 'Non ISSH Member' },
          'postgraduate':     { amount: 3000, currency: 'INR', label: 'Postgraduate' },
          'accompanying':     { amount: 3500, currency: 'INR', label: 'Accompanying Person/Spouse' }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Spot Registration',
        code: 'SPOT',
        startDate: new Date('2026-04-25'),
        endDate: new Date('2026-04-26'),
        discount: 0,
        active: true,
        categories: {
          'issh-member':      { amount: 7000, currency: 'INR', label: 'ISSH Member' },
          'non-issh-member':  { amount: 8000, currency: 'INR', label: 'Non ISSH Member' },
          'postgraduate':     { amount: 3500, currency: 'INR', label: 'Postgraduate' },
          'accompanying':     { amount: 4000, currency: 'INR', label: 'Accompanying Person/Spouse' }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    await db.collection('pricing_tiers').insertMany(pricingTiers)
    console.log(`✅ Created ${pricingTiers.length} pricing tiers`)

    // 7. Seed Abstracts Configuration (disabled for ISSH — enable via admin panel if needed)
    console.log('\n📝 Seeding Abstracts Configuration...')
    await db.collection('configurations').deleteMany({ type: 'abstracts', key: 'settings' })
    await db.collection('configurations').insertOne({
      type: 'abstracts',
      key: 'settings',
      value: {
        submittingForOptions: [
          { key: 'hand-surgery', label: 'Hand Surgery', enabled: true },
          { key: 'wrist-surgery', label: 'Wrist Surgery', enabled: true }
        ],
        submissionCategories: [
          { key: 'free-paper', label: 'Free Paper', enabled: true },
          { key: 'e-poster', label: 'E-Poster', enabled: true }
        ],
        topicsBySpecialty: {
          'hand-surgery': [
            'Hand Trauma',
            'Tendon Surgery',
            'Nerve Surgery',
            'Microsurgery',
            'Congenital Hand',
            'Rheumatoid Hand',
            'Tumors',
            'Miscellaneous'
          ],
          'wrist-surgery': [
            'Wrist Fractures',
            'Wrist Arthroscopy',
            'Carpal Instability',
            'DRUJ Disorders',
            'Wrist Arthroplasty',
            'Miscellaneous'
          ]
        },
        tracks: [
          { key: 'free-paper', label: 'Free Paper', enabled: true },
          { key: 'e-poster', label: 'E-Poster', enabled: true }
        ],
        topics: [],
        submissionWindow: {
          start: new Date('2025-10-01').toISOString(),
          end: new Date('2026-03-31').toISOString(),
          enabled: false
        },
        guidelines: {
          general: 'ISSH Midterm CME 2026 - Abstract Submission Guidelines\n\nAbstracts should be submitted through the conference website.\nAll abstracts must be original, unpublished work.\nMaximum 250 words.\nUpload as Word document (.doc or .docx).',
          freePaper: {
            enabled: true,
            title: 'Free Paper Guidelines',
            wordLimit: 250,
            requirements: [
              'Abstract must be original and unpublished work',
              'Maximum 250 words',
              'Upload as Word document (.doc or .docx)',
              'Include title, authors, and affiliations'
            ],
            format: ''
          },
          poster: {
            enabled: true,
            title: 'E-Poster Guidelines',
            wordLimit: 250,
            requirements: [
              'E-poster displayed on standard LCD',
              'PowerPoint format (.ppt or .pptx)',
              'Maximum 10 MB file size',
              'Landscape format, 16:9 ratio'
            ],
            format: ''
          }
        },
        maxAbstractsPerUser: 5,
        assignmentPolicy: 'load-based',
        reviewersPerAbstractDefault: 2,
        allowedInitialFileTypes: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        allowedFinalFileTypes: [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ],
        maxFileSizeMB: 10
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log('✅ Abstracts configuration created (submissions disabled — enable via admin panel)')

    // 8. Seed Age Exemptions Configuration
    console.log('\n👴 Seeding Age Exemptions Configuration...')
    await db.collection('configurations').deleteMany({ type: 'pricing', key: 'age_exemptions' })
    await db.collection('configurations').insertOne({
      type: 'pricing',
      key: 'age_exemptions',
      value: {
        senior_citizen_enabled: true,
        senior_citizen_age: 70,
        senior_citizen_category: 'all',
        children_under_age: 10
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log('✅ Age exemptions: seniors 70+ free, children under 10 free')

    // 9. Create indexes
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
    console.log('   - Workshops: Configure via admin panel')
    console.log(`   - Pricing Tiers: ${pricingTiers.length} (Early Bird / Regular / Spot)`)
    console.log('   - Payment Config: Bank transfer enabled')
    console.log('   - Abstracts: Hand & Wrist Surgery (submissions disabled)')
    console.log('   - Age Exemptions: Seniors 70+ free, children under 10 free')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await client.close()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error)
    process.exit(1)
  })
