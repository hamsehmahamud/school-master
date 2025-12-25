
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ClientSafeStudentData } from './studentService';
import { getStudents } from './studentService';

export interface ClientSafeClassroomData {
  id: string; // Firestore Document ID
  name: string;
  teacher: string;
  studentCount: number;
  schoolId: string;
  academicYear: string;
}

export async function getClassrooms(schoolId: string): Promise<ClientSafeClassroomData[]> {
  const db = getDb();
  if (!db) {
    console.warn("Database not initialized, cannot get classrooms.");
    return [];
  }
  const classroomsRef = db.collection('schools').doc(schoolId).collection('classrooms');
  const snapshot = await classroomsRef.orderBy('name').get();
  if (snapshot.empty) {
    return [];
  }
  
  // Fetch all students for the school just ONCE.
  const allStudents = await getStudents(schoolId);

  const classrooms = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    
    // Calculate student count from the pre-fetched list.
    const studentCount = allStudents.filter(s => s.gradeApplyingFor === data.name).length;

    // Update student count in firestore only if it's different.
    // This is still potentially inefficient if counts are frequently out of sync,
    // but much better than reading the whole collection repeatedly.
    if (data.studentCount !== studentCount) {
        await doc.ref.update({ studentCount: studentCount });
    }

    return {
      id: doc.id,
      name: data.name,
      teacher: data.teacher || 'Not Assigned',
      studentCount: studentCount,
      schoolId: schoolId,
      academicYear: data.academicYear || '2024-2025',
    };
  }));

  return classrooms;
}

export async function getClassroomById(classroomId: string, schoolId: string): Promise<ClientSafeClassroomData | null> {
  const db = getDb();
  if (!db) {
    console.warn("Database not initialized, cannot get classroom by ID.");
    return null;
  }
  const classroomRef = db.collection('schools').doc(schoolId).collection('classrooms').doc(classroomId);
  const doc = await classroomRef.get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    teacher: data.teacher || 'Not Assigned',
    studentCount: data.studentCount || 0,
    schoolId: schoolId,
    academicYear: data.academicYear || '2024-2025',
  };
}

export async function addClassroom(classroomData: { name: string, teacher: string, academicYear: string, schoolId: string }): Promise<ClientSafeClassroomData> {
  const db = getDb();
  if (!db) {
    throw new Error("Database not initialized. Cannot add classroom.");
  }
  const classroomsRef = db.collection('schools').doc(classroomData.schoolId).collection('classrooms');
  const newClassroomRef = await classroomsRef.add({
    name: classroomData.name,
    teacher: classroomData.teacher,
    academicYear: classroomData.academicYear,
    studentCount: 0, // Initialize with 0 students
    createdAt: FieldValue.serverTimestamp(),
  });
  return {
    id: newClassroomRef.id,
    name: classroomData.name,
    teacher: classroomData.teacher,
    academicYear: classroomData.academicYear,
    schoolId: classroomData.schoolId,
    studentCount: 0,
  };
}

export async function updateClassroom(classroomId: string, schoolId: string, updates: Partial<Omit<ClientSafeClassroomData, 'id' | 'schoolId' | 'studentCount'>>): Promise<ClientSafeClassroomData> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot update classroom.");
    }
    const classroomRef = db.collection('schools').doc(schoolId).collection('classrooms').doc(classroomId);
    await classroomRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    const updatedDoc = await classroomRef.get();
    const data = updatedDoc.data()!;

    return {
      id: updatedDoc.id,
      name: data.name,
      teacher: data.teacher,
      studentCount: data.studentCount,
      schoolId: schoolId,
      academicYear: data.academicYear
    };
}

export async function deleteClassroom(classroomId: string, schoolId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Database not initialized. Cannot delete classroom.");
  }
  const classroomRef = db.collection('schools').doc(schoolId).collection('classrooms').doc(classroomId);
  await classroomRef.delete();
}
