
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface ClientSafeExamResultData {
  id: string;
  studentId: string;
  studentName: string;
  classroomId: string;
  classroomName: string;
  academicYear: string;
  examType: string;
  subjects: { subjectName: string; score: number }[];
  totalScore: number;
  averageScore: number;
  schoolId: string;
  createdAt: string;
}

export interface NewExamResultInput {
  studentId: string;
  studentName: string;
  classroomId: string;
  classroomName: string;
  academicYear: string;
  examType: string;
  scores: Record<string, string | number>;
  schoolId: string;
}

function docToExamResult(doc: FirebaseFirestore.DocumentSnapshot): ClientSafeExamResultData {
  const data = doc.data()!;
  return {
    id: doc.id,
    studentId: data.studentId,
    studentName: data.studentName,
    classroomId: data.classroomId,
    classroomName: data.classroomName,
    academicYear: data.academicYear,
    examType: data.examType,
    subjects: data.subjects,
    totalScore: data.totalScore,
    averageScore: data.averageScore,
    schoolId: data.schoolId,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
  };
}

export async function addExamResult(input: NewExamResultInput): Promise<ClientSafeExamResultData> {
  const db = getDb();
  if (!db) {
    throw new Error("Database not initialized. Cannot add exam result.");
  }
  const examCollectionRef = db.collection('schools').doc(input.schoolId).collection('examResults');
  
  const subjects = Object.entries(input.scores)
    .filter(([_, score]) => String(score).trim() !== "")
    .map(([subjectName, score]) => ({
      subjectName,
      score: Number(score),
    }));

  if (subjects.length === 0) {
    throw new Error("No scores provided to save.");
  }

  const query = examCollectionRef
    .where('studentId', '==', input.studentId)
    .where('academicYear', '==', input.academicYear)
    .where('examType', '==', input.examType)
    .limit(1);

  const snapshot = await query.get();

  if (!snapshot.empty) {
    // Update existing record
    const doc = snapshot.docs[0];
    const existingData = doc.data() as ClientSafeExamResultData;

    const updatedSubjects = [...existingData.subjects];
    subjects.forEach(newSub => {
      const subIndex = updatedSubjects.findIndex(us => us.subjectName.toUpperCase() === newSub.subjectName.toUpperCase());
      if (subIndex > -1) {
        updatedSubjects[subIndex] = newSub;
      } else {
        updatedSubjects.push(newSub);
      }
    });

    const newTotal = updatedSubjects.reduce((sum, s) => sum + s.score, 0);
    const newAverage = newTotal / updatedSubjects.length;

    await doc.ref.update({
      subjects: updatedSubjects,
      totalScore: newTotal,
      averageScore: newAverage,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    const updatedDoc = await doc.ref.get();
    return docToExamResult(updatedDoc);
  } else {
    // Create new record
    const totalScore = subjects.reduce((sum, s) => sum + s.score, 0);
    const averageScore = totalScore / subjects.length;

    const newResultData = {
      ...input,
      subjects,
      totalScore,
      averageScore,
      createdAt: FieldValue.serverTimestamp(),
    };
    
    // remove scores object from newResultData
    delete (newResultData as any).scores;
    
    const newDocRef = await examCollectionRef.add(newResultData);
    const newDoc = await newDocRef.get();
    return docToExamResult(newDoc);
  }
}

export async function getExamResultsForStudent(studentAppId: string, schoolId: string): Promise<ClientSafeExamResultData[]> {
  const db = getDb();
  if (!db) {
    console.warn("Database not initialized, cannot get student exam results.");
    return [];
  }
  const resultsRef = db.collection('schools').doc(schoolId).collection('examResults');
  const snapshot = await resultsRef.where('studentId', '==', studentAppId).orderBy('createdAt', 'desc').get();
  
  if (snapshot.empty) {
    return [];
  }
  
  return snapshot.docs.map(docToExamResult);
}

export async function getExamResultsForClassroom(classroomName: string, schoolId: string, academicYear: string, examType?: string): Promise<ClientSafeExamResultData[]> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get classroom exam results.");
        return [];
    }
    const resultsRef = db.collection('schools').doc(schoolId).collection('examResults');
    
    let query: FirebaseFirestore.Query = resultsRef
        .where('classroomName', '==', classroomName)
        .where('academicYear', '==', academicYear);
        
    if (examType && examType !== 'Yearly Exam Total') {
        query = query.where('examType', '==', examType);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(docToExamResult);
}
