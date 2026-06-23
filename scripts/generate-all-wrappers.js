#!/usr/bin/env node

/**
 * Auto-generate ALL API route wrappers
 * Scans conference-backend-core/app/api and creates wrappers in app/api
 */

const fs = require('fs')
const path = require('path')

const CORE_API_DIR = path.join(__dirname, '../conference-backend-core/app/api')
const APP_API_DIR = path.join(__dirname, '../app/api')

/**
 * Recursively find all route.ts files
 */
function findAllRoutes(dir, basePath = '') {
  const routes = []
  
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`)
    return routes
  }
  
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      // Recurse into subdirectories
      const subRoutes = findAllRoutes(fullPath, path.join(basePath, item))
      routes.push(...subRoutes)
    } else if (item === 'route.ts') {
      // Found a route file
      routes.push(basePath)
    }
  }
  
  return routes
}

/**
 * Extract exported HTTP methods from route file
 */
function getExportedMethods(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const methods = []
    
    // Match: export async function GET/POST/PUT/DELETE/PATCH
    const regex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/g
    let match
    
    while ((match = regex.exec(content)) !== null) {
      if (!methods.includes(match[1])) {
        methods.push(match[1])
      }
    }
    
    return methods.length > 0 ? methods : ['GET'] // Default to GET if none found
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
    return ['GET']
  }
}

/**
 * Create wrapper file
 */
function createWrapper(routePath, methods) {
  const wrapperDir = path.join(APP_API_DIR, routePath)
  const wrapperFile = path.join(wrapperDir, 'route.ts')
  
  // Skip if wrapper already exists and is not empty
  if (fs.existsSync(wrapperFile)) {
    const existing = fs.readFileSync(wrapperFile, 'utf8')
    if (existing.includes('export {') && existing.includes('conference-backend-core')) {
      return { status: 'skipped', file: wrapperFile }
    }
  }
  
  // Create directory
  fs.mkdirSync(wrapperDir, { recursive: true })
  
  // Generate import path
  const importPath = '@/conference-backend-core/app/api' + 
    (routePath ? '/' + routePath.replace(/\\/g, '/') : '') + '/route'
  
  // Generate wrapper content
  const content = `// Auto-generated API wrapper
// Re-exports from conference-backend-core
export { ${methods.join(', ')} } from '${importPath}'
`
  
  fs.writeFileSync(wrapperFile, content, 'utf8')
  return { status: 'created', file: wrapperFile }
}

/**
 * Main function
 */
async function generateAllWrappers() {
  console.log('\n🔧 API ROUTE WRAPPER GENERATOR')
  console.log('═'.repeat(60))
  console.log()
  console.log('📂 Scanning:', CORE_API_DIR)
  console.log('📝 Target:', APP_API_DIR)
  console.log()
  
  // Find all routes
  const routes = findAllRoutes(CORE_API_DIR)
  
  if (routes.length === 0) {
    console.log('⚠️  No routes found in conference-backend-core/app/api')
    return
  }
  
  console.log(`✅ Found ${routes.length} API routes\n`)
  
  let created = 0
  let skipped = 0
  let errors = 0
  
  // Process each route
  for (const routePath of routes) {
    const coreFile = path.join(CORE_API_DIR, routePath, 'route.ts')
    
    try {
      // Get exported methods
      const methods = getExportedMethods(coreFile)
      
      // Create wrapper
      const result = createWrapper(routePath, methods)
      
      if (result.status === 'created') {
        console.log(`✅ Created:  /${routePath || 'api'} (${methods.join(', ')})`)
        created++
      } else {
        console.log(`⏭️  Skipped: /${routePath || 'api'} (exists)`)
        skipped++
      }
    } catch (error) {
      console.error(`❌ Error:   /${routePath || 'api'} - ${error.message}`)
      errors++
    }
  }
  
  console.log()
  console.log('═'.repeat(60))
  console.log(`📊 Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors:  ${errors}`)
  console.log(`   📦 Total:   ${routes.length}`)
  console.log('═'.repeat(60))
  console.log()
  
  if (created > 0) {
    console.log('🎉 API wrappers generated successfully!\n')
  } else {
    console.log('ℹ️  All wrappers already exist.\n')
  }
}

// Run if called directly
if (require.main === module) {
  generateAllWrappers().catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { generateAllWrappers }
