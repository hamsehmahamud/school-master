
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Loader2, School } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function PageLoadingIndicator() {
  return (
    <div className="page-loading-overlay">
      <div className="mb-4 inline-flex items-center justify-center bg-primary rounded-full p-3 page-loading-logo">
        <School className="h-10 w-10 text-primary-foreground" />
      </div>
      <div className="flex items-center text-lg text-primary">
        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
        <span>Loading Barasho Hub...</span>
      </div>
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -15 },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading: isAuthLoading } = useAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Determine if the page should show the main layout (sidebar + header)
  const showMainLayout = !['/login', '/forgot-password'].includes(pathname);

  // Effect to handle initial page load appearance
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 500); // Simulate loading time
    return () => clearTimeout(timer);
  }, []);
  
  if (isAuthLoading || isPageLoading) {
    return <PageLoadingIndicator />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showMainLayout ? (
          <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Header />
              <main className="flex-1 p-4 sm:p-6 md:p-8">
                <motion.div
                  key={pathname}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  {children}
                </motion.div>
              </main>
            </div>
          </div>
        ) : (
          <motion.div
            key={pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </>
  );
}


export function AppClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <AppContent>{children}</AppContent>
      </AuthProvider>
    </ThemeProvider>
  );
}
