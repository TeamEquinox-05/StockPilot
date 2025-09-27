const twilio = require('twilio');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+14155238886'

let twilioClient = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

// Initialize Nodemailer transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // You can use gmail, outlook, etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Use app password for Gmail
    }
  });
};

// Generate Purchase Order PDF buffer for attachments
const generatePurchaseOrderPDF = (order) => {
  try {
    const jsPDF = require('jspdf');
    const doc = new jsPDF();
    
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN');
    const expectedDelivery = new Date(order.expectedDelivery).toLocaleDateString('en-IN');
    const createdDate = new Date().toLocaleDateString('en-IN');
    
    let yPosition = 20;
    const leftMargin = 20;
    const rightMargin = 190;
    const lineHeight = 6;
    
    // Helper function to add text and move to next line
    const addLine = (text, fontSize = 10, style = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', style);
      doc.text(text, leftMargin, yPosition);
      yPosition += lineHeight;
    };
    
    // Helper function to add centered text
    const addCenteredLine = (text, fontSize = 10, style = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', style);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (210 - textWidth) / 2, yPosition);
      yPosition += lineHeight;
    };
    
    // Header
    addCenteredLine('PURCHASE ORDER', 20, 'bold');
    yPosition += 5;
    
    // Order Information
    addLine(`Order Number: ${order.orderNumber}`, 12, 'bold');
    addLine(`Order Date: ${orderDate}`);
    addLine(`Status: ${order.status}`);
    addLine(`Priority: ${order.priority}`);
    yPosition += 5;
    
    // Vendor Information
    addLine('VENDOR INFORMATION', 14, 'bold');
    addLine(`Name: ${order.vendor_id.vendor_name}`);
    addLine(`Phone: ${order.vendor_id.phone}`);
    addLine(`Email: ${order.vendor_id.email}`);
    addLine(`Address: ${order.vendor_id.address}`);
    if (order.vendor_id.gst_number) {
      addLine(`GST Number: ${order.vendor_id.gst_number}`);
    }
    if (order.vendor_id.payment_terms) {
      addLine(`Payment Terms: ${order.vendor_id.payment_terms}`);
    }
    yPosition += 5;
    
    // Order Details
    addLine('ORDER DETAILS', 14, 'bold');
    addLine(`Expected Delivery: ${expectedDelivery}`);
    yPosition += 5;
    
    // Items Header
    addLine('ITEMS', 14, 'bold');
    yPosition += 2;
    
    // Table Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', leftMargin, yPosition);
    doc.text('Qty', 90, yPosition);
    doc.text('Rate', 110, yPosition);
    doc.text('Amount', 150, yPosition);
    yPosition += lineHeight;
    
    // Draw line under header
    doc.line(leftMargin, yPosition - 2, rightMargin, yPosition - 2);
    yPosition += 2;
    
    // Items
    doc.setFont('helvetica', 'normal');
    order.items.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(`${index + 1}. ${item.productName}`, leftMargin, yPosition);
      doc.text(`${item.quantity}`, 90, yPosition);
      doc.text(`₹${item.estimatedRate.toLocaleString('en-IN')}`, 110, yPosition);
      doc.text(`₹${item.amount.toLocaleString('en-IN')}`, 150, yPosition);
      yPosition += lineHeight;
      
      if (item.description) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`   ${item.description}`, leftMargin, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      }
    });
    
    yPosition += 5;
    
    // Total Line
    doc.line(leftMargin, yPosition, rightMargin, yPosition);
    yPosition += 5;
    
    // Total Amount
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 110, yPosition);
    doc.text(`₹${order.totalAmount.toLocaleString('en-IN')}`, 150, yPosition);
    yPosition += 10;
    
    // Terms & Conditions
    if (order.terms) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(order.terms, rightMargin - leftMargin);
      doc.text(termsLines, leftMargin, yPosition);
      yPosition += termsLines.length * lineHeight + 5;
    }
    
    // Notes
    if (order.notes) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(order.notes, rightMargin - leftMargin);
      doc.text(notesLines, leftMargin, yPosition);
      yPosition += notesLines.length * lineHeight + 5;
    }
    
    // Footer
    yPosition = 280;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    addCenteredLine(`Generated on: ${createdDate}`);
    
    // Return PDF as buffer
    return Buffer.from(doc.output('arraybuffer'));
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to text content
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN');
    const expectedDelivery = new Date(order.expectedDelivery).toLocaleDateString('en-IN');
    
    const content = `
PURCHASE ORDER
===============================================

Order Number: ${order.orderNumber}
Order Date: ${orderDate}
Status: ${order.status}
Priority: ${order.priority}

VENDOR INFORMATION
===============================================
Name: ${order.vendor_id.vendor_name}
Phone: ${order.vendor_id.phone}
Email: ${order.vendor_id.email}
Address: ${order.vendor_id.address}
GST Number: ${order.vendor_id.gst_number || 'N/A'}
Payment Terms: ${order.vendor_id.payment_terms || 'N/A'}

ORDER DETAILS
===============================================
Expected Delivery: ${expectedDelivery}

ITEMS
===============================================
${order.items.map((item, index) => `
${index + 1}. ${item.productName}
   Description: ${item.description || 'N/A'}
   Quantity: ${item.quantity}
   Rate: ₹${item.estimatedRate.toLocaleString('en-IN')}
   Amount: ₹${item.amount.toLocaleString('en-IN')}
`).join('')}

TOTALS
===============================================
Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}

TERMS & CONDITIONS
===============================================
${order.terms || 'No specific terms mentioned.'}

NOTES
===============================================
${order.notes || 'No additional notes.'}

===============================================
Generated on: ${new Date().toLocaleString('en-IN')}
    `.trim();

    return Buffer.from(content, 'utf8');
  }
};

// Send WhatsApp message with purchase order
const sendWhatsAppMessage = async (vendorPhone, purchaseOrder) => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio client not initialized. Please check your Twilio credentials in .env file.');
    }

    if (!twilioWhatsAppNumber) {
      throw new Error('Twilio WhatsApp number not configured in .env file.');
    }

    // Format phone number for WhatsApp
    let formattedPhone;
    if (vendorPhone.startsWith('+')) {
      formattedPhone = `whatsapp:${vendorPhone}`;
    } else if (vendorPhone.startsWith('91')) {
      formattedPhone = `whatsapp:+${vendorPhone}`;
    } else {
      formattedPhone = `whatsapp:+91${vendorPhone}`;
    }
    
    const message = `🛒 *New Purchase Order*

📋 Order Number: ${purchaseOrder.orderNumber}
📅 Order Date: ${new Date(purchaseOrder.orderDate).toLocaleDateString('en-IN')}
🚚 Expected Delivery: ${new Date(purchaseOrder.expectedDelivery).toLocaleDateString('en-IN')}
⚡ Priority: ${purchaseOrder.priority}
💰 Total Amount: ₹${purchaseOrder.totalAmount.toLocaleString('en-IN')}

📦 Items (${purchaseOrder.items.length}):
${purchaseOrder.items.map((item, index) => 
  `${index + 1}. ${item.productName} - Qty: ${item.quantity} - ₹${item.amount.toLocaleString('en-IN')}`
).join('\n')}

📝 Notes: ${purchaseOrder.notes || 'No additional notes'}

Please confirm receipt of this purchase order. Thank you!`;

    console.log(`Attempting to send WhatsApp message from: ${twilioWhatsAppNumber} to: ${formattedPhone}`);

    const result = await twilioClient.messages.create({
      from: twilioWhatsAppNumber,
      body: message,
      to: formattedPhone
    });

    console.log(`WhatsApp message sent successfully. SID: ${result.sid}`);
    return { success: true, sid: result.sid, message: 'WhatsApp message sent successfully' };

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    // Provide specific error messages based on Twilio error codes
    let errorMessage = error.message;
    
    if (error.code === 63007) {
      errorMessage = `WhatsApp Channel Error: The phone number ${twilioWhatsAppNumber} is not properly configured for WhatsApp. 

For Twilio Sandbox:
1. Use the sandbox number: whatsapp:+14155238886
2. Have the recipient join sandbox by sending "join <sandbox-code>" to +1 415 523 8886

For Production:
1. Verify your Twilio account
2. Set up WhatsApp Business API
3. Use an approved WhatsApp number

Current config: FROM=${twilioWhatsAppNumber}`;
    } else if (error.code === 21211) {
      errorMessage = 'Invalid phone number format. Please ensure the recipient phone number is valid.';
    } else if (error.code === 21408) {
      errorMessage = 'WhatsApp recipient has not opted in. They need to send a message to your WhatsApp number first.';
    } else if (error.status === 400) {
      errorMessage = `Twilio API Error: ${error.message}. Please check your Twilio configuration.`;
    }
    
    return { success: false, error: errorMessage, code: error.code };
  }
};

// Send email with purchase order PDF attachment
const sendEmailWithPurchaseOrder = async (vendorEmail, vendorName, purchaseOrder) => {
  try {
    const transporter = createEmailTransporter();
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email credentials not configured.');
    }

    // Generate PDF content as attachment
    const pdfBuffer = generatePurchaseOrderPDF(purchaseOrder);
    
    const mailOptions = {
      from: {
        name: 'StockPilot - Purchase Department',
        address: process.env.EMAIL_USER
      },
      to: vendorEmail,
      subject: `Purchase Order ${purchaseOrder.orderNumber} - Action Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #333; margin: 0;">🛒 New Purchase Order</h1>
          </div>
          
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p>Dear <strong>${vendorName}</strong>,</p>
            
            <p>We are pleased to send you the following purchase order:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Order Number:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${purchaseOrder.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Order Date:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(purchaseOrder.orderDate).toLocaleDateString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Expected Delivery:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(purchaseOrder.expectedDelivery).toLocaleDateString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Priority:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${purchaseOrder.priority}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Total Amount:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #28a745; font-weight: bold;">₹${purchaseOrder.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </table>
            
            <h3 style="color: #333;">Items Ordered:</h3>
            <ul style="list-style-type: none; padding: 0;">
              ${purchaseOrder.items.map((item, index) => `
                <li style="background-color: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px;">
                  <strong>${index + 1}. ${item.productName}</strong><br>
                  <small>Quantity: ${item.quantity} | Rate: ₹${item.estimatedRate.toLocaleString('en-IN')} | Amount: ₹${item.amount.toLocaleString('en-IN')}</small>
                  ${item.description ? `<br><em>${item.description}</em>` : ''}
                </li>
              `).join('')}
            </ul>
            
            ${purchaseOrder.notes ? `
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">📝 Additional Notes:</h4>
                <p style="margin: 0; color: #856404;">${purchaseOrder.notes}</p>
              </div>
            ` : ''}
            
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #004085;">📄 Attached Documents:</h4>
              <p style="margin: 0; color: #004085;">Please find the detailed purchase order document attached to this email.</p>
            </div>
            
            <p style="margin-top: 30px;">Please confirm receipt of this purchase order and provide your acceptance along with the expected delivery schedule.</p>
            
            <p>If you have any questions or need clarification, please don't hesitate to contact us.</p>
            
            <p>Thank you for your continued partnership.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
              <p><strong>StockPilot - Purchase Department</strong><br>
              This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `${purchaseOrder.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully. Message ID: ${result.messageId}`);
    return { success: true, messageId: result.messageId, message: 'Email sent successfully' };

  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Main function to send notifications based on selected options
const sendPurchaseOrderNotifications = async (purchaseOrder, notifications) => {
  const results = {
    whatsapp: null,
    email: null
  };

  try {
    const vendor = purchaseOrder.vendor_id;

    // Send WhatsApp if requested
    if (notifications.whatsapp && vendor.phone) {
      console.log('Sending WhatsApp message...');
      results.whatsapp = await sendWhatsAppMessage(vendor.phone, purchaseOrder);
    }

    // Send Email if requested
    if (notifications.email && vendor.email) {
      console.log('Sending email...');
      results.email = await sendEmailWithPurchaseOrder(vendor.email, vendor.vendor_name, purchaseOrder);
    }

    return results;

  } catch (error) {
    console.error('Error in sendPurchaseOrderNotifications:', error);
    return {
      whatsapp: notifications.whatsapp ? { success: false, error: error.message } : null,
      email: notifications.email ? { success: false, error: error.message } : null
    };
  }
};

// Test Twilio connection
const testTwilioConnection = async () => {
  try {
    if (!twilioClient) {
      return { success: false, error: 'Twilio client not initialized' };
    }

    const account = await twilioClient.api.accounts(accountSid).fetch();
    return { success: true, message: 'Twilio connection successful', account: account.friendlyName };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    return { success: true, message: 'Email connection successful' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPurchaseOrderNotifications,
  sendWhatsAppMessage,
  sendEmailWithPurchaseOrder,
  testTwilioConnection,
  testEmailConnection
};