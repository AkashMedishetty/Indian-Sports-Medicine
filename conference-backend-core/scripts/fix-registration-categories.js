// Script to fix registration_categories config for ISSH Midterm CME 2026
// Run with: node scripts/fix-registration-categories.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fixRegistrationCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Configuration model
    const Configuration = mongoose.model('Configuration', new mongoose.Schema({
      type: String,
      key: String,
      value: mongoose.Schema.Types.Mixed,
      isActive: Boolean,
      updatedAt: Date,
      createdAt: Date
    }));

    // Find registration_categories config
    const registrationConfig = await Configuration.findOne({
      type: 'pricing',
      key: 'registration_categories'
    });

    if (!registrationConfig) {
      console.log('❌ registration_categories config not found');
      console.log('Creating new config...');
      
      await Configuration.create({
        type: 'pricing',
        key: 'registration_categories',
        value: {
          'postgraduate': { amount: 2500, currency: 'INR', label: 'Postgraduate / Resident' },
          'consultant': { amount: 5000, currency: 'INR', label: 'Consultant / Practicing Surgeon' }
        },
        isActive: true
      });
      
      console.log('✅ Created registration_categories config');
    } else {
      console.log('📋 Current registration_categories:', JSON.stringify(registrationConfig.value, null, 2));
      
      // Update to ISSH Midterm CME 2026 categories
      registrationConfig.value = {
        'postgraduate': { amount: 2500, currency: 'INR', label: 'Postgraduate / Resident' },
        'consultant': { amount: 5000, currency: 'INR', label: 'Consultant / Practicing Surgeon' }
      };
      
      await registrationConfig.save();
      console.log('✅ Updated registration_categories for ISSH Midterm CME 2026');
      
      console.log('\n📋 Updated registration_categories:', JSON.stringify(registrationConfig.value, null, 2));
    }

    console.log('\n✅ All done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRegistrationCategories();
