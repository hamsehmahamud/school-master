
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { format, getYear, getMonth, setYear, setMonth, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Printer, Loader2, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getStudents, type ClientSafeStudentData } from '@/services/studentService';
import { getPayments, type ClientSafePaymentData } from '@/services/paymentService';
import { getExpensesForMonth } from '@/services/expenseService';

const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`;

const SIBLING_FEE_USD = 15;
const NORMAL_STUDENT_FEE_USD = 20;
const BUS_FEE_USD = 10;

const calculateStudentFee = (student: ClientSafeStudentData): number => {
  let baseFee = 0; 
  if (student.paymentType === 'Free') {
      baseFee = 0;
  } else if (student.paymentType === 'Payer') {
      if (student.socialStatus === 'Walaalo') {
          baseFee = SIBLING_FEE_USD;
      } else {
          baseFee = NORMAL_STUDENT_FEE_USD;
      }
  } else if (student.feeAmount) {
      baseFee = student.feeAmount;
  }
  
  const busFee = student.usesBus === 'yes' ? BUS_FEE_USD : 0;
  return baseFee + busFee;
};

interface RevenueData {
    totalFeesDue: number;
    feesCollected: number;
    uncollectedFees: number;
    collectedPreviousFees: number;
}

interface ExpenseData {
    employeeSalaries: number;
    advanceSalaryPayments: number;
    operationalServices: number;
    equipmentAndSupplies: number;
    otherExpenses: number;
}

export default function IncomeStatementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const schoolName = currentUser?.schoolName || 'School';
    const schoolId = currentUser?.schoolId;

    const [selectedMonth, setSelectedMonth] = React.useState<string>(format(new Date(), 'MMMM'));
    const [selectedYear, setSelectedYear] = React.useState<string>(format(new Date(), 'yyyy'));
    const [isLoading, setIsLoading] = React.useState(true);

    const [revenueData, setRevenueData] = React.useState<RevenueData>({
        totalFeesDue: 0,
        feesCollected: 0,
        uncollectedFees: 0,
        collectedPreviousFees: 0,
    });
    const [expenseData, setExpenseData] = React.useState<ExpenseData>({
        employeeSalaries: 0,
        advanceSalaryPayments: 0,
        operationalServices: 0,
        equipmentAndSupplies: 0,
        otherExpenses: 0,
    });
    
    const fetchDataForMonth = React.useCallback(async (year: number, month: number) => {
        if (!schoolId) {
            if (!isAuthLoading) toast({ title: "Error", description: "School context missing.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            const [allStudents, allPayments, totalExpensesForMonth] = await Promise.all([
                getStudents(schoolId),
                getPayments(schoolId),
                getExpensesForMonth(schoolId, new Date(year, month)),
            ]);

            const totalFeesDueForMonth = allStudents.reduce((sum, student) => sum + calculateStudentFee(student), 0);
            
            const feesCollectedForMonth = allPayments
              .filter(p => {
                const paymentDate = parseISO(p.paymentDate);
                return getYear(paymentDate) === year && getMonth(paymentDate) === month;
              })
              .reduce((sum, p) => sum + parseFloat(p.amountPaid.replace('$', '')), 0);

            setRevenueData({
                totalFeesDue: totalFeesDueForMonth,
                feesCollected: feesCollectedForMonth,
                uncollectedFees: totalFeesDueForMonth - feesCollectedForMonth,
                collectedPreviousFees: 0, // Placeholder
            });

            setExpenseData({
                employeeSalaries: totalExpensesForMonth, // Assuming all expenses are salaries for now
                advanceSalaryPayments: 0,
                operationalServices: 0,
                equipmentAndSupplies: 0,
                otherExpenses: 0,
            });

        } catch (error: any) {
            toast({ title: "Error loading data", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [schoolId, isAuthLoading, toast]);
    
    React.useEffect(() => {
        const year = parseInt(selectedYear, 10);
        const month = new Date(Date.parse(selectedMonth +" 1, 2021")).getMonth();
        if (!isAuthLoading) {
            fetchDataForMonth(year, month);
        }
    }, [selectedYear, selectedMonth, isAuthLoading, fetchDataForMonth]);

    const handlePrint = () => {
        window.print();
    };

    const totalRevenue = revenueData.feesCollected + revenueData.collectedPreviousFees;
    const totalExpenses = Object.values(expenseData).reduce((sum, val) => sum + val, 0);
    const netIncome = totalRevenue - totalExpenses;

    return (
        <div className="bg-muted/30 min-h-screen p-4 sm:p-6 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 no-print">
                    <Button variant="outline" onClick={() => router.back()} className="h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all group">
                        <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isLoading}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => new Date(0, i)).map(date => (
                                    <SelectItem key={format(date, 'MMMM')} value={format(date, 'MMMM')}>{format(date, 'MMMM')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isLoading}>
                            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handlePrint} disabled={isLoading}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                    </div>
                </div>

                <Card className="shadow-lg print:shadow-none print:border-none">
                    <CardContent className="p-6 md:p-10" id="income-statement-print-area">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{schoolName} Income Statement Report</h1>
                            <p className="text-lg font-semibold text-primary">{selectedMonth} {selectedYear}</p>
                        </div>
                        
                        {isLoading ? (
                            <div className="flex justify-center items-center h-96">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : (
                        <div className="space-y-8">
                            {/* Revenue Summary */}
                            <div className="border border-border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="text-base font-semibold text-foreground p-4">Revenue Summary</TableHead>
                                            <TableHead className="text-right text-base font-semibold text-foreground p-4">Amount (USD)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="hover:bg-transparent"><TableCell>Total Fees Due</TableCell><TableCell className="text-right">{formatCurrency(revenueData.totalFeesDue)}</TableCell></TableRow>
                                        <TableRow className="hover:bg-transparent"><TableCell>Fees Collected</TableCell><TableCell className="text-right">{formatCurrency(revenueData.feesCollected)}</TableCell></TableRow>
                                        <TableRow className="hover:bg-transparent"><TableCell>Uncollected Fees</TableCell><TableCell className="text-right">{formatCurrency(revenueData.uncollectedFees)}</TableCell></TableRow>
                                        <TableRow className="hover:bg-transparent"><TableCell>Collected Previous Fees</TableCell><TableCell className="text-right">{formatCurrency(revenueData.collectedPreviousFees)}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                            <TableCell className="p-4">Total Revenue</TableCell>
                                            <TableCell className="text-right p-4">{formatCurrency(totalRevenue)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>

                            {/* Expense Summary */}
                             <div className="border border-border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="text-base font-semibold text-foreground p-4">Expense Summary</TableHead>
                                            <TableHead className="text-right text-base font-semibold text-foreground p-4">Amount (USD)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="hover:bg-transparent"><TableCell>Employee Salaries</TableCell><TableCell className="text-right">{formatCurrency(expenseData.employeeSalaries)}</TableCell></TableRow>
                                        <TableRow className="hover:bg-transparent"><TableCell>Advance Salary Payments</TableCell><TableCell className="text-right">{formatCurrency(expenseData.advanceSalaryPayments)}</TableCell></TableRow>
                                        <TableRow className="hover:bg-transparent"><TableCell>Operational Services</TableCell><TableCell className="text-right">{formatCurrency(expenseData.operationalServices)}</TableCell></TableRow>
                                        <TableRow className="hover:bg-transparent"><TableCell>Equipment and Supplies</TableCell><TableCell className="text-right">{formatCurrency(expenseData.equipmentAndSupplies)}</TableCell></TableRow>
                                        <TableRow className="hover:bg-transparent"><TableCell>Other Expenses</TableCell><TableCell className="text-right">{formatCurrency(expenseData.otherExpenses)}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                            <TableCell className="p-4">Total Expenses</TableCell>
                                            <TableCell className="text-right p-4">{formatCurrency(totalExpenses)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>

                            {/* Net Income */}
                            <Card className="border-primary/30 bg-primary/5">
                                <CardHeader className="flex-row items-center justify-between p-4">
                                     <CardTitle className="text-lg text-primary">Net Income</CardTitle>
                                     <p className="text-2xl font-bold text-primary">{formatCurrency(netIncome)}</p>
                                </CardHeader>
                            </Card>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </div>
             <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background-color: #fff !important;
                    }
                    .print\:p-0 {
                        padding: 0 !important;
                    }
                     .print\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\:border-none {
                        border: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
