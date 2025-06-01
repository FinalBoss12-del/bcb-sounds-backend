// routes/contact.js - Contact form routes
const express = require('express');
const router = express.Router();
const { sendContactFormEmail, sendContactAutoReply } = require('../services/email');

// Handle contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, projectType, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Name, email, and message are required' 
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    // Send email to business owner
    await sendContactFormEmail({
      name,
      email,
      projectType: projectType || 'Not specified',
      message
    });

    // Send auto-reply to customer
    await sendContactAutoReply({
      name,
      email
    });

    res.json({ 
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
