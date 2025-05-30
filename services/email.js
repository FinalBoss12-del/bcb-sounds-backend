// services/email.js - Email service using Nodemailer
const nodemailer = require('nodemailer').default || require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('✉️  Email server is ready to send messages');
  }
});

// Send order confirmation to customer
async function sendOrderConfirmation(session) {
  const { customer_email, metadata, amount_total } = session;
  const { packageType, originalPrice, discountCode, discountAmount } = metadata;
  
  const mailOptions = {
    from: `"BCB Sounds" <${process.env.EMAIL_USER}>`,
    to: customer_email,
    subject: 'Order Confirmation - Your AI Music is Being Created! 🎵',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e63946; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          .button { display: inline-block; padding: 12px 30px; background: #e63946; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Order!</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>We've received your order and our AI is already hard at work creating your custom music! 🎵</p>
            
            <div class="order-details">
              <h2>Order Details</h2>
              <p><strong>Package:</strong> ${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package</p>
              <p><strong>Original Price:</strong> £${originalPrice}</p>
              ${discountCode !== 'none' ? `
                <p><strong>Discount Applied:</strong> ${discountCode} (-£${discountAmount})</p>
                <p><strong>Final Price:</strong> £${(amount_total / 100).toFixed(2)}</p>
              ` : `
                <p><strong>Total Paid:</strong> £${(amount_total / 100).toFixed(2)}</p>
              `}
            </div>
            
            <h3>What Happens Next?</h3>
            <ol>
              <li>Our AI will generate your custom track within 48-72 hours</li>
              <li>You'll receive an email with download links once ready</li>
              <li>Your track comes with full commercial rights</li>
            </ol>
            
            <p>Need to make changes or have questions? Just reply to this email!</p>
            
            <div class="footer">
              <p>BCB Sounds - AI-Powered Music Creation</p>
              <p>hello@bcbsounds.com</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Send notification to admin
async function sendAdminNotification(session) {
  const { customer_email, metadata, amount_total } = session;
  
  const mailOptions = {
    from: `"BCB Sounds System" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Send to business owner
    subject: `New Order: ${metadata.packageType} Package - £${(amount_total / 100).toFixed(2)}`,
    html: `
      <h2>New Order Received!</h2>
      <p><strong>Customer Email:</strong> ${customer_email}</p>
      <p><strong>Package:</strong> ${metadata.packageType}</p>
      <p><strong>Amount:</strong> £${(amount_total / 100).toFixed(2)}</p>
      <p><strong>Discount Used:</strong> ${metadata.discountCode || 'None'}</p>
      <p><strong>Session ID:</strong> ${session.id}</p>
      <hr>
      <p>Log into Stripe Dashboard to view full details.</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Send contact form email to business
async function sendContactFormEmail(data) {
  const { name, email, projectType, message } = data;
  
  const mailOptions = {
    from: `"BCB Sounds Contact Form" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `New Contact Form Submission - ${projectType}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Project Type:</strong> ${projectType}</p>
      <hr>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        You can reply directly to this email to respond to the customer.
      </p>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Send auto-reply to contact form submitter
async function sendContactAutoReply(data) {
  const { name, email } = data;
  
  const mailOptions = {
    from: `"BCB Sounds" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'We\'ve Received Your Message - BCB Sounds',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e63946;">Thank you for contacting BCB Sounds!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p>In the meantime, feel free to:</p>
        <ul>
          <li>Check out our <a href="${process.env.FRONTEND_URL}/samples">sample library</a></li>
          <li>Use our <a href="${process.env.FRONTEND_URL}/pricing">pricing calculator</a></li>
          <li>Learn more about our <a href="${process.env.FRONTEND_URL}/services">services</a></li>
        </ul>
        <p>Looking forward to creating amazing AI music for your project!</p>
        <br>
        <p>Best regards,<br>The BCB Sounds Team</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendOrderConfirmation,
  sendAdminNotification,
  sendContactFormEmail,
  sendContactAutoReply
};
