#!/usr/bin/env node

/**
 * Test Script for Automated Cache Invalidation System
 * 
 * This script verifies that all components of the cache invalidation
 * system are working correctly before deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CacheSystemTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`Running test: ${testName}`);
      await testFunction();
      this.passed.push(testName);
      this.log(`Test passed: ${testName}`, 'success');
    } catch (error) {
      this.errors.push({ test: testName, error: error.message });
      this.log(`Test failed: ${testName} - ${error.message}`, 'error');
    }
  }

  checkFileExists(filePath, description) {
    const fullPath = path.resolve(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing file: ${description} (${filePath})`);
    }
    return fullPath;
  }

  checkFileContent(filePath, searchText, description) {
    const fullPath = this.checkFileExists(filePath, description);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes(searchText)) {
      throw new Error(`Missing content in ${description}: "${searchText}"`);
    }
    return content;
  }

  async testCoreFiles() {
    // Check essential files exist
    this.checkFileExists('scripts/generate-cache-version.js', 'Cache version generator');
    this.checkFileExists('scripts/deployment-hook.js', 'Deployment hook');
    this.checkFileExists('lib/utils/auto-cache-updater.ts', 'Auto cache updater');
    this.checkFileExists('public/sw-force-update.js', 'Service worker');
    this.checkFileExists('.github/workflows/auto-deploy.yml', 'GitHub Actions workflow');
  }

  async testServiceWorker() {
    const swContent = this.checkFileContent(
      'public/sw-force-update.js',
      'CACHE_VERSION',
      'Service worker with cache version'
    );

    // Check for essential service worker features
    const requiredFeatures = [
      'install',
      'activate',
      'fetch',
      'caches.delete',
      'skipWaiting'
    ];

    for (const feature of requiredFeatures) {
      if (!swContent.includes(feature)) {
        throw new Error(`Service worker missing feature: ${feature}`);
      }
    }
  }

  async testCacheUpdater() {
    const updaterContent = this.checkFileContent(
      'lib/utils/auto-cache-updater.ts',
      'autoCacheUpdater',
      'Auto cache updater class'
    );

    // Check for essential updater features
    const requiredFeatures = [
      'checkForUpdates',
      'clearAllCaches',
      'cache-manifest.json',
      'serviceWorker.register'
    ];

    for (const feature of requiredFeatures) {
      if (!updaterContent.includes(feature)) {
        throw new Error(`Cache updater missing feature: ${feature}`);
      }
    }
  }

  async testLayoutIntegration() {
    const layoutContent = this.checkFileContent(
      'app/layout.tsx',
      'auto-cache-updater',
      'Layout with cache updater integration'
    );

    // Check for service worker registration
    if (!layoutContent.includes('sw-force-update.js')) {
      throw new Error('Layout missing service worker registration');
    }
  }

  async testPackageScripts() {
    const packagePath = this.checkFileExists('package.json', 'Package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    const requiredScripts = [
      'cache:generate',
      'cache:clear',
      'deploy:prod',
      'deploy:staging'
    ];

    for (const script of requiredScripts) {
      if (!packageContent.scripts || !packageContent.scripts[script]) {
        throw new Error(`Missing package.json script: ${script}`);
      }
    }
  }

  async testGitHubWorkflow() {
    const workflowContent = this.checkFileContent(
      '.github/workflows/auto-deploy.yml',
      'cache:generate',
      'GitHub Actions workflow'
    );

    // Check for essential workflow steps
    const requiredSteps = [
      'Generate Cache Version',
      'Build Application',
      'Execute Deployment Hook',
      'Verify Deployment Files'
    ];

    for (const step of requiredSteps) {
      if (!workflowContent.includes(step)) {
        throw new Error(`GitHub workflow missing step: ${step}`);
      }
    }
  }

  async testCacheGeneration() {
    try {
      // Test cache generation script
      this.log('Testing cache generation...');
      execSync('node scripts/generate-cache-version.js', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      // Check if files were generated
      const manifestPath = path.resolve(this.projectRoot, 'public/cache-manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Cache manifest not generated');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (!manifest.version || !manifest.timestamp) {
        throw new Error('Invalid cache manifest format');
      }

      // Check if service worker was updated
      const swContent = fs.readFileSync(
        path.resolve(this.projectRoot, 'public/sw-force-update.js'),
        'utf8'
      );
      
      if (!swContent.includes(manifest.version)) {
        throw new Error('Service worker not updated with new cache version');
      }

    } catch (error) {
      throw new Error(`Cache generation failed: ${error.message}`);
    }
  }

  async testBuildProcess() {
    try {
      this.log('Testing build process...');
      execSync('npm run build', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
    } catch (error) {
      throw new Error(`Build process failed: ${error.message}`);
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Cache System Tests', 'info');
    this.log('================================', 'info');

    await this.runTest('Core Files Check', () => this.testCoreFiles());
    await this.runTest('Service Worker Check', () => this.testServiceWorker());
    await this.runTest('Cache Updater Check', () => this.testCacheUpdater());
    await this.runTest('Layout Integration Check', () => this.testLayoutIntegration());
    await this.runTest('Package Scripts Check', () => this.testPackageScripts());
    await this.runTest('GitHub Workflow Check', () => this.testGitHubWorkflow());
    await this.runTest('Cache Generation Test', () => this.testCacheGeneration());
    await this.runTest('Build Process Test', () => this.testBuildProcess());

    this.printResults();
  }

  printResults() {
    this.log('================================', 'info');
    this.log('🏁 Test Results Summary', 'info');
    this.log('================================', 'info');

    this.log(`✅ Passed: ${this.passed.length}`, 'success');
    this.log(`❌ Failed: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'success');
    this.log(`⚠️  Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'success');

    if (this.errors.length > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      this.errors.forEach(({ test, error }) => {
        this.log(`  - ${test}: ${error}`, 'error');
      });
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  Warnings:', 'warning');
      this.warnings.forEach(warning => {
        this.log(`  - ${warning}`, 'warning');
      });
    }

    if (this.passed.length > 0) {
      this.log('\n✅ Passed Tests:', 'success');
      this.passed.forEach(test => {
        this.log(`  - ${test}`, 'success');
      });
    }

    this.log('================================', 'info');
    
    if (this.errors.length === 0) {
      this.log('🎉 All tests passed! Your cache invalidation system is ready for production.', 'success');
      process.exit(0);
    } else {
      this.log('🚨 Some tests failed. Please fix the issues before deploying.', 'error');
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new CacheSystemTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = CacheSystemTester;