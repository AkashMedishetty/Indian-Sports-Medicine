const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Configuration schema
const configurationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: 'system' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

configurationSchema.index({ type: 1, key: 1 }, { unique: true });

const Configuration = mongoose.models.Configuration || mongoose.model('Configuration', configurationSchema);

async function fixEmailConfiguration() {
  await connectDB();
  
  console.log('🔍 Checking current email configuration...');
  
  // Get current email config
  const currentConfig = await Configuration.findOne({ 
    type: 'settings', 
    key: 'email_settings', 
    isActive: true 
  });
  
  if (currentConfig) {
    console.log('📧 Current email config found:', JSON.stringify(currentConfig.value, null, 2));
    
    // Update with environment variables
    const updatedConfig = {
      ...currentConfig.value,
      fromName: 'ISSH Midterm CME 2026',
      fromEmail: process.env.SMTP_USER || 'contact@isshmidtermcme2026.com',
      replyTo: process.env.SMTP_USER || 'contact@isshmidtermcme2026.com'
    };
    
    console.log('🔧 Updating email config to use environment variables...');
    
    await Configuration.findOneAndUpdate(
      { type: 'settings', key: 'email_settings' },
      { 
        value: updatedConfig,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Email configuration updated successfully!');
    console.log('📧 New config:', JSON.stringify(updatedConfig, null, 2));
    
  } else {
    console.log('⚠️  No existing email configuration found. Creating new one...');
    
    const newEmailConfig = {
      fromName: 'ISSH Midterm CME 2026',
      fromEmail: process.env.SMTP_USER || 'contact@isshmidtermcme2026.com',
      replyTo: process.env.SMTP_USER || 'contact@isshmidtermcme2026.com',
      enableTracking: true,
      enableAutoResponder: true,
      templates: {
        registration: {
          enabled: true,
          subject: 'Application Received - ISSH Midterm CME 2026'
        },
        payment: {
          enabled: true,
          subject: 'Payment Confirmation - ISSH Midterm CME 2026'
        },
        reminder: {
          enabled: true,
          subject: 'Payment Reminder - ISSH Midterm CME 2026'
        },
        bulkEmail: {
          enabled: true,
          subject: 'Important Update - ISSH Midterm CME 2026'
        }
      }
    };
    
    await Configuration.create({
      type: 'settings',
      key: 'email_settings',
      value: newEmailConfig,
      isActive: true,
      createdBy: 'system'
    });
    
    console.log('✅ New email configuration created!');
    console.log('📧 Config:', JSON.stringify(newEmailConfig, null, 2));
  }
  
  console.log('\n🎯 Email configuration now uses:');
  console.log('📧 From Email:', process.env.SMTP_USER || 'hello@violetvoyage.in');
  console.log('📧 SMTP Host:', process.env.SMTP_HOST || 'Not configured');
  console.log('📧 SMTP Port:', process.env.SMTP_PORT || 'Not configured');
  
  mongoose.connection.close();
}

// Run the fix
fixEmailConfiguration().catch(console.error);
