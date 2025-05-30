// config/stripe.js - Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Verify Stripe is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️  Warning: STRIPE_SECRET_KEY is not set');
}

module.exports = stripe;
