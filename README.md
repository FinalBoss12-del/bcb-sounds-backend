# BCB Sounds Backend API

Backend service for BCB Sounds AI Music Generation Platform.

## Features

- ✅ Stripe payment processing with discount codes
- ✅ Email notifications (order confirmations, contact forms)
- ✅ CORS configuration for frontend integration
- ✅ Rate limiting and security headers
- ✅ Webhook handling for payment events

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Add your environment variables to `.env`

4. Run the server:
   ```bash
   npm run dev
   ```

## Testing

Test the health check:
```bash
curl http://localhost:3001/health
```

Test Stripe connection:
```bash
curl http://localhost:3001/api/stripe-test
```

## Environment Variables

Required variables in your `.env` file:
- `FRONTEND_URL` - Your frontend URL
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe webhook settings
- `EMAIL_USER` - Gmail address
- `EMAIL_PASS` - Gmail app-specific password

## Deployment to Railway

1. Push to GitHub
2. Connect repository to Railway
3. Add environment variables
4. Deploy!

See full documentation in the repository.
