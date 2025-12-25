
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { addUser, deleteUserByAppId, type ClientSafeUserData } from './userService';

export interface ClientSafeStudentData {
  id: string; // Firestore Document ID
  studentAppId: string;
  fullName: string;
  contactNumber?: string;
  gender: 'male' | 'female';
  dateOfBirth: string; // ISO string format
  gradeApplyingFor: string;
  parentAppId: string;
  parentName: string;
  parentContact: string;
  parentEmail?: string;
  registrationDate: string; // ISO string format
  status: 'active' | 'inactive' | 'graduated';
  schoolId: string;
  paymentType: 'Payer' | 'Discount' | 'Free';
  socialStatus?: 'Yatiim' | 'Danyar' | 'Walaalo' | string;
  feeAmount?: number;
  usesBus?: 'yes' | 'no';
}


function docToStudent(doc: FirebaseFirestore.DocumentSnapshot): ClientSafeStudentData {
    const data = doc.data()!;
    return {
        id: doc.id,
        studentAppId: data.studentAppId,
        fullName: data.fullName,
        contactNumber: data.contactNumber,
        gender: data.gender,
        dateOfBirth: (data.dateOfBirth as Timestamp).toDate().toISOString(),
        gradeApplyingFor: data.gradeApplyingFor,
        parentAppId: data.parentAppId,
        parentName: data.parentName,
        parentContact: data.parentContact,
        parentEmail: data.parentEmail,
        registrationDate: (data.registrationDate as Timestamp).toDate().toISOString(),
        status: data.status,
        schoolId: data.schoolId,
        paymentType: data.paymentType,
        socialStatus: data.socialStatus,
        feeAmount: data.feeAmount,
        usesBus: data.usesBus,
    };
}

async function docToUser(doc: FirebaseFirestore.DocumentSnapshot): Promise<ClientSafeUserData> {
    const data = doc.data()!;
    let schoolName = 'N/A';
    const db = getDb();
    if (data.schoolId && db) {
        const schoolDoc = await db.collection('schools').doc(data.schoolId).get();
        if (schoolDoc.exists) {
        schoolName = schoolDoc.data()!.name;
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
        // Ensure password is not returned from DB reads
    };
}


export async function getStudents(schoolId: string): Promise<ClientSafeStudentData[]> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get students.");
        return [];
    }
    const studentsRef = db.collection('schools').doc(schoolId).collection('students');
    const snapshot = await studentsRef.orderBy('fullName').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(docToStudent);
}


export async function getStudentById(studentId: string, schoolId: string): Promise<ClientSafeStudentData | null> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get student.");
        return null;
    }
    const studentRef = db.collection('schools').doc(schoolId).collection('students').doc(studentId);
    const doc = await studentRef.get();
    if (!doc.exists) {
        return null;
    }
    return docToStudent(doc);
}


export async function getStudentByStudentAppId(studentAppId: string, schoolId: string): Promise<ClientSafeStudentData | null> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get student.");
        return null;
    }
    const studentsRef = db.collection('schools').doc(schoolId).collection('students');
    const snapshot = await studentsRef.where('studentAppId', '==', studentAppId).limit(1).get();
    if (snapshot.empty) {
        return null;
    }
    return docToStudent(snapshot.docs[0]);
}


export async function getStudentsByParentDetails({ parentId, schoolId }: { parentId: string, schoolId: string }): Promise<ClientSafeStudentData[]> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get students by parent.");
        return [];
    }
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('appId', '==', parentId).where('schoolId', '==', schoolId).limit(1).get();
    
    if (userSnapshot.empty) return [];
    
    const parentUser = userSnapshot.docs[0].data();

    const studentsRef = db.collection('schools').doc(schoolId).collection('students');
    const studentSnapshot = await studentsRef.where('parentContact', '==', parentUser.phoneNumber).where('schoolId', '==', schoolId).get();

    if (studentSnapshot.empty) return [];

    return studentSnapshot.docs.map(docToStudent);
}


export async function addStudent(studentData: Omit<ClientSafeStudentData, 'id' | 'registrationDate' | 'status'> & { dateOfBirth: string }): Promise<{ newStudent: ClientSafeStudentData, studentUser: ClientSafeUserData, parentUser: ClientSafeUserData }> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot add student.");
    }
    const schoolId = studentData.schoolId;
    if (!schoolId) {
        throw new Error("School ID is required to add a student.");
    }
    const studentsRef = db.collection('schools').doc(schoolId).collection('students');
    
    const schoolDocRef = await db.collection('schools').doc(schoolId).get();
    const schoolName = schoolDocRef.exists ? schoolDocRef.data()!.name : 'Unknown School';

    const studentAppId = studentData.studentAppId;

    const studentUser = await addUser({
        appId: studentAppId,
        name: studentData.fullName,
        email: null,
        role: 'student',
        schoolId: schoolId,
        schoolName: schoolName,
        password: `${studentAppId}${studentAppId}`
    });

    let parentUser: ClientSafeUserData;
    const parentId = studentData.parentAppId;

    const usersRef = db.collection('users');
    const existingParentSnapshot = await usersRef.where('appId', '==', parentId).where('schoolId', '==', schoolId).limit(1).get();
    
    if (existingParentSnapshot.empty) {
        parentUser = await addUser({
            appId: parentId,
            name: studentData.parentName,
            email: studentData.parentEmail || null,
            phoneNumber: studentData.parentContact,
            role: 'parent',
            schoolId: schoolId,
            schoolName: schoolName,
            password: `${parentId}${parentId}`
        });
    } else {
        const parentDoc = existingParentSnapshot.docs[0];
        parentUser = await docToUser(parentDoc);
        parentUser.password = "********"; // Don't expose existing password
    }
    
    const newStudentData = {
        ...studentData,
        status: 'active',
        dateOfBirth: Timestamp.fromDate(new Date(studentData.dateOfBirth)),
        createdAt: FieldValue.serverTimestamp(),
        registrationDate: FieldValue.serverTimestamp(),
    };
    
    const newStudentRef = await studentsRef.add(newStudentData);
    const createdStudentDoc = await newStudentRef.get();
    
    return {
        newStudent: docToStudent(createdStudentDoc),
        studentUser,
        parentUser
    };
}


export async function updateStudent(studentId: string, schoolId: string, updates: Partial<Omit<ClientSafeStudentData, 'id' | 'schoolId' | 'studentAppId'>>): Promise<ClientSafeStudentData> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot update student.");
    }
    const studentRef = db.collection('schools').doc(schoolId).collection('students').doc(studentId);
    await studentRef.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
    const updatedDoc = await studentRef.get();
    return docToStudent(updatedDoc);
}


export async function deleteStudent(studentId: string, schoolId: string): Promise<void> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot delete student.");
    }
    const studentRef = db.collection('schools').doc(schoolId).collection('students').doc(studentId);
    const doc = await studentRef.get();
    if (!doc.exists) {
        throw new Error("Student not found for deletion.");
    }
    const studentData = doc.data() as ClientSafeStudentData;
    
    if (studentData.studentAppId) {
      await deleteUserByAppId(studentData.studentAppId, schoolId);
    } else {
      console.warn(`Student with ID ${studentId} does not have a studentAppId. Cannot delete user account.`);
    }

    await studentRef.delete();
}
