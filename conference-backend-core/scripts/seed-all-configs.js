const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      const cleanValue = value.replace(/^["']|["']$/g, '');
      process.env[key.trim()] = cleanValue;
    }
  });
  console.log('Environment variables loaded from .env.local');
}

const mongoose = require('mongoose');

// Configuration Schema
const configurationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Configuration = mongoose.models.Configuration || mongoose.model('Configuration', configurationSchema);

async function seedAllConfigurations() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Pricing Configuration for ISSH Midterm CME 2026
    console.log('💰 Seeding Pricing Configuration...');
    await Configuration.findOneAndUpdate(
      { type: 'pricing', key: 'pricing_tiers' },
      {
        type: 'pricing',
        key: 'pricing_tiers',
        value: {
          specialOffers: [],
          earlyBird: {
            name: 'Early Bird Registration',
            description: 'Early Bird Registration',
            startDate: '2025-10-01',
            endDate: '2026-01-31',
            isActive: true,
            categories: {
              'postgraduate': { amount: 2500, currency: 'INR', label: 'Postgraduate / Resident' },
              'consultant': { amount: 5000, currency: 'INR', label: 'Consultant / Practicing Surgeon' }
            }
          },
          regular: {
            name: 'Regular Registration',
            description: 'Standard registration pricing',
            startDate: '2026-02-01',
            endDate: '2026-04-20',
            isActive: true,
            categories: {
              'postgraduate': { amount: 2500, currency: 'INR', label: 'Postgraduate / Resident' },
              'consultant': { amount: 5000, currency: 'INR', label: 'Consultant / Practicing Surgeon' }
            }
          },
          onsite: {
            name: 'Spot Registration',
            description: 'Registration at the venue',
            startDate: '2026-04-21',
            endDate: '2026-04-26',
            isActive: true,
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
        },
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 2. Discount Configuration
    console.log('🎯 Seeding Discount Configuration...');
    await Configuration.findOneAndUpdate(
      { type: 'discounts', key: 'active_discounts' },
      {
        type: 'discounts',
        key: 'active_discounts',
        value: [],
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 3. Email Configuration
    console.log('📧 Updating Email Configuration...');
    await Configuration.findOneAndUpdate(
      { type: 'settings', key: 'email_settings' },
      {
        $set: {
          'value.templates.registration.enabled': true,
          'value.templates.registration.subject': 'Application Received - ISSH Midterm CME 2026',
          'value.templates.payment.enabled': true,
          'value.templates.payment.subject': 'Payment Confirmation - ISSH Midterm CME 2026',
          'value.templates.reminder.enabled': true,
          'value.templates.reminder.subject': 'Conference Reminder - ISSH Midterm CME 2026',
          'value.templates.bulkEmail.enabled': true,
          'value.templates.bulkEmail.subject': 'Important Update - ISSH Midterm CME 2026',
          updatedAt: new Date()
        }
      }
    );

    // 4. Content Configuration
    console.log('📝 Seeding Content Configuration...');
    await Configuration.findOneAndUpdate(
      { type: 'content', key: 'website_content' },
      {
        type: 'content',
        key: 'website_content',
        value: {
          heroSection: {
            title: 'ISSH Midterm CME 2026',
            subtitle: 'Inappropriate, Appropriate and Most Appropriate ways to do Hand Surgery',
            description: 'Join the 12th ISSH Midterm CME at HICC Novotel, Hyderabad on April 25-26, 2026.',
            ctaText: 'Register Now',
            backgroundImage: '/hero-bg.jpg'
          },
          aboutSection: {
            title: 'About ISSH Midterm CME 2026',
            description: 'The Indian Society for Surgery of the Hand (ISSH) proudly presents the 12th Midterm CME, bringing together leading hand surgery professionals to share knowledge, innovations, and best practices.',
            highlights: [
              'Expert speakers from around the world',
              'Live Hand Surgery Demonstrations',
              'Latest research presentations',
              'Networking opportunities'
            ]
          },
          venueInfo: {
            name: 'HICC Novotel',
            address: 'Hyderabad, Telangana, India',
            mapUrl: 'https://maps.google.com/...',
            facilities: ['Modern auditorium', 'Workshop labs', 'Exhibition space', 'Parking']
          },
          keyDates: {
            conferenceStart: '2026-04-25',
            conferenceEnd: '2026-04-26',
            workshopDate: '2026-04-25',
            registrationDeadline: '2026-04-24'
          }
        },
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 5. Report Configuration
    console.log('📊 Seeding Report Configuration...');
    await Configuration.findOneAndUpdate(
      { type: 'reports', key: 'report_settings' },
      {
        type: 'reports',
        key: 'report_settings',
        value: {
          exportFormats: ['csv', 'excel', 'pdf'],
          defaultFormat: 'csv',
          includeFields: {
            registrations: [
              'registrationId',
              'name',
              'email',
              'phone',
              'institution',
              'registrationType',
              'registrationDate',
              'paymentStatus',
              'amount',
              'utrNumber'
            ],
            payments: [
              'registrationId',
              'amount',
              'currency',
              'method',
              'status',
              'transactionDate',
              'utrNumber',
              'verifiedBy'
            ],
            workshops: [
              'workshopName',
              'participantName',
              'email',
              'registrationDate',
              'paymentStatus'
            ]
          },
          filters: {
            dateRange: true,
            registrationType: true,
            paymentStatus: true,
            verificationStatus: true
          }
        },
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 6. Bulk Email Configuration
    console.log('📮 Seeding Bulk Email Configuration...');
    await Configuration.findOneAndUpdate(
      { type: 'bulk_email', key: 'bulk_email_settings' },
      {
        type: 'bulk_email',
        key: 'bulk_email_settings',
        value: {
          enabled: true,
          maxRecipientsPerBatch: 50,
          delayBetweenBatches: 2000,
          maxEmailsPerDay: 1000,
          allowedSenders: ['admin', 'moderator'],
          templates: {
            welcome: {
              subject: 'Welcome to ISSH Midterm CME 2026',
              enabled: true
            },
            reminder: {
              subject: 'Conference Reminder - ISSH Midterm CME 2026',
              enabled: true
            },
            update: {
              subject: 'Important Update - ISSH Midterm CME 2026',
              enabled: true
            },
            cancellation: {
              subject: 'Conference Update - ISSH Midterm CME 2026',
              enabled: true
            }
          },
          recipientFilters: [
            'all_registered',
            'paid_only',
            'pending_payment',
            'postgraduates',
            'consultants',
            'workshop_participants'
          ]
        },
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('✅ All configurations seeded successfully!');

    // Display summary
    const configs = await Configuration.find({}, 'type key isActive').lean();
    console.log('\n📋 Configuration Summary:');
    configs.forEach(config => {
      console.log(`  ${config.isActive ? '✅' : '❌'} ${config.type}:${config.key}`);
    });

  } catch (error) {
    console.error('❌ Error seeding configurations:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding
seedAllConfigurations().then(() => {
  console.log('🎉 All configurations seeding completed');
  process.exit(0);
});
