
'use client';

import Link from 'next/link';
import { Wallet, CheckSquare, XCircle, TrendingUp, HardHat, FileText, Loader2, Building, AlertTriangle, CalendarDays, Printer, Eye, Edit, Banknote, Users, Percent, Bus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStudents, type ClientSafeStudentData } from '@/services/studentService';
import { getClassrooms, updateClassroom, type ClientSafeClassroomData } from '@/services/classroomService';
import { getPayments, type ClientSafePaymentData } from '@/services/paymentService';
import { getTeacherFinancialsForMonth, type ClientSafeTeacherFinancialRecord } from '@/services/teacherFinancialsService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';


interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  subValue?: string;
  iconBgColor?: string;
  iconColor?: string;
  isLoading?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value, subValue, iconBgColor = 'bg-primary/10', iconColor = 'text-primary', isLoading = false }) => {
  const displayValue = isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : value;
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="flex items-center p-4 rounded-lg bg-card shadow-sm border col-span-1"
    >
      <div className={`p-3 rounded-lg mr-4 ${iconBgColor}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="block text-2xl font-bold text-foreground">{displayValue}</span>
        {subValue && !isLoading && <span className="text-xs text-muted-foreground">{subValue}</span>}
      </div>
    </motion.div>
  );
};


const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

const parseCurrency = (value: string): number => {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
};

interface ClassroomFeeDetail {
  id: string;
  name: string;
  teacher?: string;
  studentCount: number;
  totalFeeDisplay: string;
  collectedAmount: string;
  discountAmount: string;
  balanceAmount: string;
  students: StudentFeeDetail[];
}

interface StudentFeeDetail {
    id: string;
    name: string;
    feeDue: number;
    amountPaid: number;
    balance: number;
    status: 'Paid' | 'Partial' | 'Due' | 'Free';
}

interface SchoolSummaryStats {
    totalStudents: number;
    paidStudents: number;
    unpaidStudents: number;
    freeStudents: number;
    totalRevenue: number;
    collectedRevenue: number;
    uncollectedRevenue: number;
    balance: number;
}


const SchoolSummaryCard = ({ title, data, isLoading }: { title: string, data?: SchoolSummaryStats, isLoading: boolean }) => (
    <div id="dugsiyada-print-area" className="border-2 border-dashed border-primary/20 p-4 rounded-lg bg-white dark:bg-card shadow-md">
        <h3 className="text-center font-bold text-lg text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-muted/50 p-2 rounded-t-md -m-4 mb-4">{title}</h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>Total</span><span className="font-bold">{data.totalStudents}</span></div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>Bixiyey</span><span className="font-bold">{data.paidStudents}</span></div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>Aan Bixin</span><span className="font-bold">{data.unpaidStudents}</span></div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>Bilaash</span><span className="font-bold">{data.freeStudents}</span></div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 p-2 rounded"><span>Total</span><span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(data.totalRevenue)}</span></div>
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 p-2 rounded"><span>La Ururiyey</span><span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(data.collectedRevenue)}</span></div>
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 p-2 rounded"><span>Aan La Ururin</span><span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(data.uncollectedRevenue)}</span></div>
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 p-2 rounded"><span>Hadhaa</span><span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(data.balance)}</span></div>
            </div>
        </div>
        ) : (
          <div className="text-center text-muted-foreground p-4">No data available.</div>
        )}
    </div>
);

const OtherSummaryCard = () => (
    <div className="border-2 border-dashed border-primary/20 p-4 rounded-lg bg-white dark:bg-card shadow-md max-w-md mx-auto">
         <div className="space-y-1">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>Fil Qoys</span><span className="font-bold text-blue-700 dark:text-blue-300">$0.00</span></div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>Fil Hore</span><span></span></div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>A.Cusub</span><span className="font-bold">0</span></div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>Deleted</span><span className="font-bold">1</span></div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-muted/40 p-2 rounded"><span>Duplicate</span><span className="font-bold">0</span></div>
        </div>
    </div>
);

export default function FinanceDashboardPage() {
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const currentSchoolId = currentUser?.schoolId;

  const [dateFilterType, setDateFilterType] = useState<'monthly' | 'weekly' | 'yearly' | 'custom'>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  const [isLoadingData, setIsLoadingData] = useState(true);

  const [financialStats, setFinancialStats] = useState({
    totalExpectedRevenue: 0,
    feePayingStudents: 0,
    totalCollectedRevenue: 0,
    totalCollectedCount: 0,
    totalOutstandingRevenue: 0,
    totalOutstandingCount: 0,
    expenses: 0,
    totalStudents: 0,
    totalClassrooms: 0,
    discountedStudents: 0,
    freeStudents: 0,
    busStudents: 0,
  });
  
  const [classroomFeeDetailsList, setClassroomFeeDetailsList] = useState<ClassroomFeeDetail[]>([]);
  const [totals, setTotals] = useState({ totalStudents: 0, totalFee: '$0.00', totalCollected: '$0.00', totalDiscount: '$0.00', totalBalance: '$0.00' });
  
  const [schoolSummaryData, setSchoolSummaryData] = useState<SchoolSummaryStats | undefined>(undefined);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedClassroomForDetails, setSelectedClassroomForDetails] = useState<ClassroomFeeDetail | null>(null);

  // State for editing classrooms
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [classroomToEdit, setClassroomToEdit] = useState<ClassroomFeeDetail | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [isUpdatingClassroom, setIsUpdatingClassroom] = useState(false);

  
  const fetchFinancialData = useCallback(async () => {
      if (isAuthLoading || !currentSchoolId) {
        if (!isAuthLoading) toast({ title: "School Context Missing", description: "Cannot load financial data.", variant: "destructive" });
        setIsLoadingData(false);
        return;
      }
      
      let startDate: Date;
      let endDate: Date;

      const currentDate = selectedDate || new Date();

      switch (dateFilterType) {
        case 'monthly':
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
          break;
        case 'weekly':
          startDate = startOfWeek(currentDate);
          endDate = endOfWeek(currentDate);
          break;
        case 'yearly':
          startDate = startOfYear(currentDate);
          endDate = endOfYear(currentDate);
          break;
        case 'custom':
          if (!customStartDate || !customEndDate) {
            setIsLoadingData(false);
            return;
          }
          startDate = customStartDate;
          endDate = customEndDate;
          break;
        default:
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
      }
      
      setIsLoadingData(true);
      try {
        const [allStudents, allPayments, fetchedClassrooms, teacherFinancials] = await Promise.all([
          getStudents(currentSchoolId),
          getPayments(currentSchoolId),
          getClassrooms(currentSchoolId),
          getTeacherFinancialsForMonth(currentSchoolId, startDate),
        ]);
        
        const SIBLING_FEE_USD = 15;
        const NORMAL_STUDENT_FEE_USD = 20;
        const BUS_FEE_USD = 10;
        
        const calculateStudentFee = (student: ClientSafeStudentData): number => {
            if (student.paymentType === 'Free') return 0;
            
            let baseFee = student.feeAmount || 0;
            if (student.paymentType === 'Payer') {
                if (student.socialStatus === 'Walaalo') {
                    baseFee = SIBLING_FEE_USD;
                } else {
                    baseFee = NORMAL_STUDENT_FEE_USD;
                }
            }
            
            const busFee = student.usesBus === 'yes' ? BUS_FEE_USD : 0;
            return baseFee + busFee;
        };


        const paymentsThisPeriod = allPayments.filter(p => isWithinInterval(new Date(p.paymentDate), { start: startDate, end: endDate }));
        const collectedThisPeriod = paymentsThisPeriod.reduce((sum, p) => sum + parseCurrency(p.amountPaid), 0);
        
        const totalStudentsCount = allStudents.length;
        const feePayingStudentsCount = allStudents.filter(s => s.paymentType === 'Payer' || s.paymentType === 'Discount').length;
        const discountedStudentsCount = allStudents.filter(s => s.paymentType === 'Discount').length;
        const freeStudentsCount = allStudents.filter(s => s.paymentType === 'Free').length;
        const busStudentsCount = allStudents.filter(s => s.usesBus === 'yes').length;

        const totalFeesDueForPeriod = allStudents.reduce((sum, student) => sum + calculateStudentFee(student), 0);
        
        const employeeSalaries = teacherFinancials.reduce((sum, record) => sum + record.baseSalary, 0);
        const advanceSalaryPayments = teacherFinancials.reduce((sum, record) => sum + record.bonus, 0);
        const totalExpenses = employeeSalaries + advanceSalaryPayments;
        
        const studentPaymentsMap: Record<string, number> = {};
        paymentsThisPeriod.forEach(p => {
            const student = allStudents.find(s => s.studentAppId === p.studentIdentifier);
            if (student) {
              studentPaymentsMap[student.id] = (studentPaymentsMap[student.id] || 0) + parseCurrency(p.amountPaid);
            }
        });
        
        let paidStudentsCount = 0;
        allStudents.forEach(s => {
          const feeDue = calculateStudentFee(s);
          if (feeDue === 0 && s.paymentType === 'Free') {
            // Free students are not counted in "paid"
          } else {
            const paidAmount = studentPaymentsMap[s.id] || 0;
            if (paidAmount >= feeDue) {
              paidStudentsCount++;
            }
          }
        });

        setFinancialStats({
            totalStudents: totalStudentsCount,
            totalClassrooms: fetchedClassrooms.length,
            totalExpectedRevenue: totalFeesDueForPeriod,
            feePayingStudents: feePayingStudentsCount,
            totalCollectedRevenue: collectedThisPeriod,
            totalCollectedCount: paidStudentsCount,
            totalOutstandingRevenue: totalFeesDueForPeriod - collectedThisPeriod,
            totalOutstandingCount: feePayingStudentsCount - paidStudentsCount,
            expenses: totalExpenses,
            discountedStudents: discountedStudentsCount,
            freeStudents: freeStudentsCount,
            busStudents: busStudentsCount,
        });

        setSchoolSummaryData({
          totalStudents: totalStudentsCount,
          paidStudents: paidStudentsCount,
          unpaidStudents: totalStudentsCount - paidStudentsCount - freeStudentsCount, 
          freeStudents: freeStudentsCount, 
          totalRevenue: totalFeesDueForPeriod,
          collectedRevenue: collectedThisPeriod,
          uncollectedRevenue: totalFeesDueForPeriod - collectedThisPeriod,
          balance: collectedThisPeriod - totalExpenses,
        });

        const classroomDetailsPromises = fetchedClassrooms.map(async (classroom) => {
          const studentsInClass = allStudents.filter(s => s.gradeApplyingFor === classroom.name);
          const totalFee = studentsInClass.reduce((sum, student) => sum + calculateStudentFee(student), 0);
          let collectedAmount = 0;

          const studentFeeDetails = studentsInClass.map(s => {
              const amountPaid = studentPaymentsMap[s.id] || 0;
              const feeDue = calculateStudentFee(s);
              const balance = feeDue - amountPaid;
              let status: StudentFeeDetail['status'] = 'Due';
              if (feeDue === 0) {
                status = 'Free';
              } else if (amountPaid >= feeDue) {
                status = 'Paid';
              } else if (amountPaid > 0) {
                status = 'Partial';
              }

              collectedAmount += amountPaid;

              return { id: s.id, name: s.fullName, feeDue, amountPaid, balance, status };
          });
          
          return {
            id: classroom.id,
            name: classroom.name,
            teacher: classroom.teacher,
            studentCount: studentsInClass.length,
            totalFeeDisplay: formatCurrency(totalFee),
            collectedAmount: formatCurrency(collectedAmount),
            discountAmount: formatCurrency(0), 
            balanceAmount: formatCurrency(totalFee - collectedAmount),
            students: studentFeeDetails,
          };
        });
        
        const classroomDetails = await Promise.all(classroomDetailsPromises);
        setClassroomFeeDetailsList(classroomDetails);
        
        const totalStudents = classroomDetails.reduce((sum, c) => sum + c.studentCount, 0);
        const totalFee = classroomDetails.reduce((sum, c) => sum + parseCurrency(c.totalFeeDisplay), 0);
        const totalCollected = classroomDetails.reduce((sum, c) => sum + parseCurrency(c.collectedAmount), 0);
        const totalDiscount = classroomDetails.reduce((sum, c) => sum + parseCurrency(c.discountAmount), 0);
        const totalBalance = classroomDetails.reduce((sum, c) => sum + parseCurrency(c.balanceAmount), 0);
        
        setTotals({
            totalStudents,
            totalFee: formatCurrency(totalFee),
            totalCollected: formatCurrency(totalCollected),
            totalDiscount: formatCurrency(totalDiscount),
            totalBalance: formatCurrency(totalBalance),
        });

      } catch (error: any) {
        console.error("Failed to fetch data for finance page:", error);
        toast({
          title: "Error Loading Data",
          description: error.message || "Could not calculate financial statistics.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    }, [toast, currentSchoolId, isAuthLoading, selectedDate, dateFilterType, customStartDate, customEndDate]);

  
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  
  const handlePrint = (areaId: string) => {
    const printContentEl = document.getElementById(areaId);
    if (!printContentEl) return;
    
    const printContent = printContentEl.innerHTML;
    const originalContent = document.body.innerHTML;
    const printTitle = `${currentUser?.schoolName || 'School'} Finance Report`;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${printTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 0.9rem; }
              th { background-color: #f2f2f2; }
              .no-print { display: none; }
              h2, h3 { text-align: center; }
            </style>
          </head>
          <body>
            <h2>${printTitle}</h2>
            <h3>${format(selectedDate || new Date(), "MMMM yyyy")}</h3>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleViewDetails = (classroomDetail: ClassroomFeeDetail) => {
    setSelectedClassroomForDetails(classroomDetail);
    setIsDetailsDialogOpen(true);
  };
  
  const handleEditClassroom = (classroom: ClassroomFeeDetail) => {
    const fullClassroomData = classroomFeeDetailsList.find(c => c.id === classroom.id);
    if(fullClassroomData){
      router.push(`/school/classrooms/${fullClassroomData.id}`);
    }
  };
  
  const handleUpdateClassroom = async () => {
    if (!classroomToEdit || !currentSchoolId || !editClassName.trim()) {
        toast({ title: "Validation Error", description: "Classroom name cannot be empty.", variant: "destructive"});
        return;
    }
    setIsUpdatingClassroom(true);
    try {
        await updateClassroom(classroomToEdit.id, currentSchoolId, {
            name: editClassName,
            teacher: editClassTeacher,
        });
        toast({ title: "Success", description: "Classroom updated successfully." });
        setIsEditDialogOpen(false);
        fetchFinancialData(); // Refresh all data on the page
    } catch(error: any) {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsUpdatingClassroom(false);
    }
  };

  const MotionCard = motion(Card);

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!currentSchoolId && !isAuthLoading) {
      return (
          <div className="space-y-6 p-4 md:p-6">
              <Card className="border-destructive bg-destructive/10">
                  <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> School Context Error</CardTitle></CardHeader>
                  <CardContent><p className="text-destructive-foreground">Your account is not associated with a school. Please contact support.</p></CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="space-y-6 p-2 md:p-4 finance-page-container">
      <div className="flex items-center justify-center my-4 no-print">
        <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="group relative"
        >
            <Button variant="default" className="h-28 w-28 rounded-full text-lg font-bold flex-col shadow-2xl border-4 border-background dark:border-gray-800 bg-primary hover:bg-primary/90">
                <Wallet className="h-10 w-10 mb-1 transition-transform duration-300 group-hover:scale-125" /> 
                XISAAB FURAN
            </Button>
             <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg -z-10 animate-pulse group-hover:animate-none" />
        </motion.div>
      </div>

      <MotionCard 
        className="shadow-lg no-print"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <CardTitle>Date Range Filters</CardTitle>
                <CardDescription>Select a period to view financial data.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="w-full sm:w-auto">
                  <Label htmlFor="date-filter-type">Filter Type</Label>
                  <Select value={dateFilterType} onValueChange={(v) => setDateFilterType(v as any)}>
                    <SelectTrigger id="date-filter-type"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dateFilterType !== 'custom' && (
                  <div className="w-full sm:w-auto">
                    <Label htmlFor="date-picker">Select Date</Label>
                    <Popover><PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal",!selectedDate && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}</Button>
                    </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus/></PopoverContent></Popover>
                  </div>
                )}
                {dateFilterType === 'custom' && (
                  <>
                  <div className="w-full sm:w-auto">
                    <Label htmlFor="start-date-picker">Start Date</Label>
                    <Popover><PopoverTrigger asChild><Button id="start-date-picker" variant="outline" className={cn("w-full justify-start text-left font-normal",!customStartDate && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{customStartDate ? format(customStartDate, "PPP") : <span>Start date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} initialFocus/></PopoverContent></Popover>
                  </div>
                  <div className="w-full sm:w-auto">
                    <Label htmlFor="end-date-picker">End Date</Label>
                    <Popover><PopoverTrigger asChild><Button id="end-date-picker" variant="outline" className={cn("w-full justify-start text-left font-normal",!customEndDate && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{customEndDate ? format(customEndDate, "PPP") : <span>End date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} disabled={(d) => d < (customStartDate || new Date(0))} initialFocus/></PopoverContent></Popover>
                  </div>
                  </>
                )}
              </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatItem icon={Banknote} label="Total Rev" value={formatCurrency(financialStats.totalExpectedRevenue)} subValue={`from ${financialStats.feePayingStudents} Students`} iconBgColor="bg-blue-100 dark:bg-blue-900/40" iconColor="text-blue-600 dark:text-blue-300" isLoading={isLoadingData} />
            <StatItem icon={CheckSquare} label="Collected" value={formatCurrency(financialStats.totalCollectedRevenue)} subValue={`${financialStats.totalCollectedCount} Paid`} iconBgColor="bg-green-100 dark:bg-green-900/40" iconColor="text-green-600 dark:text-green-300" isLoading={isLoadingData} />
            <StatItem icon={XCircle} label="Outstanding" value={formatCurrency(financialStats.totalOutstandingRevenue)} subValue={`${financialStats.totalOutstandingCount} Unpaid`} iconBgColor="bg-red-100 dark:bg-red-900/40" iconColor="text-red-600 dark:text-red-300" isLoading={isLoadingData} />
            <StatItem icon={Percent} label="Discounts" value="$0.00" subValue={`${financialStats.discountedStudents} Students`} iconBgColor="bg-indigo-100 dark:bg-indigo-900/40" iconColor="text-indigo-600 dark:text-indigo-300" isLoading={isLoadingData} />
            <StatItem icon={TrendingUp} label="Expenses" value={formatCurrency(financialStats.expenses)} subValue="Salaries & Costs" iconBgColor="bg-orange-100 dark:bg-orange-900/40" iconColor="text-orange-600 dark:text-orange-300" isLoading={isLoadingData} />
            <StatItem icon={Wallet} label="Balance" value={formatCurrency(financialStats.totalCollectedRevenue - financialStats.expenses)} subValue="Collected - Exp" iconBgColor="bg-purple-100 dark:bg-purple-900/40" iconColor="text-purple-600 dark:text-purple-300" isLoading={isLoadingData} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-4 border-t-2 border-dashed">
            <div className="text-center"><p className="text-xs text-muted-foreground">Total Classrooms</p><p className="font-bold text-lg">{isLoadingData ? '...' : financialStats.totalClassrooms}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Total Students</p><p className="font-bold text-lg">{isLoadingData ? '...' : financialStats.totalStudents}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Paying Students</p><p className="font-bold text-lg">{isLoadingData ? '...' : financialStats.feePayingStudents}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Discounted</p><p className="font-bold text-lg">{isLoadingData ? '...' : financialStats.discountedStudents}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Free Students</p><p className="font-bold text-lg">{isLoadingData ? '...' : financialStats.freeStudents}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Bus Students</p><p className="font-bold text-lg">{isLoadingData ? '...' : financialStats.busStudents}</p></div>
          </div>
        </CardContent>
      </MotionCard>

      <div className="mt-8">
        <Tabs defaultValue="fasalada" className="w-full">
            <Card className="no-print">
                 <CardHeader className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <TabsList className="grid w-full grid-cols-3 sm:w-auto h-auto">
                            <TabsTrigger value="fasalada" className="text-base gap-2 h-12"><Building className="h-5 w-5"/>Fasalada</TabsTrigger>
                            <TabsTrigger value="dugsiyada" className="text-base gap-2 h-12"><Building className="h-5 w-5"/>Dugsiyada</TabsTrigger>
                            <TabsTrigger value="w-dakhliga" asChild className="text-base gap-2 h-12">
                            <Link href="/finance/income-statement">
                                <FileText className="h-5 w-5"/>W-Dakhliga
                            </Link>
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button asChild className="h-12 text-base flex-grow sm:flex-grow-0">
                                <Link href="/finance/student-payments">Lacag-Qabasho</Link>
                            </Button>
                            <Button asChild variant="outline" className="h-12 text-base flex-grow sm:flex-grow-0">
                                <Link href="/finance/monthly-report">
                                    <FileText className="mr-2 h-4 w-4" /> Liiska Xisaab...
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <TabsContent value="fasalada" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Classroom Fee Report</CardTitle>
                      <Button variant="outline" onClick={() => handlePrint('fasalada-print-area')} className="no-print"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                    </div>
                  </CardHeader>
                  <CardContent id="fasalada-print-area">
                    {isLoadingData ? (
                        <div className="flex justify-center items-center p-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2 text-muted-foreground">Loading classroom fees...</p>
                        </div>
                    ) : classroomFeeDetailsList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>No</TableHead>
                            <TableHead>Fasal</TableHead>
                            <TableHead>Arday</TableHead>
                            <TableHead>Total ($)</TableHead>
                            <TableHead>La Ururiyey ($)</TableHead>
                            <TableHead>Q.Dhimis ($)</TableHead>
                            <TableHead>Baaqi ($)</TableHead>
                             <TableHead className="no-print text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classroomFeeDetailsList.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.studentCount}</TableCell>
                                <TableCell>{item.totalFeeDisplay}</TableCell>
                                <TableCell className="text-green-600">{item.collectedAmount}</TableCell>
                                <TableCell>{item.discountAmount}</TableCell>
                                <TableCell className="text-red-600">{item.balanceAmount}</TableCell>
                                <TableCell className="no-print text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(item)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClassroom(item)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold">
                                <TableCell colSpan={2} className="text-right">Total ({classroomFeeDetailsList.length}) Fasal</TableCell>
                                <TableCell>{totals.totalStudents}</TableCell>
                                <TableCell>{totals.totalFee}</TableCell>
                                <TableCell className="text-green-600 dark:text-green-400">{totals.totalCollected}</TableCell>
                                <TableCell>{totals.totalDiscount}</TableCell>
                                <TableCell className="text-red-600 dark:text-red-400">{totals.totalBalance}</TableCell>
                                <TableCell className="no-print"></TableCell>
                            </TableRow>
                        </TableFooter>
                        </Table>
                      </div>
                    ) : (
                        <CardContent className="text-center p-10">
                        <p className="text-muted-foreground">No classroom data available for {currentUser?.schoolName || 'your school'}.</p>
                        </CardContent>
                    )}
                  </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="dugsiyada" className="mt-6">
                <Card className="bg-transparent shadow-none border-none">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>School Financial Summary</CardTitle>
                        <Button variant="outline" onClick={() => handlePrint('dugsiyada-print-area')} className="no-print"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-wider">LACAG BIXINTA DUGSIYADA</h2>
                        <p className="font-semibold text-primary">{format(selectedDate || new Date(), "MMMM yyyy")}</p>
                    </div>
                    <div className="space-y-8">
                        <SchoolSummaryCard 
                          title={currentUser?.schoolName || "School Financial Summary"} 
                          data={schoolSummaryData}
                          isLoading={isLoadingData} 
                        />
                        <OtherSummaryCard />
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
      </div>

       <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Fee Details for {selectedClassroomForDetails?.name}</DialogTitle>
                    <DialogDescription>
                        Showing student payment status for the selected period.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="text-right">Fee Due</TableHead>
                                <TableHead className="text-right">Amount Paid</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedClassroomForDetails?.students.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(student.feeDue)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(student.amountPaid)}</TableCell>
                                    <TableCell className="text-right text-red-600">{formatCurrency(student.balance)}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={cn("px-2 py-1 text-xs rounded-full", {
                                            'bg-green-100 text-green-700': student.status === 'Paid',
                                            'bg-yellow-100 text-yellow-700': student.status === 'Partial',
                                            'bg-red-100 text-red-700': student.status === 'Due',
                                            'bg-blue-100 text-blue-700': student.status === 'Free',
                                        })}>
                                            {student.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
       </Dialog>
       
       <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) setClassroomToEdit(null);
          setIsEditDialogOpen(isOpen);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Classroom: {classroomToEdit?.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-class-name">Classroom Name</Label>
                        <Input id="edit-class-name" value={editClassName} onChange={(e) => setEditClassName(e.target.value)} disabled={isUpdatingClassroom} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-class-teacher">Teacher</Label>
                        <Input id="edit-class-teacher" value={editClassTeacher} onChange={(e) => setEditClassTeacher(e.target.value)} disabled={isUpdatingClassroom} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isUpdatingClassroom}>Cancel</Button></DialogClose>
                    <Button onClick={handleUpdateClassroom} disabled={isUpdatingClassroom}>
                        {isUpdatingClassroom && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>

       <style jsx global>{`
        @media print {
            .no-print {
                display: none !important;
            }
            .finance-page-container {
                padding: 0 !important;
                margin: 0 !important;
            }
            body {
                background-color: #fff !important;
            }
        }
      `}</style>

    </div>
  );
}
