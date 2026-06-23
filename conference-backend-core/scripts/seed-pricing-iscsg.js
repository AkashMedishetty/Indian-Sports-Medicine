const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')

// Load env from .env.local if present
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k] = v.join('=').trim().replace(/^["']|["']$/g, '')
  }
}

const configurationSchema = new mongoose.Schema({
  type: String,
  key: String,
  value: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: 'system' },
}, { timestamps: true })

const Configuration = mongoose.models.Configuration || mongoose.model('Configuration', configurationSchema)

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI not set')
    process.exit(1)
  }
  await mongoose.connect(uri)

  // Pricing tiers for ISSH Midterm CME 2026
  const pricing_tiers = {
    earlyBird: {
      name: 'Early Bird Registration', isActive: true,
      startDate: '2025-10-01',
      endDate: '2026-01-31',
      categories: {
        'postgraduate': { amount: 2500, currency: 'INR', label: 'Postgraduate / Resident' },
        'consultant': { amount: 5000, currency: 'INR', label: 'Consultant / Practicing Surgeon' }
      }
    },
    regular: {
      name: 'Regular Registration', isActive: true,
      startDate: '2026-02-01',
      endDate: '2026-04-20',
      categories: {
        'postgraduate': { amount: 2500, currency: 'INR', label: 'Postgraduate / Resident' },
        'consultant': { amount: 5000, currency: 'INR', label: 'Consultant / Practicing Surgeon' }
      }
    },
    onsite: {
      name: 'Spot Registration', isActive: true,
      startDate: '2026-04-21',
      endDate: '2026-04-26',
      categories: {
        'postgraduate': { amount: 2500, currency: 'INR', label: 'Postgraduate / Resident' },
        'consultant': { amount: 5000, currency: 'INR', label: 'Consultant / Practicing Surgeon' }
      }
    },
    workshops: [
      {
        id: 'hand-surgery-workshop',
        name: 'Live Hand Surgery Workshop',
        description: 'Hands-on workshop on hand surgery techniques',
        instructor: 'Expert Faculty',
        duration: 'Full Day',
        price: 3500,
        currency: 'INR',
        maxSeats: 50,
        venue: 'HICC Novotel',
        date: '2026-04-25',
        isActive: true
      }
    ]
  }

  // Upsert pricing tiers
  await Configuration.findOneAndUpdate(
    { type: 'pricing', key: 'pricing_tiers' },
    { type: 'pricing', key: 'pricing_tiers', value: pricing_tiers, isActive: true, createdBy: 'system' },
    { upsert: true, new: true }
  )
  console.log('✅ Seeded pricing_tiers for ISSH Midterm CME 2026')

  // Legacy registration_categories for compatibility
  await Configuration.findOneAndUpdate(
    { type: 'pricing', key: 'registration_categories' },
    { type: 'pricing', key: 'registration_categories', value: pricing_tiers.regular.categories, isActive: true, createdBy: 'system' },
    { upsert: true, new: true }
  )
  console.log('✅ Seeded registration_categories')

  // Disable all discounts by default
  await Configuration.findOneAndUpdate(
    { type: 'discounts', key: 'active_discounts' },
    { type: 'discounts', key: 'active_discounts', value: [], isActive: true, createdBy: 'system' },
    { upsert: true, new: true }
  )
  console.log('✅ Cleared active_discounts')

  await mongoose.connection.close()
}

main().catch(err => { console.error(err); process.exit(1) })
