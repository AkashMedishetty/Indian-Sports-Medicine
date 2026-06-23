# Email System Configuration

## Overview

The OSSAPCON 2026 email system provides automated email functionality for:
- Registration confirmations
- Payment confirmations with invoices
- Password reset emails
- Bulk administrative emails
- Conference reminders

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# SMTP Configuration (Required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Alternative naming (also supported)
EMAIL_USER=your-email@gmail.com  
EMAIL_PASS=your-app-password

# Application Settings
APP_NAME=OSSAPCON 2026
APP_URL=https://your-domain.com

# NextAuth Secret (Required for password reset tokens)
NEXTAUTH_SECRET=your-secret-key
```

## Gmail SMTP Setup

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication

### 2. Generate App Password
- Go to Google Account > Security > 2-Step Verification > App passwords
- Select "Mail" and your device
- Copy the generated 16-character password
- Use this as your `SMTP_PASS` or `EMAIL_PASS`

### 3. Alternative: OAuth2 (Advanced)
For production environments, consider using OAuth2 instead of app passwords.

## Other Email Providers

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo Mail
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Custom SMTP Server
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Email Templates

Templates are automatically styled with conference branding and include:

### Registration Confirmation
- Sent immediately after user registration
- Contains registration ID and next steps
- Includes conference details

### Payment Confirmation
- Sent after successful payment
- Contains transaction details and breakdown
- Serves as invoice receipt

### Password Reset
- Secure token-based reset link
- 1-hour expiration
- Security warnings included

### Bulk Email
- Admin-generated communications
- Recipient filtering and segmentation
- Send status tracking

## Testing Email Functionality

### 1. Test Registration Email
```bash
# Register a new user through the frontend
# Check console logs for email sending status
```

### 2. Test Password Reset
```bash
# Visit /auth/forgot-password
# Enter your email address
# Check both inbox and spam folders
```

### 3. Test Admin Bulk Email
```bash
# Login as admin user
# Visit /admin/emails
# Send test email to yourself
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check if 2FA is enabled
   - Verify app password is correct
   - Ensure no spaces in credentials

2. **Connection Timeout**
   - Check SMTP host and port
   - Verify firewall settings
   - Try different SMTP port (465 for SSL)

3. **Emails Going to Spam**
   - Set up SPF records for your domain
   - Configure DKIM signing
   - Use a professional from address

### Debug Mode

Enable email debugging by adding:
```bash
DEBUG_EMAIL=true
```

This will log detailed SMTP communication to the console.

## Production Considerations

### 1. Email Service Providers
For production, consider using:
- **SendGrid** - High deliverability
- **Mailgun** - Developer-friendly
- **AWS SES** - Cost-effective
- **Resend** - Modern alternative

### 2. Rate Limiting
Current settings:
- Batch size: 10 emails per batch
- Delay: 1 second between batches
- Configurable via admin settings

### 3. Monitoring
- Failed email attempts are logged
- Admin dashboard shows email statistics
- Error tracking for troubleshooting

### 4. Security
- Credentials stored as environment variables
- No sensitive data in email logs
- Token-based password reset system
- Email template sanitization

## Configuration Management

Email settings can be managed through:
1. Environment variables (server-level)
2. Admin configuration panel (application-level)
3. Database configuration (dynamic settings)

## API Endpoints

### Send Registration Confirmation
```javascript
POST /api/auth/register
// Automatically sends registration email
```

### Send Password Reset
```javascript
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

### Bulk Email (Admin Only)
```javascript
POST /api/admin/bulk-email
{
  "subject": "Conference Update",
  "content": "Email content here",
  "recipients": ["email1@example.com", "email2@example.com"],
  "senderName": "Conference Team"
}
```

## Support

For email-related issues:
1. Check environment variables
2. Verify SMTP credentials  
3. Test with a simple email client
4. Check application logs
5. Contact system administrator

---

**Note:** Always test email functionality in a development environment before deploying to production.