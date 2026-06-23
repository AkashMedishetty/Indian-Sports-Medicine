#!/usr/bin/env node

/**
 * Deployment Hook Script
 * Automatically handles cache invalidation and version updates during deployment
 * Can be integrated with CI/CD pipelines (GitHub Actions, GitLab CI, etc.)
 */

const fs = require('fs');
const path = require('path');
const { generateCacheVersion, updateServiceWorker, createCacheManifest } = require('./generate-cache-version');

// Configuration
const config = {
  // Webhook URLs for notifying external services about deployment
  webhooks: {
    slack: process.env.SLACK_WEBHOOK_URL,
    discord: process.env.DISCORD_WEBHOOK_URL,
    teams: process.env.TEAMS_WEBHOOK_URL
  },
  
  // Deployment environment
  environment: process.env.NODE_ENV || 'production',
  
  // Git information
  gitBranch: process.env.GIT_BRANCH || 'main',
  gitCommit: process.env.GIT_COMMIT || '',
  
  // Build information
  buildNumber: process.env.BUILD_NUMBER || '',
  deploymentId: process.env.DEPLOYMENT_ID || Date.now().toString()
};

/**
 * Send notification to webhook
 */
async function sendWebhookNotification(webhookUrl, message) {
  if (!webhookUrl) return;
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const payload = {
      text: message,
      username: 'ISSH Midterm CME 2026 Deploy Bot',
      icon_emoji: ':rocket:'
    };
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('✅ Webhook notification sent');
  } catch (error) {
    console.warn('⚠️ Failed to send webhook notification:', error.message);
  }
}

/**
 * Create deployment manifest with metadata
 */
function createDeploymentManifest(version) {
  const manifest = {
    version,
    timestamp: Date.now(),
    deployedAt: new Date().toISOString(),
    environment: config.environment,
    git: {
      branch: config.gitBranch,
      commit: config.gitCommit,
      shortCommit: config.gitCommit.substring(0, 7)
    },
    build: {
      number: config.buildNumber,
      deploymentId: config.deploymentId
    },
    forceUpdate: true,
    features: {
      autoCacheUpdate: true,
      serviceWorkerForceUpdate: true,
      versionChecking: true
    }
  };
  
  const manifestPath = path.join(__dirname, '..', 'public', 'deployment-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ Deployment manifest created');
  
  return manifest;
}

/**
 * Update environment-specific configurations
 */
function updateEnvironmentConfig(version) {
  // Update next.config.mjs with cache headers
  const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
  
  if (fs.existsSync(nextConfigPath)) {
    let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Add cache version to headers
    const cacheVersionHeader = `
    // Auto-generated cache version: ${version}
    'X-Cache-Version': '${version}',
    'X-Deployment-Time': '${new Date().toISOString()}',`;
    
    // Insert after existing headers if they exist
    if (nextConfig.includes('headers: async () => [')) {
      nextConfig = nextConfig.replace(
        /(headers: async \(\) => \[\s*{[^}]*)(})/,
        `$1,${cacheVersionHeader}$2`
      );
      
      fs.writeFileSync(nextConfigPath, nextConfig, 'utf8');
      console.log('✅ Next.js config updated with cache version');
    }
  }
}

/**
 * Main deployment hook execution
 */
async function executeDeploymentHook() {
  console.log('🚀 Starting deployment hook...');
  console.log(`📋 Environment: ${config.environment}`);
  console.log(`🌿 Branch: ${config.gitBranch}`);
  console.log(`📝 Commit: ${config.gitCommit}`);
  
  try {
    // Step 1: Generate new cache version
    console.log('\n🔄 Step 1: Generating cache version...');
    const version = generateCacheVersion();
    
    // Step 2: Update service worker
    console.log('\n🔄 Step 2: Updating service worker...');
    updateServiceWorker(version);
    
    // Step 3: Create cache manifest
    console.log('\n🔄 Step 3: Creating cache manifest...');
    createCacheManifest(version);
    
    // Step 4: Create deployment manifest
    console.log('\n🔄 Step 4: Creating deployment manifest...');
    const deploymentManifest = createDeploymentManifest(version);
    
    // Step 5: Update environment config
    console.log('\n🔄 Step 5: Updating environment config...');
    updateEnvironmentConfig(version);
    
    // Step 6: Send notifications
    console.log('\n🔄 Step 6: Sending notifications...');
    const message = `🚀 ISSH Midterm CME 2026 deployed successfully!\n` +
                   `📦 Version: ${version}\n` +
                   `🌿 Branch: ${config.gitBranch}\n` +
                   `📝 Commit: ${config.gitCommit}\n` +
                   `⏰ Time: ${new Date().toISOString()}\n` +
                   `🔄 Cache will auto-update for all users`;
    
    // Send to all configured webhooks
    await Promise.all([
      sendWebhookNotification(config.webhooks.slack, message),
      sendWebhookNotification(config.webhooks.discord, message),
      sendWebhookNotification(config.webhooks.teams, message)
    ]);
    
    console.log('\n✅ Deployment hook completed successfully!');
    console.log(`🎯 Cache version: ${version}`);
    console.log('📱 Users will automatically receive the latest version');
    
    // Output for CI/CD systems
    if (process.env.CI) {
      console.log(`::set-output name=cache-version::${version}`);
      console.log(`::set-output name=deployment-time::${new Date().toISOString()}`);
    }
    
  } catch (error) {
    console.error('❌ Deployment hook failed:', error);
    
    // Send failure notification
    const errorMessage = `❌ ISSH Midterm CME 2026 deployment failed!\n` +
                        `🌿 Branch: ${config.gitBranch}\n` +
                        `📝 Commit: ${config.gitCommit}\n` +
                        `❌ Error: ${error.message}\n` +
                        `⏰ Time: ${new Date().toISOString()}`;
    
    await Promise.all([
      sendWebhookNotification(config.webhooks.slack, errorMessage),
      sendWebhookNotification(config.webhooks.discord, errorMessage),
      sendWebhookNotification(config.webhooks.teams, errorMessage)
    ]);
    
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  executeDeploymentHook();
}

module.exports = {
  executeDeploymentHook,
  createDeploymentManifest,
  updateEnvironmentConfig,
  sendWebhookNotification
};