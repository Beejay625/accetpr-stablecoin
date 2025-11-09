# Setup Guide

## Prerequisites

1. **Reown Project ID**
   - Go to https://dashboard.reown.com
   - Create a new project
   - Copy your Project ID

2. **Clerk Authentication**
   - Go to https://dashboard.clerk.com
   - Create a new application
   - Copy your Publishable Key and Secret Key

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   NODE_ENV=development
   ```

## Running the Application

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3001 in your browser

## Backend Integration

Make sure your Express backend is running on port 3000 (or update `NEXT_PUBLIC_API_URL` accordingly).

The frontend will communicate with these backend endpoints:
- `GET /api/v1/protected/wallet/balance?chain={chain}`
- `GET /api/v1/protected/wallet/transactions/{chain}`
- `POST /api/v1/protected/wallet/withdraw/single`
- `POST /api/v1/protected/wallet/withdraw/batch`

All endpoints require Clerk authentication token in the Authorization header.

## Troubleshooting

### "Project ID is not defined" error
- Make sure `NEXT_PUBLIC_PROJECT_ID` is set in your `.env.local` file
- Restart the development server after adding environment variables

### Wallet connection issues
- Verify your Reown project ID is correct
- Check that your project is configured for the correct networks (Base, Arbitrum, Ethereum)

### Authentication issues
- Verify Clerk keys are correct
- Make sure Clerk is configured to allow your domain
- Check browser console for authentication errors

### API connection issues
- Verify backend is running on the correct port
- Check `NEXT_PUBLIC_API_URL` matches your backend URL
- Ensure CORS is configured correctly on the backend

