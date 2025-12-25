
'use server';

import { getDb } from '@/lib/server/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';


export interface ClientSafeExpenseData {
  id: string;
  schoolId: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string; // ISO Date string
}

export async function getExpensesForMonth(schoolId: string, monthDate: Date): Promise<number> {
    const db = getDb();
    if (!db) {
        console.warn("Database not initialized, cannot get expenses.");
        return 0;
    }
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const startDate = Timestamp.fromDate(new Date(year, month, 1));
    const endDate = Timestamp.fromDate(new Date(year, month + 1, 0));

    const expensesRef = db.collection('schools').doc(schoolId).collection('expenses');
    const snapshot = await expensesRef
        .where('expenseDate', '>=', startDate)
        .where('expenseDate', '<=', endDate)
        .get();

    if (snapshot.empty) {
        return 0;
    }

    const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
    return total;
}

// Add more functions as needed: addExpense, getExpenses, etc.
