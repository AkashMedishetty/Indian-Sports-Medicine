// SMTP Connection Test Script
// Run with: node scripts/test-smtp.js

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testSMTP() {
  console.log('🧪 Testing SMTP Connection...\n');
  
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  
  console.log('📋 SMTP Configuration:');
  console.log('Host:', config.host || '❌ NOT SET');
  console.log('Port:', config.port);
  console.log('Secure:', config.secure);
  console.log('User:', config.auth.user || '❌ NOT SET');
  console.log('Pass:', config.auth.pass ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('');
  
  if (!config.host || !config.auth.user || !config.auth.pass) {
    console.error('❌ SMTP configuration incomplete!');
    console.log('Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local');
    process.exit(1);
  }
  
  try {
    const transporter = nodemailer.createTransport(config);
    
    console.log('🔄 Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('\n📧 Sending test email...');
    const result = await transporter.sendMail({
      from: config.auth.user,
      to: config.auth.user, // Send to self
      subject: 'SMTP Test Email',
      text: 'If you receive this, SMTP is working correctly!',
      html: '<h1>✅ SMTP Test Successful!</h1><p>Your email configuration is working properly.</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('\n🎉 All tests passed! SMTP is configured correctly.');
    
  } catch (error) {
    console.error('\n❌ SMTP Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    
    if (error.code === 'EAUTH') {
      console.log('1. Check your SMTP_PASS is correct');
      console.log('2. Try using an App Password instead of regular password');
      console.log('3. Enable "Allow less secure apps" if using Gmail');
    } else if (error.code === 'ECONNECTION') {
      console.log('1. Check SMTP_HOST is correct');
      console.log('2. Try port 465 with SMTP_SECURE=true');
      console.log('3. Check firewall/network settings');
    } else {
      console.log('1. Verify all SMTP credentials');
      console.log('2. Check email provider SMTP settings');
      console.log('3. Contact your email provider for support');
    }
    
    process.exit(1);
  }
}

testSMTP();
