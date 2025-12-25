
'use server';

// This file is imported for its server-side side effects.
// It ensures that the Firebase Admin SDK is initialized once on server startup.
import 'server-only';
import { initializeFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { seedMainAdmin, initializeDefaultPermissions } from '@/services/userService';

// Using a self-invoking async function to run the initialization logic.
// This is a common pattern to handle async operations at the module's top level.
(async () => {
    try {
        initializeFirebaseAdmin(); // Initialize Firebase first.
        
        // These will now gracefully handle the case where Firebase is not initialized
        await initializeDefaultPermissions();
        await seedMainAdmin();
    } catch (error) {
        console.error("Error during server-side initialization:", error);
    }
})();
