
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';

export type StaffAttendanceStatus = 'present' | 'absent' | 'late';

export interface StaffAttendanceData {
  id?: string;
  schoolId: string;
  date: Date;
  statuses: Record<string, StaffAttendanceStatus>; // Record<teacherId, status>
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientSafeStaffAttendanceData {
  id: string;
  schoolId: string;
  date: string; // ISO String
  statuses: Record<string, StaffAttendanceStatus>;
  createdAt: string;
}


function docToAttendance(doc: FirebaseFirestore.DocumentSnapshot): ClientSafeStaffAttendanceData {
  const data = doc.data()!;
  return {
    id: doc.id,
    schoolId: data.schoolId,
    date: (data.date as Timestamp).toDate().toISOString(),
    statuses: data.statuses,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
  };
}

const getDocIdForDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
}

export async function addStaffAttendanceRecord(data: Omit<StaffAttendanceData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientSafeStaffAttendanceData> {
  const db = getDb();
  if (!db) {
    throw new Error("Database not initialized. Cannot save staff attendance.");
  }
  
  const docId = getDocIdForDate(data.date);
  const attendanceRef = db.collection('schools').doc(data.schoolId).collection('staffAttendance').doc(docId);

  const doc = await attendanceRef.get();

  if (doc.exists) {
    await attendanceRef.update({
      statuses: data.statuses,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updatedDoc = await attendanceRef.get();
    return docToAttendance(updatedDoc);
  } else {
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

export async function getStaffAttendanceForDate(schoolId: string, date: Date): Promise<ClientSafeStaffAttendanceData | null> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get staff attendance.");
        return null;
    }
    const docId = getDocIdForDate(date);
    const attendanceRef = db.collection('schools').doc(schoolId).collection('staffAttendance').doc(docId);

    const doc = await attendanceRef.get();
    if (!doc.exists) {
        const teachersSnapshot = await db.collection('schools').doc(schoolId).collection('teachers').get();
        if (teachersSnapshot.empty) return null;

        const statuses: Record<string, StaffAttendanceStatus> = {};
        teachersSnapshot.docs.forEach(doc => {
            statuses[doc.id] = 'present'; 
        });

        return {
            id: docId,
            schoolId: schoolId,
            date: date.toISOString(),
            statuses,
            createdAt: new Date().toISOString(),
        }
    }

    return docToAttendance(doc);
}

export async function getStaffAttendanceForMonth(schoolId: string, startDate: Date, endDate: Date): Promise<ClientSafeStaffAttendanceData[]> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get monthly staff attendance.");
        return [];
    }
    
    const attendanceRef = db.collection('schools').doc(schoolId).collection('staffAttendance');
    const snapshot = await attendanceRef
        .where('date', '>=', Timestamp.fromDate(startDate))
        .where('date', '<=', Timestamp.fromDate(endDate))
        .get();

    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(docToAttendance);
}
