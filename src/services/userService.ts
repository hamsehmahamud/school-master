
'use server';

import { getAuth, getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import type { UserRole } from '@/config/permissions';
import { getStudentByStudentAppId } from './studentService';
import { getTeachers } from './teacherService';

export interface ClientSafeUserData {
  id: string; // Firebase Auth UID
  name: string | null;
  email: string | null;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  appId?: string;
  studentAppId?: string;
  phoneNumber?: string;
  password?: string; // Only for creation response
  createdAt?: string;
}

export interface AuthenticateUserParams {
  identifier: string;
  password?: string;
  role: UserRole;
  schoolId?: string;
}

const usersCollection = () => {
    const db = getDb();
    if (!db) return null;
    return db.collection('users');
}

async function docToUser(doc: FirebaseFirestore.DocumentSnapshot, schoolMap?: Map<string, string>): Promise<ClientSafeUserData> {
  const data = doc.data()!;
  
  let schoolName = 'N/A';
  if (data.schoolId && schoolMap && schoolMap.has(data.schoolId)) {
    schoolName = schoolMap.get(data.schoolId)!;
  } else if (data.role === 'main-admin') {
    schoolName = 'Global';
  } else if (data.schoolId) {
      const db = getDb();
      if(db){
        const schoolDoc = await db.collection('schools').doc(data.schoolId).get();
        if(schoolDoc.exists){
            schoolName = schoolDoc.data()!.name;
            schoolMap?.set(data.schoolId, schoolName);
        }
      }
  }

  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    role: data.role,
    schoolId: data.schoolId,
    schoolName: schoolName,
    appId: data.appId,
    studentAppId: data.studentAppId,
    phoneNumber: data.phoneNumber,
    createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
  };
}

export const initializeDefaultPermissions = async () => {
    const col = usersCollection();
    if (!col) {
        console.warn("[Permissions] Firebase not initialized. Skipping permission setup.");
        return Promise.resolve();
    }
    console.log("[Firestore] Initializing default permissions (mock function, as roles are managed in user docs).");
    return Promise.resolve();
}

export const seedMainAdmin = async () => {
    const auth = getAuth();
    const col = usersCollection();
    if (!auth || !col) {
        console.warn("[Seed] Firebase not initialized. Cannot seed main admin.");
        return;
    }
    const adminEmail = process.env.FIREBASE_ADMIN_EMAIL || "Mahdiqaadi@gmail.com";
    try {
        await auth.getUserByEmail(adminEmail);
        console.log('[Firestore] Main administrator already exists.');
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log('[Firestore] Seeding main administrator...');
            const password = process.env.FIREBASE_ADMIN_PASSWORD || 'admin123';
            const userRecord = await auth.createUser({
                email: adminEmail,
                password: password,
                displayName: 'Main Admin',
            });
            await col.doc(userRecord.uid).set({
                name: 'Main Admin',
                email: adminEmail,
                role: 'main-admin',
                createdAt: FieldValue.serverTimestamp(),
            });
             console.log(`[Firestore] Main admin created with email: ${adminEmail} and password: ${password}`);
        } else {
            throw error;
        }
    }
};

export async function addUser(userData: Omit<ClientSafeUserData, 'id' | 'createdAt'>): Promise<ClientSafeUserData> {
    const auth = getAuth();
    const db = getDb();
    if (!auth || !db) {
        throw new Error("Firebase not initialized. Cannot add user.");
    }
    const col = db.collection('users');
    const password = userData.password || Math.random().toString(36).slice(-8);
    let userRecord: UserRecord;
    let finalAppId = userData.appId;

    // Check for App ID uniqueness before proceeding
    if (finalAppId) {
        const existingAppIdSnapshot = await col.where('appId', '==', finalAppId).where('schoolId', '==', userData.schoolId).limit(1).get();
        if (!existingAppIdSnapshot.empty) {
            throw new Error(`This App ID is already in use. Please choose another ID`);
        }
    }
    

    try {
        let identifierForAuth: string;
        if (userData.email) {
            identifierForAuth = userData.email;
        } else if (finalAppId) {
            identifierForAuth = `${finalAppId}@barashohub.local`;
        } else {
            throw new Error("User must have an email or an App ID");
        }

        try {
            userRecord = await auth.getUserByEmail(identifierForAuth);
            console.warn(`Auth user with identifier ${identifierForAuth} already exists. Re-using.`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                userRecord = await auth.createUser({
                    email: identifierForAuth,
                    password: password,
                    displayName: userData.name || finalAppId,
                });
            } else {
                throw error;
            }
        }


        const newUserDocData: any = {
            name: userData.name,
            email: userData.email,
            role: userData.role,
            schoolId: userData.schoolId,
            schoolName: userData.schoolName,
            appId: finalAppId,
            createdAt: FieldValue.serverTimestamp(),
        };

        if (userData.phoneNumber) {
            newUserDocData.phoneNumber = userData.phoneNumber;
        }


        await col.doc(userRecord.uid).set(newUserDocData, { merge: true });
        
        console.log(`[Firestore] User ${userData.name || identifierForAuth} processed with password: ${password}`);
        
        return { 
            ...userData, 
            id: userRecord.uid, 
            password: password, 
            appId: finalAppId,
            createdAt: new Date().toISOString(),
        };

    } catch (error: any) {
        console.error("Error in addUser:", error);
        if (error.code === 'auth/email-already-exists' && userData.email) {
            console.warn(`User with email ${userData.email} already exists in Auth. Checking Firestore record.`);
            const existingUserRecord = await auth.getUserByEmail(userData.email);
            const userDocRef = col.doc(existingUserRecord.uid);
            
            const userDoc = await userDocRef.get();
            if (userDoc.exists) {
                 const schoolMap = new Map<string, string>();
                 if (userData.schoolId && userData.schoolName) {
                    schoolMap.set(userData.schoolId, userData.schoolName);
                 }
                 return { ...(await docToUser(userDoc, schoolMap)), password: "Not Applicable" };
            } else {
                const newUserDocData: any = {
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    schoolId: userData.schoolId,
                    schoolName: userData.schoolName,
                    appId: finalAppId,
                    createdAt: FieldValue.serverTimestamp(),
                };
                 if (userData.phoneNumber) {
                    newUserDocData.phoneNumber = userData.phoneNumber;
                }
                await userDocRef.set(newUserDocData);
                return { 
                    ...userData, 
                    id: existingUserRecord.uid, 
                    password: "Not Applicable", 
                    appId: finalAppId,
                    createdAt: new Date().toISOString(),
                };
            }
        }
        throw error;
    }
}


export async function authenticateUser({ identifier, password, role, schoolId }: AuthenticateUserParams): Promise<ClientSafeUserData | null> {
    const col = usersCollection();
    if (!col) {
        console.error("Database not initialized, cannot authenticate user.");
        return null;
    }

    if (role !== 'main-admin' && !schoolId) {
        throw new Error("School ID is required for this role.");
    }

    const queries: FirebaseFirestore.Query[] = [];

    // Always check for App ID if schoolId is present
    if (schoolId) {
        queries.push(col.where('appId', '==', identifier).where('schoolId', '==', schoolId));
    }
    
    // Check for email if it's a valid email format
    if (identifier.includes('@')) {
        if(schoolId) {
            queries.push(col.where('email', '==', identifier).where('schoolId', '==', schoolId));
        } else { // For main-admin
            queries.push(col.where('email', '==', identifier));
        }
    }
    
    // Check for phone number
    if (schoolId) {
        queries.push(col.where('phoneNumber', '==', identifier).where('schoolId', '==', schoolId));
    }
    
    for (const q of queries) {
        const snapshot = await q.where('role', '==', role).limit(1).get();
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const user = await docToUser(userDoc, new Map());

            if (user.schoolId && !user.schoolName) {
                const db = getDb();
                if(db) {
                    const schoolDoc = await db.collection('schools').doc(user.schoolId).get();
                    if (schoolDoc.exists) {
                        user.schoolName = schoolDoc.data()!.name;
                    }
                }
            }
            if (user.role === 'student') user.studentAppId = user.appId;
            return user;
        }
    }
    
    // Special case for parents logging in with student ID
    if (role === 'parent' && schoolId) {
         const studentData = await getStudentByStudentAppId(identifier, schoolId);
         if (studentData && studentData.parentContact) {
            const parentQuery = col.where('phoneNumber', '==', studentData.parentContact)
                                   .where('role', '==', 'parent')
                                   .where('schoolId', '==', schoolId);
            const parentSnapshot = await parentQuery.limit(1).get();
            if (!parentSnapshot.empty) {
                return docToUser(parentSnapshot.docs[0], new Map());
            }
         }
    }

    return null;
}


export async function changeUserPassword(userId: string, oldPass: string, newPass: string): Promise<void> {
    const auth = getAuth();
    if (!auth) {
        throw new Error("Firebase not initialized. Cannot change password.");
    }
    // This server-side action is insecure and only for demonstration.
    // Real password changes must be handled on the client with re-authentication.
    console.log(`[Firestore] Password change requested for user ${userId}.`);
    try {
        await auth.updateUser(userId, { password: newPass });
        console.log(`[Firestore] Mock password update successful for user ${userId}`);
    } catch(error) {
        console.error("Failed to change password:", error);
        // This will likely fail without admin privileges if not run in a trusted server environment.
        throw new Error("Failed to update password. This action requires elevated privileges.");
    }
}


export async function getAllUsers(): Promise<ClientSafeUserData[]> {
    const db = getDb();
    const col = usersCollection();
    if (!db || !col) {
        console.error("Database not initialized, cannot get all users.");
        return [];
    }

    const schoolsSnapshot = await db.collection('schools').get();
    const schoolMap = new Map<string, string>();
    schoolsSnapshot.forEach(doc => {
        schoolMap.set(doc.id, doc.data().name);
    });

    const usersSnapshot = await col.get();
    if (usersSnapshot.empty) return [];

    const userPromises = usersSnapshot.docs.map(doc => docToUser(doc, schoolMap).catch(error => {
        console.error(`Failed to process user doc ${doc.id}:`, error);
        return null;
    }));
    
    const users = await Promise.all(userPromises);
    return users.filter((user): user is ClientSafeUserData => user !== null);
}


export async function deleteUserByEmail(email: string): Promise<void> {
    const auth = getAuth();
    const col = usersCollection();
    if (!auth || !col) {
        throw new Error("Firebase not initialized. Cannot delete user.");
    }
    try {
        const userRecord = await auth.getUserByEmail(email);
        await auth.deleteUser(userRecord.uid);
        // Also delete from 'users' collection
        const userDoc = await col.where('email', '==', email).limit(1).get();
        if (!userDoc.empty) {
            await userDoc.docs[0].ref.delete();
        }
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') throw error;
    }
}


export async function deleteUserByAppId(appId: string, schoolId: string): Promise<void> {
    const auth = getAuth();
    const col = usersCollection();
    if (!auth || !col) {
        throw new Error("Firebase not initialized. Cannot delete user.");
    }
    const userDocQuery = await col.where('appId', '==', appId).where('schoolId', '==', schoolId).limit(1).get();
    if (!userDocQuery.empty) {
        const userDoc = userDocQuery.docs[0];
        try {
            await auth.deleteUser(userDoc.id);
        } catch (error: any) {
             if (error.code !== 'auth/user-not-found') {
                console.error(`Failed to delete Firebase Auth user for App ID ${appId}:`, error);
                throw error;
             }
        } finally {
            await userDoc.ref.delete();
        }
    }
}
