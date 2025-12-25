# Deployment Guide for School Management System

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2. **Firebase Project**: You need a Firebase project with Firestore and Auth enabled.
3. **GitHub Repository**: Push this code to a GitHub repository.

## Environment Variables

You need to configure the following environment variables in Vercel.
You can find these in your Firebase Console (Project Settings).

### Client-Side Variables (Public)

These are used by the browser to connect to Firebase.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Server-Side Variables (Secret)

This is used by the server to manage users and data securely.

- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `FIREBASE_ADMIN_EMAIL` (Optional: for seeding the main admin account)
- `FIREBASE_ADMIN_PASSWORD` (Optional: for seeding the main admin account)

**How to get `FIREBASE_SERVICE_ACCOUNT_KEY`:**

1. Go to Firebase Console > Project Settings > Service accounts.
2. Click "Generate new private key".
3. Open the downloaded JSON file.
4. Copy the *entire content* of the JSON file.
5. In Vercel, paste this JSON string as the value for `FIREBASE_SERVICE_ACCOUNT_KEY`.
    - *Note*: Ensure there are no extra spaces or newlines if possible, though Vercel handles them well.

## Deployment Steps

### Option 1: Vercel Dashboard (Recommended)

1. Go to your Vercel Dashboard.
2. Click **"Add New..."** > **"Project"**.
3. Import your GitHub repository.
4. In the **"Configure Project"** section:
    - **Framework Preset**: Next.js (should be detected automatically).
    - **Root Directory**: `./` (default).
    - **Environment Variables**: Add all the variables listed above.
5. Click **"Deploy"**.

### Option 2: Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Run deployment: `vercel`
4. Follow the prompts. When asked about environment variables, you can choose to link to the existing project or add them manually.

## Troubleshooting

- **Database Connection Error**: If you see this on the dashboard, it means `FIREBASE_SERVICE_ACCOUNT_KEY` is missing or invalid. Check the logs in Vercel.
- **Build Failed**: Check the "Build Logs" in Vercel for details. Common issues are type errors or missing dependencies.
