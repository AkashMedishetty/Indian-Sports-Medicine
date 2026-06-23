/**
 * Check Database Pricing Configuration
 * 
 * This script checks what pricing data is currently in the database
 * Run: node scripts/check-database-pricing.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkDatabasePricing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Configuration model
    const Configuration = mongoose.model('Configuration', new mongoose.Schema({
      type: String,
      key: String,
      value: mongoose.Schema.Types.Mixed,
      isActive: Boolean,
      description: String,
      updatedAt: Date,
      createdAt: Date
    }));

    console.log('🔍 Checking pricing configuration in database...\n');

    // 1. Check Pricing Tiers
    console.log('=' .repeat(60));
    console.log('1️⃣  PRICING TIERS');
    console.log('=' .repeat(60));
    
    const pricingTiers = await Configuration.findOne({
      type: 'pricing',
      key: 'pricing_tiers'
    });

    if (pricingTiers) {
      console.log('✅ Found in database\n');
      console.log('Status:', pricingTiers.isActive ? '🟢 Active' : '🔴 Inactive');
      console.log('Last Updated:', pricingTiers.updatedAt || 'N/A');
      console.log('\nTiers:');
      
      const currentDate = new Date();
      Object.entries(pricingTiers.value || {}).forEach(([tierKey, tierData]) => {
        if (tierKey === 'specialOffers') return;
        
        const tier = tierData;
        const startDate = tier.startDate ? new Date(tier.startDate) : null;
        const endDate = tier.endDate ? new Date(tier.endDate) : null;
        const isActive = tier.isActive && (!startDate || currentDate >= startDate) && (!endDate || currentDate <= endDate);
        
        console.log(`\n  ${isActive ? '🟢' : '⚪'} ${tier.name || tierKey} (${tierKey})`);
        console.log(`     Period: ${tier.startDate} to ${tier.endDate}`);
        console.log(`     Status: ${tier.isActive ? 'Active' : 'Inactive'} | ${isActive ? 'CURRENT' : 'Not Current'}`);
        console.log(`     Categories:`);
        
        Object.entries(tier.categories || {}).forEach(([catKey, catData]) => {
          console.log(`       - ${catData.label}: ${catData.currency} ${catData.amount}`);
        });
      });
    } else {
      console.log('❌ NOT FOUND in database');
      console.log('⚠️  System will fail without this configuration!');
      console.log('💡 Configure via admin panel\n');
    }

    // 2. Check Accompanying Person Fee
    console.log('=' .repeat(60));
    console.log('2️⃣  ACCOMPANYING PERSON FEE');
    console.log('=' .repeat(60));
    
    const accompanyingFee = await Configuration.findOne({
      type: 'pricing',
      key: 'accompanying_person'
    });

    if (accompanyingFee) {
      console.log('✅ Found in database\n');
      console.log('Status:', accompanyingFee.isActive ? '🟢 Active' : '🔴 Inactive');
      console.log('Last Updated:', accompanyingFee.updatedAt || 'N/A');
      console.log('\nDetails:');
      console.log(`  Amount: ${accompanyingFee.value?.currency || 'INR'} ${accompanyingFee.value?.amount || 0}`);
      console.log(`  Description: ${accompanyingFee.value?.description || 'N/A'}`);
      
      if (accompanyingFee.value?.tierPricing) {
        console.log('\n  Tier Pricing:');
        Object.entries(accompanyingFee.value.tierPricing).forEach(([tier, amount]) => {
          console.log(`    - ${tier}: ${amount}`);
        });
      }
    } else {
      console.log('❌ NOT FOUND in database');
      console.log('⚠️  Accompanying persons will be charged 0');
      console.log('💡 Run: node scripts/seed-pricing-to-database.js\n');
    }

    // 3. Check All Pricing Configs
    console.log('\n' + '=' .repeat(60));
    console.log('3️⃣  ALL PRICING CONFIGURATIONS');
    console.log('=' .repeat(60));
    
    const allPricingConfigs = await Configuration.find({
      type: 'pricing'
    });

    console.log(`\nTotal pricing configs: ${allPricingConfigs.length}\n`);
    
    allPricingConfigs.forEach(config => {
      const status = config.isActive ? '🟢' : '🔴';
      console.log(`${status} ${config.key}`);
      console.log(`   Type: ${config.type}`);
      console.log(`   Active: ${config.isActive}`);
      console.log(`   Updated: ${config.updatedAt?.toLocaleDateString() || 'N/A'}`);
      console.log('');
    });

    // Summary
    console.log('=' .repeat(60));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(60));
    
    const hasPricingTiers = !!pricingTiers;
    const hasAccompanyingFee = !!accompanyingFee;
    
    if (hasPricingTiers && hasAccompanyingFee) {
      console.log('✅ All required pricing configuration found!');
      console.log('✅ System is using DATABASE-ONLY pricing');
      console.log('✅ Pricing tiers configured with date-based activation');
    } else {
      console.log('❌ Missing required pricing configuration:');
      if (!hasPricingTiers) console.log('   - pricing_tiers');
      if (!hasAccompanyingFee) console.log('   - accompanying_person');
      console.log('\n⚠️  System will throw error without these!');
      console.log('💡 Solution: Configure via admin panel');
    }

    await mongoose.disconnect();
    console.log('\n✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabasePricing();
