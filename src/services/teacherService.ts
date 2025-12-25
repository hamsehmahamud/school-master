
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { addUser, deleteUserByAppId, type ClientSafeUserData } from './userService';

export interface ClientSafeTeacherData {
  id: string; // Firestore Document ID
  appId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  subjectsTaught: string;
  dateOfBirth: string;
  hireDate: string;
  schoolId: string;
  role: string;
  gender: 'Male' | 'Female';
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  status: 'Active' | 'Inactive';
}


function docToTeacher(doc: FirebaseFirestore.DocumentSnapshot): ClientSafeTeacherData {
    const data = doc.data()!;
    return {
        id: doc.id,
        appId: data.appId,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        subjectsTaught: data.subjectsTaught,
        dateOfBirth: (data.dateOfBirth as Timestamp).toDate().toISOString(),
        hireDate: (data.hireDate as Timestamp).toDate().toISOString(),
        schoolId: data.schoolId,
        role: data.role || 'Teacher',
        gender: data.gender,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        status: data.status || 'Active',
    };
}


export async function getTeachers(schoolId: string): Promise<ClientSafeTeacherData[]> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get teachers.");
        return [];
    }
    const teachersRef = db.collection('schools').doc(schoolId).collection('teachers');
    const snapshot = await teachersRef.orderBy('fullName').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(docToTeacher);
}

export async function getTeacherById(teacherId: string, schoolId: string): Promise<ClientSafeTeacherData | null> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized.");
        return null;
    }
    const doc = await db.collection('schools').doc(schoolId).collection('teachers').doc(teacherId).get();
    if (!doc.exists) return null;
    return docToTeacher(doc);
}


export async function addTeacher(teacherData: Omit<ClientSafeTeacherData, 'id' | 'dateOfBirth' | 'hireDate' | 'role'> & { dateOfBirth: Date, hireDate: Date }): Promise<{ newTeacher: ClientSafeTeacherData, teacherUser: ClientSafeUserData }> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot add teacher.");
    }
    const schoolId = teacherData.schoolId;
    const teachersRef = db.collection('schools').doc(schoolId).collection('teachers');
    
    const schoolDocRef = db.collection('schools').doc(schoolId);
    
    const schoolDoc = await schoolDocRef.get();
    const schoolName = schoolDoc.exists ? schoolDoc.data()!.name : 'Unknown School';

    const newTeacherData = {
        ...teacherData,
        role: 'Teacher',
        dateOfBirth: Timestamp.fromDate(teacherData.dateOfBirth),
        hireDate: Timestamp.fromDate(teacherData.hireDate),
        createdAt: FieldValue.serverTimestamp(),
    };

    const newTeacherRef = await teachersRef.add(newTeacherData);

    const teacherUser = await addUser({
        appId: teacherData.appId,
        name: teacherData.fullName,
        email: teacherData.email,
        phoneNumber: teacherData.phoneNumber, // Pass phone number here
        role: 'teacher',
        schoolId: schoolId,
        schoolName: schoolName,
        password: `${teacherData.appId}${teacherData.appId}`
    });
    
    const createdTeacherDoc = await newTeacherRef.get();

    return {
        newTeacher: docToTeacher(createdTeacherDoc),
        teacherUser
    };
}


export async function updateTeacher(teacherId: string, schoolId: string, updates: Partial<Omit<ClientSafeTeacherData, 'id' | 'schoolId' | 'appId'>>): Promise<ClientSafeTeacherData> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized.");
    }
    const teacherRef = db.collection('schools').doc(schoolId).collection('teachers').doc(teacherId);
    await teacherRef.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
    const updatedDoc = await teacherRef.get();
    return docToTeacher(updatedDoc);
}


export async function deleteTeacher(teacherId: string, schoolId: string): Promise<void> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized.");
    }
    const teacherRef = db.collection('schools').doc(schoolId).collection('teachers').doc(teacherId);
    const doc = await teacherRef.get();
    if (!doc.exists) {
        throw new Error("Teacher not found.");
    }
    const teacherData = doc.data() as ClientSafeTeacherData;
    
    // First, delete the associated user from Firebase Auth and the users collection
    if (teacherData.appId) {
        await deleteUserByAppId(teacherData.appId, schoolId);
    } else if (teacherData.email) {
        console.warn(`Attempting to delete teacher user by email as App ID is missing. This might be unreliable.`);
        // await deleteUserByEmail(teacherData.email); // Assuming you have this function
    }

    // Then, delete the teacher document from the subcollection
    await teacherRef.delete();
}
