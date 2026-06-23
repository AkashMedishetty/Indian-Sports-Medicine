#!/usr/bin/env node

/**
 * COMPREHENSIVE IMPORT FIXER
 * Scans ALL imports from conference-backend-core and creates missing wrappers
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const CORE_ROOT = path.join(__dirname, '../conference-backend-core')
const APP_ROOT = path.join(__dirname, '..')

console.log('\n🔍 COMPREHENSIVE IMPORT SCANNER')
console.log('═'.repeat(60))
console.log()

// Find all TypeScript files
function findAllTsFiles(dir) {
  const files = []
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.next') {
      files.push(...findAllTsFiles(fullPath))
    } else if (item.match(/\.(ts|tsx)$/)) {
      files.push(fullPath)
    }
  }
  
  return files
}

// Extract all @/lib, @/config, @/hooks imports
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const imports = []
  
  // Match static imports: from '@/lib/...' or from "@/lib/..."
  const staticRegex = /from\s+['"]@\/(lib|config|hooks)\/([^'"]+)['"]/g
  let match
  
  while ((match = staticRegex.exec(content)) !== null) {
    const folder = match[1]
    const subpath = match[2]
    imports.push(`${folder}/${subpath}`)
  }
  
  // Match dynamic imports: import('@/lib/...')
  const dynamicRegex = /import\s*\(\s*['"]@\/(lib|config|hooks)\/([^'"]+)['"]\s*\)/g
  
  while ((match = dynamicRegex.exec(content)) !== null) {
    const folder = match[1]
    const subpath = match[2]
    imports.push(`${folder}/${subpath}`)
  }
  
  return imports
}

// Create wrapper for an import
function createWrapper(importPath) {
  const targetFile = path.join(APP_ROOT, importPath + '.ts')
  const targetDir = path.dirname(targetFile)
  
  // Skip if exists
  if (fs.existsSync(targetFile)) {
    return { status: 'exists', path: importPath }
  }
  
  // Create directory
  fs.mkdirSync(targetDir, { recursive: true })
  
  // Create wrapper (only export *, no default export to avoid issues)
  const content = `// Auto-generated re-export wrapper
export * from '@/conference-backend-core/${importPath}'
`
  
  fs.writeFileSync(targetFile, content, 'utf8')
  return { status: 'created', path: importPath }
}

// Main
async function fixAllImports() {
  console.log('📂 Scanning all TypeScript files in conference-backend-core...\n')
  
  const files = findAllTsFiles(CORE_ROOT)
  console.log(`✅ Found ${files.length} TypeScript files\n`)
  
  // Extract all imports
  const allImports = new Set()
  for (const file of files) {
    const imports = extractImports(file)
    imports.forEach(imp => allImports.add(imp))
  }
  
  console.log(`✅ Found ${allImports.size} unique imports\n`)
  console.log('Creating missing wrappers...\n')
  
  let created = 0
  let exists = 0
  
  for (const importPath of Array.from(allImports).sort()) {
    const result = createWrapper(importPath)
    
    if (result.status === 'created') {
      console.log(`✅ Created: ${importPath}`)
      created++
    } else {
      exists++
    }
  }
  
  console.log()
  console.log('═'.repeat(60))
  console.log(`📊 Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Exists:  ${exists}`)
  console.log(`   📦 Total:   ${allImports.size}`)
  console.log('═'.repeat(60))
  console.log()
  
  if (created > 0) {
    console.log(`🎉 Created ${created} new wrappers!\n`)
  } else {
    console.log('ℹ️  All imports already have wrappers.\n')
  }
}

fixAllImports().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
