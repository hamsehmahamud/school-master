
'use server';

// This file is imported for its server-side side effects.
// It ensures that the Firebase Admin SDK is initialized once on server startup.
import 'server-only';
import '@/lib/server/firebaseAdmin'; // This import triggers the initialization
import { seedMainAdmin, initializeDefaultPermissions } from '@/services/userService';

// Using a self-invoking async function to run the initialization logic.
// This is a common pattern to handle async operations at the module's top level.
(async () => {
    try {
        // Firebase is initialized by the import above.
        // Now we can safely call services that depend on it.
        await initializeDefaultPermissions();
        await seedMainAdmin();
    } catch (error) {
        console.error("Error during server-side initialization:", error);
    }
})();
