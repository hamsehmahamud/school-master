
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceData {
  id?: string;
  schoolId: string;
  classroomId: string;
  date: Date;
  statuses: Record<string, AttendanceStatus>; // Record<studentId, status>
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientSafeAttendanceData {
  id: string;
  schoolId: string;
  classroomId: string;
  date: string; // ISO String
  statuses: Record<string, AttendanceStatus>;
  createdAt: string;
}


function docToAttendance(doc: FirebaseFirestore.DocumentSnapshot): ClientSafeAttendanceData {
  const data = doc.data()!;
  return {
    id: doc.id,
    schoolId: data.schoolId,
    classroomId: data.classroomId,
    date: (data.date as Timestamp).toDate().toISOString(),
    statuses: data.statuses,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
  };
}

// Generates a consistent document ID for a given date (YYYY-MM-DD)
const getDocIdForDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
}

export async function addAttendanceRecord(data: AttendanceData): Promise<ClientSafeAttendanceData> {
  const db = getDb();
  if (!db) {
    throw new Error("Database not initialized. Cannot save attendance.");
  }
  
  const docId = getDocIdForDate(data.date);
  const attendanceRef = db.collection('schools').doc(data.schoolId).collection('classrooms').doc(data.classroomId).collection('attendance').doc(docId);

  const doc = await attendanceRef.get();

  if (doc.exists) {
    // Update existing record
    await attendanceRef.update({
      statuses: data.statuses,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updatedDoc = await attendanceRef.get();
    return docToAttendance(updatedDoc);
  } else {
    // Create new record
    const newRecordData = {
        ...data,
        date: Timestamp.fromDate(data.date),
        createdAt: FieldValue.serverTimestamp(),
    };
    await attendanceRef.set(newRecordData);
    const newDoc = await attendanceRef.get();
    return docToAttendance(newDoc);
  }
}

export async function getAttendanceForDate(schoolId: string, classroomId: string, date: Date): Promise<ClientSafeAttendanceData | null> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get attendance.");
        return null;
    }
    const docId = getDocIdForDate(date);
    const attendanceRef = db.collection('schools').doc(schoolId).collection('classrooms').doc(classroomId).collection('attendance').doc(docId);

    const doc = await attendanceRef.get();
    if (!doc.exists) {
        return null;
    }

    return docToAttendance(doc);
}

export async function getAttendanceForMonth(schoolId: string, classroomId: string, startDate: Date, endDate: Date): Promise<ClientSafeAttendanceData[]> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get monthly attendance.");
        return [];
    }
    const attendanceRef = db.collection('schools').doc(schoolId).collection('classrooms').doc(classroomId).collection('attendance');
    const snapshot = await attendanceRef
        .where('date', '>=', Timestamp.fromDate(startDate))
        .where('date', '<=', Timestamp.fromDate(endDate))
        .get();

    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(docToAttendance);
}
