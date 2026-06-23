import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'

export async function seedDiscounts() {
  try {
    await connectDB()

    // Check if discounts already exist
    const existingDiscounts = await Configuration.findOne({
      type: 'discounts',
      key: 'active_discounts'
    })

    if (existingDiscounts) {
      console.log('Discounts already exist, skipping seed')
      return
    }

    // Create default discounts
    const defaultDiscounts = [
      {
        id: 'independence-day',
        name: 'Independence Day Special',
        type: 'time-based',
        percentage: 15,
        startDate: '2024-08-10',
        endDate: '2024-08-20',
        applicableCategories: ['regular', 'faculty'],
        description: 'Special discount for Independence Day celebration'
      },
      {
        id: 'early-bird',
        name: 'Early Bird Discount',
        type: 'time-based',
        percentage: 10,
        endDate: '2024-07-31',
        applicableCategories: ['all'],
        description: 'Early registration discount'
      },
      {
        id: 'student-special',
        name: 'Student Special',
        type: 'code-based',
        code: 'STUDENT2026',
        percentage: 20,
        applicableCategories: ['student'],
        description: 'Additional discount for verified students'
      },
      {
        id: 'group-registration',
        name: 'Group Registration',
        type: 'code-based',
        code: 'GROUP5',
        percentage: 5,
        applicableCategories: ['all'],
        description: 'Discount for group registrations (5+ people)'
      }
    ]

    const discountConfig = new Configuration({
      type: 'discounts',
      key: 'active_discounts',
      value: defaultDiscounts,
      isActive: true
    })

    await discountConfig.save()
    console.log('Default discounts seeded successfully')

  } catch (error) {
    console.error('Error seeding discounts:', error)
  }
}

// Auto-run if called directly
if (require.main === module) {
  seedDiscounts().then(() => process.exit(0))
}