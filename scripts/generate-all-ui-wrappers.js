#!/usr/bin/env node

/**
 * COMPLETE WRAPPER GENERATOR
 * Generates both API route wrappers AND UI page wrappers
 */

const { generateAllWrappers } = require('./generate-all-wrappers')
const { generatePageWrappers } = require('./generate-page-wrappers')

async function generateAllUIWrappers() {
  console.log('\n')
  console.log('═'.repeat(70))
  console.log('  COMPLETE WRAPPER GENERATOR FOR NEW CONFERENCE')
  console.log('═'.repeat(70))
  console.log()
  console.log('This script will generate:')
  console.log('  1. API Route Wrappers (from conference-backend-core/app/api)')
  console.log('  2. UI Page Wrappers (from conference-backend-core/app)')
  console.log()
  console.log('═'.repeat(70))
  
  try {
    // Step 1: Generate API wrappers
    console.log('\n📡 STEP 1: Generating API Route Wrappers...')
    await generateAllWrappers()
    
    // Step 2: Generate page wrappers
    console.log('\n🎨 STEP 2: Generating UI Page Wrappers...')
    await generatePageWrappers()
    
    // Final summary
    console.log('\n')
    console.log('═'.repeat(70))
    console.log('  ✅ ALL WRAPPERS GENERATED SUCCESSFULLY!')
    console.log('═'.repeat(70))
    console.log()
    console.log('Your new conference is now ready to use!')
    console.log('Next steps:')
    console.log('  1. Update conference-backend-core/config/conference.config.ts')
    console.log('  2. Run: npm run dev')
    console.log('  3. Test your conference website')
    console.log()
    console.log('═'.repeat(70))
    console.log()
    
  } catch (error) {
    console.error('\n❌ Error during wrapper generation:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  generateAllUIWrappers().catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { generateAllUIWrappers }
