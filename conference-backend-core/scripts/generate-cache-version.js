#!/usr/bin/env node

/**
 * Cache Version Generator
 * Generates a unique cache version for production deployments
 * This ensures automatic cache invalidation when deploying new versions
 */

const fs = require('fs');
const path = require('path');

// Generate unique version based on timestamp and git commit (if available)
function generateCacheVersion() {
  const timestamp = Date.now();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  
  let gitCommit = '';
  try {
    const { execSync } = require('child_process');
    gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Git not available, using timestamp only');
  }
  
  const version = gitCommit ? `v${timestamp}-${gitCommit}` : `v${timestamp}`;
  console.log(`Generated cache version: ${version}`);
  return version;
}

// Update service worker with new cache version
function updateServiceWorker(version) {
  const swPath = path.join(__dirname, '..', 'public', 'sw-force-update.js');
  
  if (!fs.existsSync(swPath)) {
    console.error('Service worker file not found:', swPath);
    process.exit(1);
  }
  
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Update cache version in service worker
  const versionRegex = /const CACHE_VERSION = '[^']+';/;
  const newVersionLine = `const CACHE_VERSION = 'issh-2026-${version}';`;
  
  if (versionRegex.test(swContent)) {
    swContent = swContent.replace(versionRegex, newVersionLine);
  } else {
    console.error('Could not find CACHE_VERSION in service worker');
    process.exit(1);
  }
  
  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log('✅ Service worker updated with new cache version');
}

// Create cache manifest for client-side version checking
function createCacheManifest(version) {
  const manifest = {
    version,
    timestamp: Date.now(),
    deployedAt: new Date().toISOString(),
    forceUpdate: false // Changed from true to prevent infinite reload loops
  };
  
  const manifestPath = path.join(__dirname, '..', 'public', 'cache-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ Cache manifest created');
}

// Main execution
if (require.main === module) {
  console.log('🔄 Generating new cache version for deployment...');
  
  const version = generateCacheVersion();
  updateServiceWorker(version);
  createCacheManifest(version);
  
  console.log('🚀 Cache version generation complete!');
  console.log('📝 Remember to commit the updated service worker before deployment');
}

module.exports = { generateCacheVersion, updateServiceWorker, createCacheManifest };