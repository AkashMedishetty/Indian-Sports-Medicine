#!/usr/bin/env node

/**
 * Auto-generate UI Page Wrappers
 * Scans conference-backend-core/app for page.tsx and layout.tsx files
 * Creates wrappers in app/ (excluding api routes)
 */

const fs = require('fs')
const path = require('path')

const CORE_APP_DIR = path.join(__dirname, '../conference-backend-core/app')
const APP_DIR = path.join(__dirname, '../app')

/**
 * Recursively find all page.tsx and layout.tsx files (excluding api directory)
 */
function findAllPages(dir, basePath = '') {
  const pages = []
  
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`)
    return pages
  }
  
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const relativePath = path.join(basePath, item)
    const stat = fs.statSync(fullPath)
    
    // Skip api directory
    if (item === 'api') {
      continue
    }
    
    if (stat.isDirectory()) {
      // Recurse into subdirectories
      const subPages = findAllPages(fullPath, relativePath)
      pages.push(...subPages)
    } else if (item === 'page.tsx' || item === 'layout.tsx' || item === 'loading.tsx' || item === 'error.tsx' || item === 'not-found.tsx') {
      // Found a page/layout file
      pages.push({
        type: item.replace('.tsx', ''),
        directory: basePath,
        filename: item
      })
    }
  }
  
  return pages
}

/**
 * Detect if file uses default export or named exports
 */
function analyzeExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for default export
    const hasDefaultExport = /export\s+default\s+/.test(content)
    
    // Check for named exports (like metadata)
    const namedExports = []
    const namedExportRegex = /export\s+(?:const|let|var|type|interface|enum)\s+(\w+)/g
    let match
    
    while ((match = namedExportRegex.exec(content)) !== null) {
      namedExports.push(match[1])
    }
    
    return {
      hasDefault: hasDefaultExport,
      namedExports: namedExports
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
    return { hasDefault: true, namedExports: [] }
  }
}

/**
 * Create wrapper file for a page
 */
function createPageWrapper(page) {
  const wrapperDir = path.join(APP_DIR, page.directory)
  const wrapperFile = path.join(wrapperDir, page.filename)
  
  // Skip if wrapper already exists and is not empty
  if (fs.existsSync(wrapperFile)) {
    const existing = fs.readFileSync(wrapperFile, 'utf8')
    if (existing.includes('conference-backend-core') && existing.length > 50) {
      return { status: 'skipped', file: wrapperFile }
    }
  }
  
  // Create directory
  fs.mkdirSync(wrapperDir, { recursive: true })
  
  // Analyze source file
  const sourcePath = path.join(CORE_APP_DIR, page.directory, page.filename)
  const exports = analyzeExports(sourcePath)
  
  // Generate import path
  const importPath = '@/conference-backend-core/app' + 
    (page.directory ? '/' + page.directory.replace(/\\/g, '/') : '') + 
    '/' + page.type
  
  // Generate wrapper content
  let content = ''
  
  // Add "use client" directive for error.tsx (Next.js requirement)
  if (page.filename === 'error.tsx') {
    content = `"use client"\n\n`
  }
  
  content += `// Auto-generated wrapper\n// Re-exports from conference-backend-core\n`
  
  // Add default export if exists
  if (exports.hasDefault) {
    content += `export { default } from '${importPath}'\n`
  }
  
  // Add named exports if exists
  if (exports.namedExports.length > 0) {
    content += `export { ${exports.namedExports.join(', ')} } from '${importPath}'\n`
  }
  
  // If no exports detected, use default export as fallback
  if (!exports.hasDefault && exports.namedExports.length === 0) {
    content += `export { default } from '${importPath}'\n`
  }
  
  fs.writeFileSync(wrapperFile, content, 'utf8')
  return { status: 'created', file: wrapperFile }
}

/**
 * Main function
 */
async function generatePageWrappers() {
  console.log('\n🎨 UI PAGE WRAPPER GENERATOR')
  console.log('═'.repeat(60))
  console.log()
  console.log('📂 Scanning:', CORE_APP_DIR)
  console.log('📝 Target:', APP_DIR)
  console.log('⚠️  Excluding: /api directory')
  console.log()
  
  // Find all pages
  const pages = findAllPages(CORE_APP_DIR)
  
  if (pages.length === 0) {
    console.log('⚠️  No page files found in conference-backend-core/app')
    return
  }
  
  console.log(`✅ Found ${pages.length} page files\n`)
  
  let created = 0
  let skipped = 0
  let errors = 0
  
  // Process each page
  for (const page of pages) {
    try {
      const result = createPageWrapper(page)
      const displayPath = page.directory ? `/${page.directory}/${page.filename}` : `/${page.filename}`
      
      if (result.status === 'created') {
        console.log(`✅ Created:  ${displayPath}`)
        created++
      } else {
        console.log(`⏭️  Skipped: ${displayPath} (exists)`)
        skipped++
      }
    } catch (error) {
      const displayPath = page.directory ? `/${page.directory}/${page.filename}` : `/${page.filename}`
      console.error(`❌ Error:   ${displayPath} - ${error.message}`)
      errors++
    }
  }
  
  console.log()
  console.log('═'.repeat(60))
  console.log(`📊 Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors:  ${errors}`)
  console.log(`   📦 Total:   ${pages.length}`)
  console.log('═'.repeat(60))
  console.log()
  
  if (created > 0) {
    console.log('🎉 Page wrappers generated successfully!\n')
  } else {
    console.log('ℹ️  All wrappers already exist.\n')
  }
}

// Run if called directly
if (require.main === module) {
  generatePageWrappers().catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { generatePageWrappers }
