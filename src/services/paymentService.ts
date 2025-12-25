
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface ClientSafePaymentData {
  id: string;
  studentIdentifier: string;
  studentName?: string;
  grade?: string;
  amountPaid: string;
  paymentDate: string;
  paymentFor: string;
  status: 'Paid' | 'Pending' | 'Partial' | 'Overdue';
  notes?: string;
  schoolId: string;
  createdAt: string;
}

export interface NewPaymentInput {
  studentIdentifier: string;
  studentName: string;
  grade: string;
  amountPaid: number;
  paymentDate: Date;
  paymentFor: string;
  notes?: string;
  schoolId: string;
}

export type PaymentUpdateInput = Partial<Omit<NewPaymentInput, 'schoolId' | 'studentIdentifier' | 'studentName' | 'grade'>>;

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

function docToPayment(doc: FirebaseFirestore.DocumentSnapshot): ClientSafePaymentData {
    const data = doc.data()!;
    return {
        id: doc.id,
        studentIdentifier: data.studentIdentifier,
        studentName: data.studentName,
        grade: data.grade,
        amountPaid: data.amountPaid,
        paymentDate: (data.paymentDate as Timestamp).toDate().toISOString(),
        paymentFor: data.paymentFor,
        status: data.status,
        notes: data.notes,
        schoolId: data.schoolId,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    };
}


export async function getPayments(schoolId: string): Promise<ClientSafePaymentData[]> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get payments.");
        return [];
    }
    const paymentsRef = db.collection('schools').doc(schoolId).collection('payments');
    const snapshot = await paymentsRef.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(docToPayment);
}

export async function addPayment(data: NewPaymentInput): Promise<ClientSafePaymentData> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot add payment.");
    }
    const paymentsRef = db.collection('schools').doc(data.schoolId).collection('payments');
    
    const newPaymentData = {
        ...data,
        paymentDate: Timestamp.fromDate(data.paymentDate),
        amountPaid: formatCurrency(data.amountPaid),
        status: 'Paid', // Simplified for now
        createdAt: FieldValue.serverTimestamp(),
    };

    const newDocRef = await paymentsRef.add(newPaymentData);
    const newDoc = await newDocRef.get();
    return docToPayment(newDoc);
}

export async function updatePayment(id: string, updates: PaymentUpdateInput, schoolId: string): Promise<ClientSafePaymentData> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot update payment.");
    }
    const paymentRef = db.collection('schools').doc(schoolId).collection('payments').doc(id);

    const dataToUpdate: any = { ...updates, updatedAt: FieldValue.serverTimestamp() };
    if (updates.amountPaid !== undefined) {
        dataToUpdate.amountPaid = formatCurrency(updates.amountPaid);
    }
    if (updates.paymentDate) {
        dataToUpdate.paymentDate = Timestamp.fromDate(new Date(updates.paymentDate));
    }

    await paymentRef.update(dataToUpdate);
    const updatedDoc = await paymentRef.get();
    return docToPayment(updatedDoc);
}

export async function deletePayment(id: string, schoolId: string): Promise<void> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not initialized. Cannot delete payment.");
    }
    const paymentRef = db.collection('schools').doc(schoolId).collection('payments').doc(id);
    await paymentRef.delete();
}
