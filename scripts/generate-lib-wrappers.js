#!/usr/bin/env node

/**
 * Auto-generate lib/config/hooks re-export wrappers
 * Scans conference-backend-core for commonly imported files
 */

const fs = require('fs')
const path = require('path')

const CORE_ROOT = path.join(__dirname, '../conference-backend-core')
const APP_ROOT = path.join(__dirname, '..')

const FOLDERS_TO_WRAP = [
  { source: 'config', target: 'config', pattern: /\.(ts|js)$/ },
  { source: 'lib', target: 'lib', pattern: /\.(ts|js)$/, exclude: ['models', 'email', 'utils', 'validation'] },
  { source: 'lib/models', target: 'lib/models', pattern: /\.(ts|js)$/ },
  { source: 'lib/utils', target: 'lib/utils', pattern: /\.(ts|js)$/ },
  { source: 'lib/email', target: 'lib/email', pattern: /\.(ts|js)$/ },
  { source: 'lib/validation', target: 'lib/validation', pattern: /\.(ts|js)$/ },
  { source: 'hooks', target: 'hooks', pattern: /\.(ts|js|tsx|jsx)$/ },
]

/**
 * Find all files in a directory
 */
function findFiles(dir, pattern, exclude = []) {
  const files = []
  
  if (!fs.existsSync(dir)) {
    return files
  }
  
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    // Skip excluded directories
    if (exclude.includes(item)) continue
    
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      // Don't recurse into subdirectories for now
      continue
    } else if (pattern.test(item)) {
      files.push(item)
    }
  }
  
  return files
}

/**
 * Create re-export wrapper
 */
function createWrapper(sourceFolder, targetFolder, filename) {
  const targetDir = path.join(APP_ROOT, targetFolder)
  const targetFile = path.join(targetDir, filename)
  
  // Skip if already exists
  if (fs.existsSync(targetFile)) {
    return { status: 'skipped', file: targetFile }
  }
  
  // Create directory
  fs.mkdirSync(targetDir, { recursive: true })
  
  // Generate import path (remove .ts/.js extension, add it back)
  const baseFilename = filename.replace(/\.(ts|js|tsx|jsx)$/, '')
  const importPath = `@/conference-backend-core/${sourceFolder}/${baseFilename}`
  
  // Only export named exports (not default to avoid errors)
  const content = `// Auto-generated re-export wrapper
export * from '${importPath}'
`
  
  fs.writeFileSync(targetFile, content, 'utf8')
  return { status: 'created', file: targetFile }
}

/**
 * Main function
 */
async function generateLibWrappers() {
  console.log('\n📚 LIB/CONFIG/HOOKS WRAPPER GENERATOR')
  console.log('═'.repeat(60))
  console.log()
  
  let totalCreated = 0
  let totalSkipped = 0
  let totalErrors = 0
  
  for (const folder of FOLDERS_TO_WRAP) {
    const sourceDir = path.join(CORE_ROOT, folder.source)
    
    console.log(`\n📂 Processing: ${folder.source}`)
    
    const files = findFiles(sourceDir, folder.pattern, folder.exclude || [])
    
    if (files.length === 0) {
      console.log(`   ⚠️  No files found`)
      continue
    }
    
    console.log(`   Found ${files.length} files\n`)
    
    for (const file of files) {
      try {
        const result = createWrapper(folder.source, folder.target, file)
        
        if (result.status === 'created') {
          console.log(`   ✅ Created: ${folder.target}/${file}`)
          totalCreated++
        } else {
          console.log(`   ⏭️  Skipped: ${folder.target}/${file} (exists)`)
          totalSkipped++
        }
      } catch (error) {
        console.error(`   ❌ Error: ${folder.target}/${file} - ${error.message}`)
        totalErrors++
      }
    }
  }
  
  console.log()
  console.log('═'.repeat(60))
  console.log(`📊 Summary:`)
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ⏭️  Skipped: ${totalSkipped}`)
  console.log(`   ❌ Errors:  ${totalErrors}`)
  console.log('═'.repeat(60))
  console.log()
  
  if (totalCreated > 0) {
    console.log('🎉 Lib wrappers generated successfully!\n')
  } else {
    console.log('ℹ️  All wrappers already exist.\n')
  }
}

// Run if called directly
if (require.main === module) {
  generateLibWrappers().catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { generateLibWrappers }
