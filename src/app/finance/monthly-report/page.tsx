
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PageTitle } from '@/components/shared/PageTitle';
import { ChevronLeft, Printer, Loader2, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { format, startOfMonth, getYear, getMonth, setYear, setMonth, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getStudents, type ClientSafeStudentData } from '@/services/studentService';
import { getPayments, type ClientSafePaymentData } from '@/services/paymentService';
import { getExpensesForMonth } from '@/services/expenseService';

interface MonthlyReportData {
  month: string;
  year: number;
  totalFees: number;
  collected: number;
  uncollected: number;
  discounts: number; 
  balance: number;
  expenses: number;
}

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
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

export default function MonthlyReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const schoolName = currentUser?.schoolName || "AL-FURQAAN SCHOOL";
  const currentSchoolId = currentUser?.schoolId;

  const [selectedYear, setSelectedYear] = React.useState<string>(`${new Date().getFullYear()}`);
  const [reportData, setReportData] = React.useState<MonthlyReportData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);


  const generateReportForYear = React.useCallback(async (year: number) => {
    if (!currentSchoolId) {
      if (!isAuthLoading) toast({ title: "Error", description: "School context not found.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [allStudents, allPayments] = await Promise.all([
        getStudents(currentSchoolId),
        getPayments(currentSchoolId)
      ]);

      const monthlyBreakdownPromises: Promise<MonthlyReportData>[] = [];
      const academicYearStartMonth = 8; // September (month index 8)

      for (let i = 0; i < 12; i++) {
        const monthIndex = (academicYearStartMonth + i) % 12;
        const currentYearForMonth = monthIndex >= academicYearStartMonth ? year : year + 1;
        
        const monthDate = setMonth(setYear(new Date(), currentYearForMonth), monthIndex);
        
        const promise = async () => {
            const monthStart = startOfMonth(monthDate);
            const monthName = format(monthStart, 'MMMM');

            const totalFeesForMonth = allStudents.reduce((sum, student) => sum + calculateStudentFee(student), 0);
            
            const collectedForMonth = allPayments
              .filter(p => {
                const paymentDate = parseISO(p.paymentDate);
                return getYear(paymentDate) === currentYearForMonth && getMonth(paymentDate) === monthIndex;
              })
              .reduce((sum, p) => sum + parseFloat(p.amountPaid.replace('$', '')), 0);

            const expensesForMonth = await getExpensesForMonth(currentSchoolId, monthStart);
            
            const uncollected = totalFeesForMonth - collectedForMonth;
            const balance = collectedForMonth - expensesForMonth;

            return {
              month: monthName,
              year: currentYearForMonth,
              totalFees: totalFeesForMonth,
              collected: collectedForMonth,
              uncollected: uncollected,
              discounts: 0, // Placeholder for discount logic
              balance: balance,
              expenses: expensesForMonth,
            };
        };
        monthlyBreakdownPromises.push(promise());
      }

      const resolvedData = await Promise.all(monthlyBreakdownPromises);
      setReportData(resolvedData);

    } catch (error: any) {
      toast({ title: "Error Generating Report", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentSchoolId, toast, isAuthLoading]);


  React.useEffect(() => {
    if (!isAuthLoading && currentSchoolId) {
        generateReportForYear(parseInt(selectedYear, 10));
    }
  }, [selectedYear, generateReportForYear, isAuthLoading, currentSchoolId]);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
            <PageTitle title="Monthly Financial Reports" description={`View annual summaries for ${schoolName}.`} />
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.back()} className="h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all group">
                  <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back
                </Button>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print Report
                </Button>
            </div>
        </div>
        
        <Card className="print-container">
            <CardHeader>
                <div className="print-header text-center my-4 hidden">
                    <h1 className="text-2xl font-bold">{schoolName}</h1>
                    <p className="text-lg">Financial Report Summary</p>
                    <p className="text-sm text-muted-foreground">{selectedYear}-{parseInt(selectedYear, 10) + 1}</p>
                </div>
                <div className="flex justify-between items-center no-print">
                    <div>
                        <CardTitle>Xisaab Xidhka Guud</CardTitle>
                        <CardDescription>Overall Financial Summary for the Academic Year</CardDescription>
                    </div>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                         <SelectTrigger className="w-[180px]">
                             <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="2023">2023-2024</SelectItem>
                             <SelectItem value="2024">2024-2025</SelectItem>
                             <SelectItem value="2025">2025-2026</SelectItem>
                             <SelectItem value="2026">2026-2027</SelectItem>
                         </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px]">No</TableHead>
                                <TableHead>Bisha</TableHead>
                                <TableHead>Wadar</TableHead>
                                <TableHead>La Ururiyay</TableHead>
                                <TableHead>Aan La Ururin</TableHead>
                                <TableHead>Qiimo-Dhimis</TableHead>
                                <TableHead>Hadhaa</TableHead>
                                <TableHead>Kharashaad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map((data, index) => (
                                <TableRow key={`${data.month}-${data.year}`} className="hover:bg-gray-50">
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-semibold text-primary">{`${data.month} ${data.year}`}</TableCell>
                                    <TableCell>{formatCurrency(data.totalFees)}</TableCell>
                                    <TableCell className="text-green-600 font-medium">{formatCurrency(data.collected)}</TableCell>
                                    <TableCell className="text-red-600 font-medium">{formatCurrency(data.uncollected)}</TableCell>
                                    <TableCell>{formatCurrency(data.discounts)}</TableCell>
                                    <TableCell className="font-bold">{formatCurrency(data.balance)}</TableCell>
                                    <TableCell>{formatCurrency(data.expenses)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow className="bg-muted font-bold text-sm">
                                <TableCell colSpan={2} className="text-right">Totals</TableCell>
                                <TableCell>{formatCurrency(reportData.reduce((s, d) => s + d.totalFees, 0))}</TableCell>
                                <TableCell className="text-green-700">{formatCurrency(reportData.reduce((s, d) => s + d.collected, 0))}</TableCell>
                                <TableCell className="text-red-700">{formatCurrency(reportData.reduce((s, d) => s + d.uncollected, 0))}</TableCell>
                                <TableCell>{formatCurrency(reportData.reduce((s, d) => s + d.discounts, 0))}</TableCell>
                                <TableCell>{formatCurrency(reportData.reduce((s, d) => s + d.balance, 0))}</TableCell>
                                <TableCell>{formatCurrency(reportData.reduce((s, d) => s + d.expenses, 0))}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                )}
            </CardContent>
        </Card>
        
        <style jsx global>{`
            @media print {
                .no-print {
                    display: none !important;
                }
                .print-container {
                    box-shadow: none;
                    border: none;
                }
                .print-header {
                    display: block !important;
                }
                body {
                    background-color: #fff !important;
                }
            }
        `}</style>
    </div>
  );
}
