// routes/payment.js - Payment and Stripe routes
const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const { sendOrderConfirmation, sendAdminNotification } = require('../services/email');
const { applyDiscount } = require('../utils/discounts');

// Test Stripe connection
router.get('/stripe-test', async (req, res) => {
  try {
    // Try to retrieve account details to verify connection
    const account = await stripe.accounts.retrieve();
    res.json({ 
      status: 'connected',
      mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live',
      message: 'Stripe is properly configured'
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Stripe connection failed',
      error: error.message 
    });
  }
});

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { packageType, price, discountCode, customerEmail } = req.body;
    
    // Validate input
    if (!packageType || !price) {
      return res.status(400).json({ error: 'Package type and price are required' });
    }

    // Apply discount if provided
    let finalPrice = price;
    let appliedDiscount = null;
    
    if (discountCode) {
      const discountResult = applyDiscount(price, discountCode);
      finalPrice = discountResult.finalPrice;
      appliedDiscount = discountResult.discount;
    }

    // Convert price to pence for Stripe
    const priceInPence = Math.round(finalPrice * 100);

    // Package descriptions
    const packageDescriptions = {
      basic: 'Basic Package - 30 second AI-generated track',
      standard: 'Standard Package - 60 second professional soundtrack',
      premium: 'Premium Package - Complete audio branding suite',
      enterprise: 'Enterprise Package - Custom solution'
    };

    // Create line items
    const lineItems = [{
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `BCB Sounds - ${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package`,
          description: packageDescriptions[packageType] || 'Custom AI-generated music',
        },
        unit_amount: priceInPence,
      },
      quantity: 1,
    }];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: customerEmail,
      metadata: {
        packageType,
        originalPrice: price,
        discountCode: discountCode || 'none',
        discountAmount: appliedDiscount ? appliedDiscount.amount : 0
      },
      // Enable billing address collection
      billing_address_collection: 'required',
      // Enable promotion codes in Stripe checkout
      allow_promotion_codes: true,
    });

    res.json({ 
      sessionId: session.id,
      url: session.url,
      appliedDiscount: appliedDiscount
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Stripe webhook endpoint
router.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Handle successful payment
      console.log('Payment successful for session:', session.id);
      
      // Send confirmation emails
      try {
        // Send customer confirmation
        await sendOrderConfirmation(session);
        
        // Send admin notification
        await sendAdminNotification(session);
        
        console.log('Confirmation emails sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the webhook if email fails
      }
      
      break;
      
    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object;
      console.log('Payment failed:', paymentIntent.id);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

// Get order details (for success page)
router.get('/order/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      customerEmail: session.customer_email,
      amountTotal: session.amount_total / 100, // Convert back to pounds
      packageType: session.metadata.packageType,
      paymentStatus: session.payment_status
    });
    
  } catch (error) {
    console.error('Order retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

module.exports = router;
