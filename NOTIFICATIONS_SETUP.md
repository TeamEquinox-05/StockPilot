# Purchase Order Notifications Setup

This guide explains how to set up WhatsApp and Email notifications for purchase orders.

## 🚀 Features

- **📱 WhatsApp Notifications**: Send purchase order details via WhatsApp using Twilio
- **📧 Email Notifications**: Send detailed purchase orders with PDF attachments via email
- **📄 PDF Generation**: Automatic PDF creation for professional purchase orders
- **✅ Delivery Confirmation**: Real-time status updates for sent notifications

## 📋 Prerequisites

### For WhatsApp (Twilio)
1. **Twilio Account**: Sign up at [https://www.twilio.com](https://www.twilio.com)
2. **WhatsApp Business API**: Enable Twilio's WhatsApp service
3. **Phone Number Verification**: Verify your Twilio phone number

### For Email (Gmail)
1. **Gmail Account**: Use a Gmail account for sending emails
2. **2-Factor Authentication**: Enable 2FA on your Google account
3. **App Password**: Generate an app-specific password

## ⚙️ Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=yourcompany@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

### 2. Twilio Setup Steps

1. **Create Twilio Account**
   - Visit [Twilio Console](https://console.twilio.com/)
   - Note down your `Account SID` and `Auth Token`

2. **Enable WhatsApp**
   - Go to Messaging > Try it out > Send a WhatsApp message
   - Follow the sandbox setup instructions
   - Note down the WhatsApp number (e.g., `whatsapp:+14155238886`)

3. **Test WhatsApp**
   - Send a message to your Twilio WhatsApp number
   - Follow the instructions to join the sandbox

### 3. Gmail Setup Steps

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security > 2-Step Verification > Turn on

2. **Generate App Password**
   - Go to Google Account > Security
   - App passwords > Generate new password
   - Select "Mail" as the app type
   - Copy the 16-character password

3. **Update Environment Variables**
   ```bash
   EMAIL_USER=yourcompany@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # Your app password
   ```

## 🧪 Testing

### Test API Endpoint
```bash
GET /api/purchase-orders/test-notifications
```

This endpoint tests both Twilio and email connections:

```json
{
  "twilio": {
    "success": true,
    "message": "Twilio connection successful",
    "account": "Your Account Name"
  },
  "email": {
    "success": true,
    "message": "Email connection successful"
  }
}
```

### Frontend Testing
1. Create a new purchase order
2. Select notification options (WhatsApp/Email)
3. Choose a vendor with valid phone/email
4. Submit the order
5. Check for success/error messages

## 📱 How It Works

### WhatsApp Flow
1. User checks WhatsApp option
2. System validates vendor phone number
3. Formats phone for WhatsApp (`whatsapp:+919876543210`)
4. Sends formatted message with order details
5. Returns success/failure status

### Email Flow
1. User checks Email option
2. System validates vendor email
3. Generates PDF of purchase order
4. Creates HTML email with order details
5. Attaches PDF and sends email
6. Returns delivery status

### Message Format

#### WhatsApp Message
```
🛒 *New Purchase Order*

📋 Order Number: PO-2025-09-0001
📅 Order Date: 27/09/2025
🚚 Expected Delivery: 05/10/2025
⚡ Priority: High
💰 Total Amount: ₹50,000

📦 Items (3):
1. Product A - Qty: 10 - ₹15,000
2. Product B - Qty: 5 - ₹20,000
3. Product C - Qty: 2 - ₹15,000

📝 Notes: Urgent delivery required

Please confirm receipt of this purchase order. Thank you!
```

#### Email Content
- **Professional HTML template**
- **Complete order details table**
- **Itemized list with descriptions**
- **PDF attachment with full order**
- **Company branding and contact info**

## 🔧 Troubleshooting

### Common Issues

#### Twilio Errors
- **Invalid credentials**: Check Account SID and Auth Token
- **WhatsApp number not verified**: Complete sandbox setup
- **Phone format error**: Ensure number includes country code

#### Email Errors
- **Authentication failed**: Verify app password is correct
- **2FA required**: Enable 2-factor authentication first
- **Service error**: Check if Gmail service is specified correctly

#### PDF Generation Issues
- **Canvas errors**: Ensure canvas package is installed correctly
- **Font issues**: Use standard fonts (helvetica, times, courier)
- **Memory issues**: For large orders, consider pagination

### Debug Tips

1. **Check Environment Variables**
   ```javascript
   console.log('Twilio SID:', process.env.TWILIO_ACCOUNT_SID);
   console.log('Email User:', process.env.EMAIL_USER);
   ```

2. **Test Individual Services**
   ```bash
   # Test only Twilio
   GET /api/purchase-orders/test-notifications

   # Check server logs
   tail -f server.log
   ```

3. **Verify Vendor Data**
   - Ensure phone numbers include country code
   - Validate email addresses are properly formatted
   - Check for special characters in contact info

## 📚 API Reference

### Create Purchase Order with Notifications

```javascript
POST /api/purchase-orders

{
  "vendorId": "vendor_id_here",
  "orderDate": "2025-09-27",
  "expectedDelivery": "2025-10-05",
  "priority": "High",
  "items": [...],
  "notes": "Special instructions",
  "terms": "Payment terms",
  "notifications": {
    "whatsapp": true,
    "email": true
  }
}
```

### Response Format

```javascript
{
  "purchaseOrder": { ... },
  "message": "Purchase order created successfully",
  "notifications": {
    "whatsapp": {
      "success": true,
      "sid": "SM1234567890abcdef",
      "message": "WhatsApp message sent successfully"
    },
    "email": {
      "success": true,
      "messageId": "<unique-message-id>",
      "message": "Email sent successfully"
    }
  }
}
```

## 🚀 Production Deployment

### Twilio Production Setup
1. **Upgrade Account**: Move from sandbox to production
2. **Verify WhatsApp Business**: Complete business verification
3. **Phone Number**: Purchase a dedicated Twilio phone number
4. **Rate Limits**: Configure appropriate sending limits

### Email Production Setup
1. **Domain Email**: Use company domain instead of Gmail
2. **SMTP Service**: Consider dedicated email services (SendGrid, Mailgun)
3. **Delivery Tracking**: Implement email delivery tracking
4. **Bounce Handling**: Set up bounce and complaint handling

### Security Best Practices
1. **Environment Variables**: Never commit credentials to version control
2. **API Rate Limiting**: Implement rate limiting for notification endpoints
3. **Input Validation**: Validate all phone numbers and email addresses
4. **Error Logging**: Log failures for monitoring and debugging
5. **Retry Logic**: Implement exponential backoff for failed sends

---

## 🎉 You're Ready!

Your purchase order notification system is now configured and ready to use! Users can now:

- ✅ Create purchase orders with auto-generated sequential numbers
- ✅ Send WhatsApp notifications to vendors
- ✅ Send professional emails with PDF attachments
- ✅ Track delivery status for all notifications
- ✅ Download PDF purchase orders for record keeping

Need help? Check the troubleshooting section or test your setup using the provided API endpoints.