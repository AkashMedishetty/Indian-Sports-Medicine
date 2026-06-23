import connectDB from '../mongodb'
import Configuration from '../models/Configuration'
import User from '../models/User'
import Workshop from '../models/Workshop'
import bcrypt from 'bcryptjs'
import { 
  conferenceConfig, 
  getAdminEmail, 
  getRegistrationPrefix,
  getEmailSubject 
} from '../../config/conference.config'

export async function seedInitialConfiguration() {
  try {
    await connectDB()

    // Create admin user if it doesn't exist
    const adminEmail = getAdminEmail()
    const adminExists = await User.findOne({ email: adminEmail })
    
    let adminUser
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123!@#', 12)
      adminUser = await User.create({
        email: adminEmail,
        password: hashedPassword,
        profile: {
          title: 'Dr.',
          firstName: 'Admin',
          lastName: 'User',
          phone: conferenceConfig.contact.phone,
          designation: 'Consultant',
          institution: conferenceConfig.organizationName,
          address: {
            street: conferenceConfig.venue.address || 'Conference Admin',
            city: conferenceConfig.venue.city,
            state: conferenceConfig.venue.state,
            country: conferenceConfig.venue.country,
            pincode: conferenceConfig.venue.pincode || ''
          }
        },
        registration: {
          registrationId: `${getRegistrationPrefix()}-ADMIN`,
          type: conferenceConfig.registration.categories[0]?.key || 'member',
          status: 'paid'
        },
        role: 'admin'
      })
      console.log('Admin user created')
    } else {
      adminUser = adminExists
    }

    // Build default categories from config
    const defaultCategories: Record<string, { amount: number; currency: string; label: string }> = {}
    conferenceConfig.registration.categories.forEach(cat => {
      defaultCategories[cat.key] = { 
        amount: 0, // Default amount, should be set via admin panel
        currency: conferenceConfig.payment.currency, 
        label: cat.label 
      }
    })

    // Pricing Tiers Configuration - uses dates from conferenceConfig
    const pricingTiersConfig = {
      type: 'pricing',
      key: 'pricing_tiers',
      value: {
        specialOffers: [],
        earlyBird: conferenceConfig.payment.tiers.earlyBird?.enabled ? {
          name: conferenceConfig.payment.tiers.earlyBird.label,
          description: `${conferenceConfig.payment.tiers.earlyBird.label} Registration`,
          startDate: conferenceConfig.payment.tiers.earlyBird.startDate,
          endDate: conferenceConfig.payment.tiers.earlyBird.endDate,
          isActive: true,
          categories: defaultCategories
        } : undefined,
        regular: {
          name: conferenceConfig.payment.tiers.regular.label,
          description: 'Standard registration pricing',
          startDate: conferenceConfig.payment.tiers.regular.startDate,
          endDate: conferenceConfig.payment.tiers.regular.endDate,
          isActive: true,
          categories: defaultCategories
        },
        onsite: conferenceConfig.payment.tiers.onsite?.enabled ? {
          name: conferenceConfig.payment.tiers.onsite.label,
          description: 'Registration at the venue',
          startDate: conferenceConfig.payment.tiers.onsite.startDate,
          endDate: conferenceConfig.payment.tiers.onsite.endDate,
          isActive: true,
          categories: defaultCategories
        } : undefined
      },
      isActive: true,
      createdBy: adminUser._id
    }

    // Legacy pricing for backward compatibility - uses categories from config
    const pricingConfig = {
      type: 'pricing',
      key: 'registration_categories',
      value: defaultCategories,
      isActive: true,
      createdBy: adminUser._id
    }

    // Workshop Configuration - uses values from conferenceConfig
    const workshopConfig = {
      type: 'pricing',
      key: 'workshops',
      value: [
        { 
          id: 'sample-workshop', 
          name: `${conferenceConfig.shortName} Workshop`, 
          amount: 0, 
          venue: conferenceConfig.venue.name, 
          date: conferenceConfig.eventDate.start 
        }
      ],
      isActive: true,
      createdBy: adminUser._id
    }

    // Discount Configuration
    const discountConfig = {
      type: 'discounts',
      key: 'active_discounts',
      value: [
        {
          id: 'independence-day',
          name: 'Independence Day Special',
          type: 'time-based',
          percentage: 15,
          startDate: '2024-08-10',
          endDate: '2024-08-20',
          applicableCategories: ['regular', 'faculty'],
          isActive: true
        },
        {
          id: 'early-bird',
          name: 'Early Bird Discount',
          type: 'time-based',
          percentage: 10,
          endDate: '2024-07-31',
          applicableCategories: ['all'],
          isActive: true
        }
      ],
      isActive: true,
      createdBy: adminUser._id
    }

    // Conference Content Configuration - uses values from conferenceConfig
    const contentConfig = {
      type: 'content',
      key: 'conference_details',
      value: {
        name: conferenceConfig.shortName,
        fullName: `${conferenceConfig.name} - ${conferenceConfig.organizationName}`,
        theme: conferenceConfig.tagline || '',
        dates: {
          start: conferenceConfig.eventDate.start,
          end: conferenceConfig.eventDate.end
        },
        venue: {
          name: conferenceConfig.venue.name,
          city: conferenceConfig.venue.city,
          state: conferenceConfig.venue.state,
          country: conferenceConfig.venue.country
        },
        contact: {
          email: conferenceConfig.contact.email,
          phone: conferenceConfig.contact.phone,
          contactPerson: '', // Can be set via admin panel
          website: conferenceConfig.contact.website
        }
      },
      isActive: true,
      createdBy: adminUser._id
    }

    // Email Configuration - uses values from conferenceConfig
    const emailConfig = {
      type: 'settings',
      key: 'email_settings',
      value: {
        fromName: conferenceConfig.email.fromName,
        fromEmail: conferenceConfig.contact.email,
        replyTo: conferenceConfig.email.replyTo || conferenceConfig.contact.email,
        smtp: {
          host: 'smtpout.secureserver.net',
          port: 465,
          secure: true,
          requireAuth: true
        },
        templates: {
          registration: {
            subject: getEmailSubject('Registration Confirmation'),
            enabled: true
          },
          payment: {
            subject: getEmailSubject('Payment Confirmation & Invoice'),
            enabled: true
          },
          reminder: {
            subject: getEmailSubject('Conference Reminder'),
            enabled: true
          },
          passwordReset: {
            subject: getEmailSubject('Password Reset'),
            enabled: true
          },
          bulkEmail: {
            subject: getEmailSubject('Important Update'),
            enabled: true
          }
        },
        rateLimiting: {
          maxEmailsPerHour: 100,
          maxBulkEmailsPerDay: 1000,
          batchSize: 10,
          delayBetweenBatches: 1000
        }
      },
      isActive: true,
      createdBy: adminUser._id
    }

    // Seed workshops - dates relative to conferenceConfig.eventDate
    const eventStartDate = new Date(conferenceConfig.eventDate.start)
    const registrationStartDate = conferenceConfig.registration.startDate 
      ? new Date(conferenceConfig.registration.startDate) 
      : new Date(eventStartDate.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days before event
    const registrationEndDate = new Date(eventStartDate.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day before event
    
    const workshops = [
      {
        id: 'sample-workshop',
        name: `${conferenceConfig.shortName} Workshop`,
        description: 'Hands-on workshop session.',
        instructor: 'TBD',
        duration: 'Full Day',
        price: 0, // Set via admin panel
        currency: conferenceConfig.payment.currency,
        maxSeats: 50,
        bookedSeats: 0,
        registrationStart: registrationStartDate,
        registrationEnd: registrationEndDate,
        workshopDate: eventStartDate,
        workshopTime: '09:00 AM - 05:00 PM',
        venue: conferenceConfig.venue.name,
        prerequisites: '',
        materials: 'Workshop materials will be provided',
        isActive: false // Disabled by default, enable via admin panel
      }
    ]

    for (const workshopData of workshops) {
      await Workshop.findOneAndUpdate(
        { id: workshopData.id },
        workshopData,
        { upsert: true, new: true }
      )
      console.log(`Workshop ${workshopData.name} seeded`)
    }

    // Insert or update configurations
    // Accompanying Person Pricing Configuration
    const accompanyingPersonConfig = {
      type: 'pricing',
      key: 'accompanying_person',
      value: {
        basePrice: 3000,
        currency: 'INR',
        tierPricing: {
          'independence-day-2025': 5000,
          'earlyBird': 3000,
          'regular': 3500,
          'onsite': 4000
        },
        description: 'Pricing for accompanying persons by tier'
      },
      isActive: true,
      createdBy: adminUser._id
    }

    const configs = [pricingTiersConfig, pricingConfig, workshopConfig, discountConfig, contentConfig, emailConfig, accompanyingPersonConfig]
    
    for (const config of configs) {
      await Configuration.findOneAndUpdate(
        { type: config.type, key: config.key },
        config,
        { upsert: true, new: true }
      )
      console.log(`Configuration ${config.type}:${config.key} seeded`)
    }

    console.log('Initial configuration and workshops seeded successfully')
    return true
  } catch (error) {
    console.error('Error seeding initial configuration:', error)
    return false
  }
}