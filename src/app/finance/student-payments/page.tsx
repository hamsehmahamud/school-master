

'use client';

import * as React from 'react';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as ShadCnTableFooter } from "@/components/ui/table";
import { FilePlus2, Filter, Search, CalendarIcon, Loader2, Trash2, AlertTriangle, Bus, MoreHorizontal, Edit, Eye, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format as formatDateFns, parseISO, differenceInMonths, startOfMonth } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { getPayments, addPayment, deletePayment, updatePayment, type ClientSafePaymentData, type NewPaymentInput, type PaymentUpdateInput } from '@/services/paymentService';
import { getStudentByStudentAppId, type ClientSafeStudentData as StudentInfo } from '@/services/studentService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Timestamp } from 'firebase/firestore';

interface NewPaymentFormState {
  studentIdentifier: string;
  studentName: string;
  grade: string;
  paymentDate: Date | undefined;
  amountPaid: string;
  paymentFor: string;
  notes: string;
}

const initialNewPaymentFormState: NewPaymentFormState = {
  studentIdentifier: "",
  studentName: "",
  grade: "",
  paymentDate: new Date(),
  amountPaid: "",
  paymentFor: "",
  notes: "",
};

interface PaymentsByGrade {
  [grade: string]: number;
}

const BUS_FEE_USD = 10;
const NORMAL_STUDENT_FEE_USD = 20;
const SIBLING_FEE_USD = 15;

export default function StudentPaymentsPage() {
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [payments, setPayments] = React.useState<ClientSafePaymentData[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = React.useState(true);

  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formState, setFormState] = React.useState<NewPaymentFormState>(initialNewPaymentFormState);
  const [editingPayment, setEditingPayment] = React.useState<ClientSafePaymentData | null>(null);

  const [isFetchingStudentDetails, setIsFetchingStudentDetails] = React.useState(false);
  const [monthlyFee, setMonthlyFee] = React.useState<number | null>(null);

  const [paymentToDelete, setPaymentToDelete] = React.useState<ClientSafePaymentData | null>(null);
  const [paymentToView, setPaymentToView] = React.useState<ClientSafePaymentData | null>(null);

  const [paymentsByGrade, setPaymentsByGrade] = React.useState<PaymentsByGrade>({});
  const [totalAllPayments, setTotalAllPayments] = React.useState<number>(0);

  const [busPaymentsByGrade, setBusPaymentsByGrade] = React.useState<PaymentsByGrade>({});
  const [totalAllBusPayments, setTotalAllBusPayments] = React.useState<number>(0);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const currentSchoolId = currentUser?.schoolId;
  const currentSchoolName = currentUser?.schoolName || "Your School";

  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : value;
    if (isNaN(num)) return "$0.00";
    return `$${num.toFixed(2)}`;
  };

  const fetchPayments = React.useCallback(async () => {
    if (!currentSchoolId || isAuthLoading) {
      if (!isAuthLoading) {
        toast({ title: "School ID Missing", description: "Cannot load payments without a school context.", variant: "destructive" });
      }
      setPayments([]);
      setIsLoadingPayments(false);
      return;
    }
    setIsLoadingPayments(true);
    try {
      const fetchedPayments = await getPayments(currentSchoolId);
      setPayments(fetchedPayments);
    } catch (error: any) {
      toast({
        title: "Error Fetching Payments",
        description: error.message || "Could not load payment records from database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayments(false);
    }
  }, [toast, currentSchoolId, isAuthLoading]);

  React.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  React.useEffect(() => {
    if (payments.length > 0) {
      const byGrade: PaymentsByGrade = {};
      const busByGrade: PaymentsByGrade = {};
      let currentTotalAllPayments = 0;
      let currentTotalBusPayments = 0;

      payments.forEach(payment => {
        const grade = payment.grade || "Aan La Aqoon (Unknown)";
        const amount = parseFloat(String(payment.amountPaid).replace(/[^\d.-]/g, ''));
        if (!isNaN(amount)) {
          byGrade[grade] = (byGrade[grade] || 0) + amount;
          currentTotalAllPayments += amount;

          if (payment.paymentFor === 'Transportation Fees' || payment.paymentFor === 'School fee + Bus') {
            const busAmount = payment.paymentFor === 'Transportation Fees' ? amount : BUS_FEE_USD;
            busByGrade[grade] = (busByGrade[grade] || 0) + busAmount;
            currentTotalBusPayments += busAmount;
          }
        }
      });
      setPaymentsByGrade(byGrade);
      setTotalAllPayments(currentTotalAllPayments);
      setBusPaymentsByGrade(busByGrade);
      setTotalAllBusPayments(currentTotalBusPayments);
    } else {
      setPaymentsByGrade({});
      setTotalAllPayments(0);
      setBusPaymentsByGrade({});
      setTotalAllBusPayments(0);
    }
  }, [payments]);

  const calculateStudentFee = (student: StudentInfo): number => {
    let baseFee = student.feeAmount || 0;
    if (student.paymentType === 'Free') {
      baseFee = 0;
    } else if (student.paymentType === 'Payer' && student.socialStatus === 'Walaalo') {
      baseFee = SIBLING_FEE_USD;
    } else if (student.paymentType === 'Payer') {
      baseFee = NORMAL_STUDENT_FEE_USD;
    }
    const busFee = student.usesBus?.toLowerCase() === 'yes' ? BUS_FEE_USD : 0;
    return baseFee + busFee;
  };

  const getPaymentsForStudent = async (studentAppId: string, schoolId: string): Promise<ClientSafePaymentData[]> => {
    // This is a placeholder. You would implement this in your paymentService.
    return payments.filter(p => p.studentIdentifier === studentAppId && p.schoolId === schoolId);
  }

  const handleStudentIdBlur = async () => {
    if (!formState.studentIdentifier.trim() || !currentSchoolId || editingPayment) return;

    setIsFetchingStudentDetails(true);
    setFormState(prev => ({ ...prev, amountPaid: '' }));
    setMonthlyFee(null);
    try {
      const student = await getStudentByStudentAppId(formState.studentIdentifier.trim(), currentSchoolId);
      if (student) {
        setFormState(prev => ({ ...prev, studentName: student.fullName, grade: student.gradeApplyingFor || "" }));
        const calculatedMonthlyFee = calculateStudentFee(student);
        setMonthlyFee(calculatedMonthlyFee);

        if (calculatedMonthlyFee > 0) {
          const studentPayments = await getPaymentsForStudent(student.studentAppId, currentSchoolId);
          const lastPayment = studentPayments[0];
          const academicYearStart = new Date().getMonth() >= 8 ? new Date(new Date().getFullYear(), 8, 1) : new Date(new Date().getFullYear() - 1, 8, 1);
          const lastPaymentDate = lastPayment ? parseISO(lastPayment.paymentDate) : academicYearStart;
          const today = new Date();
          let monthsSinceLastPayment = differenceInMonths(startOfMonth(today), startOfMonth(lastPaymentDate));
          if (!lastPayment) { monthsSinceLastPayment += 1; }

          const outstandingAmount = monthsSinceLastPayment * calculatedMonthlyFee;
          const finalAmount = outstandingAmount > 0 ? String(outstandingAmount) : String(calculatedMonthlyFee);

          setFormState(prev => ({ ...prev, amountPaid: finalAmount }));
          toast({ title: "Arday La Helay", description: `Magaca ardayga (${student.fullName}) waa la buuxiyey. Lacagta ka maqan: ${formatCurrency(outstandingAmount > 0 ? outstandingAmount : calculatedMonthlyFee)}` });
        } else {
          setFormState(prev => ({ ...prev, amountPaid: "0.00" }));
          toast({ title: "Arday La Helay", description: `Ardaygan waa lacag la'aan.` });
        }
      } else {
        setFormState(prev => ({ ...prev, studentName: "", grade: "", amountPaid: "" }));
        setMonthlyFee(null);
        toast({ title: "Arday Lama Helin", description: `Fadlan hubi aqoonsiga ardayga.`, variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error fetching student by ID:", error);
      setFormState(prev => ({ ...prev, studentName: "", grade: "", amountPaid: "" }));
      setMonthlyFee(null);
      toast({ title: "Error", description: "Qalad ayaa dhacay xiligii la raadinayay ardayga.", variant: "destructive" });
    } finally {
      setIsFetchingStudentDetails(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof NewPaymentFormState, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormState(prev => ({ ...prev, paymentDate: date }));
  };

  const openFormDialog = (payment?: ClientSafePaymentData) => {
    if (payment) {
      setEditingPayment(payment);
      let dateValue: Date | undefined;
      try {
        if (payment.paymentDate) {
          dateValue = parseISO(payment.paymentDate);
          if (isNaN(dateValue.getTime())) {
            dateValue = new Date();
          }
        } else {
          dateValue = new Date();
        }
      } catch (e) {
        dateValue = new Date();
      }

      setFormState({
        studentIdentifier: payment.studentIdentifier,
        studentName: payment.studentName || '',
        grade: payment.grade || '',
        paymentDate: dateValue,
        amountPaid: payment.amountPaid.replace(/[^\d.]/g, ''),
        paymentFor: payment.paymentFor,
        notes: payment.notes || '',
      });
      setMonthlyFee(null);
    } else {
      setEditingPayment(null);
      setFormState(initialNewPaymentFormState);
      setMonthlyFee(null);
    }
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!currentSchoolId || !formState.paymentDate || !formState.amountPaid || !formState.paymentFor) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(String(formState.amountPaid).replace(/[^\d.-]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPayment) {
        const updateData: PaymentUpdateInput = {
          paymentDate: formState.paymentDate,
          amountPaid: amount,
          paymentFor: formState.paymentFor,
          notes: formState.notes,
        };
        await updatePayment(editingPayment.id, updateData, currentSchoolId);
        toast({ title: "Payment Updated", description: `Payment for ${formState.studentName} has been updated.` });
      } else {
        const paymentInput: NewPaymentInput = {
          studentIdentifier: formState.studentIdentifier,
          studentName: formState.studentName,
          grade: formState.grade,
          paymentDate: formState.paymentDate,
          amountPaid: amount,
          paymentFor: formState.paymentFor,
          notes: formState.notes,
          schoolId: currentSchoolId,
        };
        await addPayment(paymentInput);
        toast({ title: "Payment Recorded", description: `Payment for ${formState.studentName} has been recorded.` });
      }
      setIsFormDialogOpen(false);
      fetchPayments();
    } catch (error: any) {
      toast({ title: "Error Saving Payment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeletePayment = async () => {
    if (!paymentToDelete || !currentSchoolId) return;
    setIsSubmitting(true);
    try {
      await deletePayment(paymentToDelete.id, currentSchoolId);
      toast({ title: "Payment Deleted", description: `Payment record has been deleted.` });
      setPaymentToDelete(null);
      fetchPayments();
    } catch (error: any) {
      toast({ title: "Error Deleting Payment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = React.useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = searchTerm === "" ||
        payment.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.studentIdentifier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || payment.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!currentSchoolId) {
    return (
      <div className="space-y-6">
        <PageTitle title="Lacagta Ardayda (Student Payments)" description={`For School: ${currentSchoolName}`} />
        <Card className="border-destructive bg-destructive/10">
          <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Access Denied</CardTitle></CardHeader>
          <CardContent><p className="text-destructive-foreground">You must be associated with a school to manage student payments.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title={`Detailed Payment Report for ${currentSchoolName}`} description="View, manage, and record all student fee payments for your school." />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Student Payment Records</CardTitle>
              <CardDescription>A comprehensive log of all payments made by students.</CardDescription>
            </div>
            <Button onClick={() => openFormDialog()} disabled={isSubmitting}>
              <FilePlus2 className="mr-2 h-4 w-4" /> Record New Payment
            </Button>
          </div>
          <div className="mt-4 flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or App ID..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Filter by Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Payment Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'paid'} onCheckedChange={() => setStatusFilter('paid')}>Paid</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'pending'} onCheckedChange={() => setStatusFilter('pending')}>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'partial'} onCheckedChange={() => setStatusFilter('partial')}>Partial</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'overdue'} onCheckedChange={() => setStatusFilter('overdue')}>Overdue</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPayments ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading payment records...</p></div>
          ) : filteredPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student App ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.studentIdentifier}</TableCell>
                    <TableCell>{payment.studentName || 'N/A'}</TableCell>
                    <TableCell>{payment.grade || 'N/A'}</TableCell>
                    <TableCell>{payment.amountPaid}</TableCell>
                    <TableCell>{payment.paymentDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${payment.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          payment.status === 'Partial' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isSubmitting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPaymentToView(payment)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openFormDialog(payment)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPaymentToDelete(payment)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Image src="https://placehold.co/300x200.png" alt="No payment records" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="empty state document" />
              <p className="text-muted-foreground">No student payment records found for {currentSchoolName}.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Payments Summary Per Class</CardTitle><CardDescription>Summary of total fees collected for each class.</CardDescription></CardHeader>
          <CardContent>
            {isLoadingPayments ? (<div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>) : Object.keys(paymentsByGrade).length > 0 ? (
              <Table><TableHeader><TableRow><TableHead>Class/Grade</TableHead><TableHead className="text-right">Total Paid</TableHead></TableRow></TableHeader><TableBody>{Object.entries(paymentsByGrade).sort(([gA], [gB]) => gA.localeCompare(gB)).map(([grade, total]) => (<TableRow key={grade}><TableCell className="font-medium">{grade}</TableCell><TableCell className="text-right">{formatCurrency(total)}</TableCell></TableRow>))}</TableBody><ShadCnTableFooter><TableRow><TableCell className="font-semibold text-right">Total Amount Collected:</TableCell><TableCell className="font-semibold text-right">{formatCurrency(totalAllPayments)}</TableCell></TableRow></ShadCnTableFooter></Table>
            ) : (<p className="text-muted-foreground text-center py-4">No payment data available.</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bus className="h-5 w-5 text-primary" /> Bus Payments Summary</CardTitle><CardDescription>Summary of bus fees collected for each class.</CardDescription></CardHeader>
          <CardContent>
            {isLoadingPayments ? (<div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>) : Object.keys(busPaymentsByGrade).length > 0 ? (
              <Table><TableHeader><TableRow><TableHead>Class/Grade</TableHead><TableHead className="text-right">Total Bus Fees Paid</TableHead></TableRow></TableHeader><TableBody>{Object.entries(busPaymentsByGrade).sort(([gA], [gB]) => gA.localeCompare(gB)).map(([grade, total]) => (<TableRow key={grade}><TableCell className="font-medium">{grade}</TableCell><TableCell className="text-right">{formatCurrency(total)}</TableCell></TableRow>))}</TableBody><ShadCnTableFooter><TableRow><TableCell className="font-semibold text-right">Total Bus Payments:</TableCell><TableCell className="font-semibold text-right">{formatCurrency(totalAllBusPayments)}</TableCell></TableRow></ShadCnTableFooter></Table>
            ) : (<div className="text-center py-10"><Bus className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No bus payment data found.</p></div>)}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={isOpen => { setIsFormDialogOpen(isOpen); if (!isOpen) setEditingPayment(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle className="text-xl text-center font-semibold">{editingPayment ? 'Edit Payment' : 'Diiwaangeli Lacag Bixin Cusub'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-3 md:col-span-2"><Label htmlFor="studentIdentifier">Student App ID</Label><div className="flex items-center gap-2"><Input id="studentIdentifier" name="studentIdentifier" value={formState.studentIdentifier} onChange={handleInputChange} onBlur={handleStudentIdBlur} placeholder="Enter student App ID" disabled={isSubmitting || isFetchingStudentDetails || !!editingPayment} className="flex-1" />{isFetchingStudentDetails && <Loader2 className="h-5 w-5 animate-spin text-primary" />}</div></div>
            <div className="space-y-3"><Label htmlFor="studentNameDisplay">Student Name</Label><Input id="studentNameDisplay" name="studentName" value={formState.studentName} readOnly className="bg-muted/50 border-dashed" placeholder="Student name appears here" /></div>
            <div className="space-y-3"><Label htmlFor="gradeDisplay">Grade</Label><Input id="gradeDisplay" name="grade" value={formState.grade} readOnly className="bg-muted/50 border-dashed" placeholder="Grade appears here" /></div>
            <div className="space-y-3"><Label htmlFor="paymentDate">Payment Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formState.paymentDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{formState.paymentDate ? formatDateFns(formState.paymentDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formState.paymentDate} onSelect={handleDateChange} initialFocus disabled={isSubmitting} /></PopoverContent></Popover></div>
            <div className="space-y-3"><Label htmlFor="paymentFor">Payment For</Label><Select name="paymentFor" value={formState.paymentFor} onValueChange={(value) => handleSelectChange("paymentFor" as keyof NewPaymentFormState, value)} disabled={isSubmitting}><SelectTrigger id="paymentFor"><SelectValue placeholder="Select purpose" /></SelectTrigger><SelectContent><SelectItem value="School Fees">School Fees</SelectItem><SelectItem value="Transportation Fees">Transportation Fees</SelectItem><SelectItem value="School fee + Bus">School fee + Bus</SelectItem><SelectItem value="Exam Fees">Exam Fees</SelectItem><SelectItem value="Books & Materials">Books & Materials</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
            {!editingPayment && (<div className="space-y-3"><Label htmlFor="monthlyFeeDisplay">Monthly Fee ($)</Label><Input id="monthlyFeeDisplay" name="monthlyFee" value={monthlyFee !== null ? formatCurrency(monthlyFee) : ''} readOnly className="bg-muted/50 border-dashed" placeholder="Monthly fee here" /></div>)}
            <div className="space-y-3"><Label htmlFor="amountPaid">Amount Paid ($)</Label><Input id="amountPaid" name="amountPaid" type="text" value={formState.amountPaid} onChange={handleInputChange} placeholder="Enter amount" disabled={isSubmitting} /></div>
            <div className="md:col-span-2 space-y-3"><Label htmlFor="notes">Additional Notes (Optional)</Label><Textarea id="notes" name="notes" value={formState.notes} onChange={handleInputChange} placeholder="Enter any additional notes" disabled={isSubmitting} /></div>
          </div>
          <DialogFooter className="pt-4"><DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose><Button type="submit" onClick={handleFormSubmit} disabled={isSubmitting || isFetchingStudentDetails}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingPayment ? 'Save Changes' : 'Record Payment'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Delete Payment</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this payment record? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setPaymentToDelete(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDeletePayment} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!paymentToView} onOpenChange={(open) => !open && setPaymentToView(null)}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Payment Details</DialogTitle></DialogHeader><div className="grid gap-2 py-4 text-sm">
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Student:</strong> {paymentToView?.studentName}</div>
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Student ID:</strong> {paymentToView?.studentIdentifier}</div>
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Grade:</strong> {paymentToView?.grade}</div>
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Amount:</strong> {paymentToView?.amountPaid}</div>
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Payment Date:</strong> {paymentToView?.paymentDate}</div>
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Purpose:</strong> {paymentToView?.paymentFor}</div>
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Notes:</strong> {paymentToView?.notes || 'N/A'}</div>
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Status:</strong> <span className={`px-2 py-1 text-xs rounded-full ${paymentToView?.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{paymentToView?.status}</span></div>
          <div className="grid grid-cols-[120px_1fr] items-center"><strong>Recorded At:</strong> {paymentToView?.createdAt}</div>
        </div><DialogFooter><Button onClick={() => setPaymentToView(null)}>Close</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
