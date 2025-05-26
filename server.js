const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your website to talk to this server
app.use(cors({
    origin: ['https://bcbsounds.com', 'https://www.bcbsounds.com', 'http://localhost:3000']
}));
app.use(express.json());

// Email setup - this sends emails when someone orders
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// This creates a payment (when someone clicks "Pay Now")
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'gbp', customerEmail, orderDetails } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert pounds to pence
            currency: currency,
            metadata: {
                customerEmail,
                package: orderDetails.package,
                projectDetails: orderDetails.message
            }
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// This runs after successful payment - sends confirmation emails
app.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
            const orderId = `BCB-${Date.now()}`;
            
            // Email to customer
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: paymentIntent.metadata.customerEmail,
                subject: `Order Confirmation - ${orderId}`,
                html: `
                    <h2>🎵 Thank you for your order!</h2>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Package:</strong> ${paymentIntent.metadata.package}</p>
                    <p><strong>Amount:</strong> £${paymentIntent.amount / 100}</p>
                    <p><strong>Your Brief:</strong> ${paymentIntent.metadata.projectDetails}</p>
                    <hr>
                    <p>✅ We'll start creating your custom AI track now!</p>
                    <p>📅 Delivery: Within 72 hours</p>
                    <p>❓ Questions? Just reply to this email.</p>
                    <br>
                    <p>Thanks,<br>BCB Sounds Team</p>
                `
            });
            
            // Email to you (so you know there's a new order)
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: 'hello@bcbsounds.com',
                subject: `🔥 NEW ORDER - ${orderId}`,
                html: `
                    <h2>💰 New Order Alert!</h2>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Customer:</strong> ${paymentIntent.metadata.customerEmail}</p>
                    <p><strong>Package:</strong> ${paymentIntent.metadata.package}</p>
                    <p><strong>Amount:</strong> £${paymentIntent.amount / 100}</p>
                    <hr>
                    <p><strong>What they want:</strong></p>
                    <p>${paymentIntent.metadata.projectDetails}</p>
                    <hr>
                    <p>👆 Time to create their track!</p>
                `
            });
            
            res.send({ success: true, orderId });
        } else {
            res.status(400).send({ error: 'Payment failed' });
        }
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Handle contact form (non-payment inquiries)
app.post('/contact', async (req, res) => {
    try {
        const { name, email, company, package, message } = req.body;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'hello@bcbsounds.com',
            subject: '📧 New Contact Form Message',
            html: `
                <h2>New Website Inquiry</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Company:</strong> ${company || 'Not specified'}</p>
                <p><strong>Interested in:</strong> ${package}</p>
                <hr>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        });
        
        res.send({ success: true });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Payment server is running!`);
});
