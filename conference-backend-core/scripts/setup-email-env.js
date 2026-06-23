const path = require('path');
const fs = require('fs');

// Check if .env.local exists and has SMTP settings
const envPath = path.join(__dirname, '..', '.env.local');

console.log('🔍 Checking email environment configuration...');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  const smtpSettings = {};
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (key.startsWith('SMTP_') || key.startsWith('EMAIL_')) {
        smtpSettings[key] = value;
      }
    }
  });
  
  console.log('\n📧 Current SMTP Settings:');
  console.log('SMTP_HOST:', smtpSettings.SMTP_HOST || 'NOT SET');
  console.log('SMTP_USER:', smtpSettings.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASS:', smtpSettings.SMTP_PASS ? 'SET (hidden)' : 'NOT SET');
  console.log('SMTP_PORT:', smtpSettings.SMTP_PORT || 'NOT SET');
  console.log('SMTP_SECURE:', smtpSettings.SMTP_SECURE || 'NOT SET');
  
  if (!smtpSettings.SMTP_HOST || !smtpSettings.SMTP_USER || !smtpSettings.SMTP_PASS) {
    console.log('\n⚠️  SMTP configuration is incomplete!');
    console.log('\n📝 To fix email issues, add these to your .env.local file:');
    console.log('SMTP_HOST=your-smtp-server.com');
    console.log('SMTP_USER=your-email@yourdomain.com');
    console.log('SMTP_PASS=your-password');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    console.log('\n💡 For Gmail:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your-app-password');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    
    console.log('\n🔒 Note: For Gmail, use an App Password, not your regular password!');
    console.log('Generate one at: https://myaccount.google.com/apppasswords');
  } else {
    console.log('\n✅ SMTP configuration looks complete!');
    
    // Test the configuration
    console.log('\n🧪 Email service will simulate sending until proper SMTP is configured.');
    console.log('Check the console logs when sending emails to see the simulation output.');
  }
  
} else {
  console.log('❌ .env.local file not found!');
  console.log('Create one with your SMTP settings for email functionality.');
}

console.log('\n🎯 To fix the current email error:');
console.log('The error "MAILFROM must be a valid domain" means:');
console.log('1. Use a real email address in SMTP_USER');
console.log('2. Make sure the domain has proper MX records');
console.log('3. Or use a service like Gmail/Outlook for testing');
