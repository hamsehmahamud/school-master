
import type { Metadata } from 'next';
import { AppClientLayout } from '@/components/layout/AppClientLayout';
import './globals.css';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import '@/app/lib/server-init'; // Corrected import path
import { getFirebaseInitializationError } from '@/lib/server/firebaseAdmin';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Barasho Hub',
  description: 'School Management System',
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const FirebaseErrorDisplay = ({ error }: { error: Error }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900 p-8">
    <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
    <h1 className="text-4xl font-bold text-center mb-4">Firebase Initialization Failed</h1>
    <p className="text-lg text-center max-w-3xl mb-6">
      The application could not connect to the Firebase backend. This is a critical error that prevents the app from running.
      Please check your server environment configuration.
    </p>
    <div className="bg-red-100 border border-red-300 rounded-lg p-6 w-full max-w-3xl">
      <h2 className="text-xl font-semibold mb-2">Error Details:</h2>
      <p className="font-semibold mb-4">The Firebase Admin SDK could not be initialized. This usually means the service account credentials are missing or invalid.</p>
      <div className="space-y-2 text-sm">
        <p><strong>Action Required:</strong></p>
        <p>Ensure the <code className="bg-red-200 px-2 py-1 rounded font-mono text-base">FIREBASE_SERVICE_ACCOUNT_KEY</code> environment variable is set correctly in your deployment environment.</p>
        <p>The value should be the full JSON content of your Firebase service account key file.</p>
      </div>
      <div className="mt-4 pt-4 border-t border-red-300">
        <p className="font-mono text-sm bg-red-200 p-4 rounded">
          <strong>Original Error:</strong> {error.message}
        </p>
      </div>
    </div>
  </div>
);


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initializationError = getFirebaseInitializationError();

  if (initializationError) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}>
            <FirebaseErrorDisplay error={initializationError} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}>
        <AppClientLayout>{children}</AppClientLayout>
      </body>
    </html>
  );
}
