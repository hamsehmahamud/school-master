
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { addUser, deleteUserByEmail, type ClientSafeUserData } from './userService';

export interface ClientSafeSchoolData {
  id: string;
  name: string;
  contactEmail: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

function docToSchool(doc: FirebaseFirestore.DocumentSnapshot): ClientSafeSchoolData {
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    contactEmail: data.contactEmail,
    status: data.status,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function getAllSchools(): Promise<ClientSafeSchoolData[]> {
  const db = getDb();
  if (!db) {
    console.error("Database not initialized, cannot get schools.");
    return [];
  }
  const snapshot = await db.collection('schools').orderBy('name').get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(docToSchool);
}

export async function addSchool(data: { name: string, adminEmail: string }): Promise<{ newSchool: ClientSafeSchoolData, adminUser: ClientSafeUserData }> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot add school.");
    }
    const schoolsRef = db.collection('schools');
    
    // Check for uniqueness
    const existingByName = await schoolsRef.where('name', '==', data.name).get();
    if (!existingByName.empty) {
        throw new Error("A school with this name already exists.");
    }
    const existingByEmail = await db.collection('users').where('email', '==', data.adminEmail).get();
     if (!existingByEmail.empty) {
        throw new Error("This email is already registered to another user.");
    }

    const newSchoolData = {
        name: data.name,
        contactEmail: data.adminEmail,
        status: 'active' as const,
        createdAt: FieldValue.serverTimestamp(),
    };

    const newSchoolRef = await schoolsRef.add(newSchoolData);
    
    const adminUser = await addUser({
        email: data.adminEmail,
        name: `${data.name} Admin`,
        role: 'admin',
        schoolId: newSchoolRef.id,
        schoolName: data.name,
    });
    
    const newSchoolDoc = await newSchoolRef.get();
    return {
        newSchool: docToSchool(newSchoolDoc),
        adminUser: adminUser,
    };
}


export async function updateSchool(id: string, updates: Partial<Omit<ClientSafeSchoolData, 'id' | 'createdAt' | 'contactEmail'>>): Promise<ClientSafeSchoolData> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot update school.");
    }
    const schoolRef = db.collection('schools').doc(id);
    await schoolRef.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
    const updatedDoc = await schoolRef.get();
    return docToSchool(updatedDoc);
}

export async function deleteSchool(id: string): Promise<void> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot delete school.");
    }
    const schoolRef = db.collection('schools').doc(id);
    const doc = await schoolRef.get();
    if (!doc.exists) {
        throw new Error("School not found for deletion.");
    }
    const schoolData = doc.data()!;

    try {
        await deleteUserByEmail(schoolData.contactEmail);
    } catch (error: any) {
        console.warn(`[Firestore] Could not delete admin user for school ${id}: ${error.message}`);
    }

    // This would be a batch delete in a real app
    // For now, we just delete the school doc.
    await schoolRef.delete();
}
