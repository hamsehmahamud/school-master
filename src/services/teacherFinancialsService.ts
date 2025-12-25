
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface ClientSafeTeacherFinancialRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  advance: number;
  paidAmount: number;
  status: 'Paid' | 'Pending' | 'Partially Paid';
}

export type TeacherFinancialUpdateInput = Partial<{
  baseSalary: number;
  bonus: number;
  deductions: number;
  status: 'Paid' | 'Pending' | 'Partially Paid';
  advance: number;
  paidAmount: number;
}>

function docToFinancialRecord(doc: FirebaseFirestore.DocumentSnapshot): ClientSafeTeacherFinancialRecord {
    const data = doc.data()!;
    return {
        id: doc.id,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        schoolId: data.schoolId,
        month: data.month,
        baseSalary: data.baseSalary || 0,
        bonus: data.bonus || 0,
        deductions: data.deductions || 0,
        netSalary: data.netSalary || 0,
        advance: data.advance || 0,
        paidAmount: data.paidAmount || 0,
        status: data.status || 'Pending'
    };
}


export async function getTeacherFinancialsForMonth(schoolId: string, monthDate: Date): Promise<ClientSafeTeacherFinancialRecord[]> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get teacher financials.");
        return [];
    }
    const year = monthDate.getFullYear();
    const monthName = monthDate.toLocaleString('default', { month: 'long' });
    const monthQuery = `${monthName} ${year}`;
    
    const financialsRef = db.collection('schools').doc(schoolId).collection('teacherFinancials');
    const snapshot = await financialsRef.where('month', '==', monthQuery).get();
    
    if (snapshot.empty) {
        // If no records for this month, create them from the teachers list
        const teachersRef = db.collection('schools').doc(schoolId).collection('teachers');
        const teachersSnapshot = await teachersRef.get();
        if (teachersSnapshot.empty) return [];

        const batch = db.batch();
        const createdRecords: ClientSafeTeacherFinancialRecord[] = [];

        teachersSnapshot.docs.forEach(doc => {
            const teacherData = doc.data();
            // This is a placeholder for actual salary logic
            const baseSalary = 250; 
            const netSalary = baseSalary; // Initially net salary is the same as base
            const newRecord = {
                teacherId: teacherData.appId,
                teacherName: teacherData.fullName,
                schoolId: schoolId,
                month: monthQuery,
                baseSalary: baseSalary,
                bonus: 0,
                deductions: 0,
                netSalary: netSalary,
                advance: 0,
                paidAmount: 0,
                status: 'Pending' as const,
                createdAt: FieldValue.serverTimestamp(),
            };
            const newDocRef = financialsRef.doc();
            batch.set(newDocRef, newRecord);
            createdRecords.push({ id: newDocRef.id, ...newRecord });
        });
        await batch.commit();
        return createdRecords;
    }

    return snapshot.docs.map(docToFinancialRecord);
}

export async function updateTeacherFinancialRecord(recordId: string, schoolId: string, updates: TeacherFinancialUpdateInput): Promise<ClientSafeTeacherFinancialRecord> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized.");
    }
    const recordRef = db.collection('schools').doc(schoolId).collection('teacherFinancials').doc(recordId);
    
    const doc = await recordRef.get();
    if (!doc.exists) {
        throw new Error("Financial record not found.");
    }

    const currentData = doc.data() as Omit<ClientSafeTeacherFinancialRecord, 'id'>;

    const dataToUpdate: any = { ...updates, updatedAt: FieldValue.serverTimestamp() };

    // Recalculate netSalary if any of its components are changing
    const isBaseSalaryChanging = updates.baseSalary !== undefined && updates.baseSalary !== currentData.baseSalary;
    const isBonusChanging = updates.bonus !== undefined && updates.bonus !== currentData.bonus;
    const isDeductionsChanging = updates.deductions !== undefined && updates.deductions !== currentData.deductions;
    const isAdvanceChanging = updates.advance !== undefined && updates.advance !== currentData.advance;

    if (isBaseSalaryChanging || isBonusChanging || isDeductionsChanging || isAdvanceChanging) {
        const newBaseSalary = updates.baseSalary ?? currentData.baseSalary;
        const newBonus = updates.bonus ?? currentData.bonus;
        const newDeductions = updates.deductions ?? currentData.deductions;
        const newAdvance = updates.advance ?? currentData.advance;
        
        dataToUpdate.netSalary = (newBaseSalary + newBonus) - (newDeductions + newAdvance);
    }
    
    await recordRef.update(dataToUpdate);

    const updatedDoc = await recordRef.get();
    return docToFinancialRecord(updatedDoc);
}
