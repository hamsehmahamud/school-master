
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Loader2, CalendarIcon, Search, UserPlus, Check, X, Clock, CheckSquare, BarChart, Wallet, Save, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getTeachers, type ClientSafeTeacherData } from '@/services/teacherService';
import { getTeacherFinancialsForMonth, updateTeacherFinancialRecord, type ClientSafeTeacherFinancialRecord, type TeacherFinancialUpdateInput } from '@/services/teacherFinancialsService';
import { addStaffAttendanceRecord, getStaffAttendanceForDate, getStaffAttendanceForMonth, type StaffAttendanceStatus } from '@/services/staffAttendanceService';
import { useToast } from '@/hooks/use-toast';
import { PageTitle } from '@/components/shared/PageTitle';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';


interface StaffMember extends ClientSafeTeacherData {
  // role is already in ClientSafeTeacherData
}

const formatCurrency = (amount: number): string => `$${amount.toFixed(2)}`;
const parseCurrency = (value: string | number): number => {
  const num = typeof value === 'string' ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : value;
  return isNaN(num) ? 0 : num;
}

interface MonthlySummary {
    present: number;
    absent: number;
    late: number;
}

export default function StaffManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [financials, setFinancials] = React.useState<ClientSafeTeacherFinancialRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingFinancials, setIsLoadingFinancials] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = React.useState('');
  const schoolId = currentUser?.schoolId;

  // --- Attendance State ---
  const [attendance, setAttendance] = React.useState<Record<string, StaffAttendanceStatus>>({});
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(false);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = React.useState(false);
  
  // --- Monthly Summary State ---
  const [monthlyAttendance, setMonthlyAttendance] = React.useState<Record<string, MonthlySummary>>({});
  const [isLoadingMonthly, setIsLoadingMonthly] = React.useState(false);
  const [summaryFilterType, setSummaryFilterType] = React.useState<'monthly' | 'custom'>('monthly');
  const [summaryMonth, setSummaryMonth] = React.useState<Date>(new Date());
  const [summaryCustomStart, setSummaryCustomStart] = React.useState<Date | undefined>(startOfMonth(new Date()));
  const [summaryCustomEnd, setSummaryCustomEnd] = React.useState<Date | undefined>(endOfMonth(new Date()));


  // --- Salary Payment Modal State ---
  const [isPaySalaryOpen, setIsPaySalaryOpen] = React.useState(false);
  const [selectedFinancialRecord, setSelectedFinancialRecord] = React.useState<ClientSafeTeacherFinancialRecord | null>(null);
  const [payAmount, setPayAmount] = React.useState('');
  const [advanceAmount, setAdvanceAmount] = React.useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);


  const fetchStaffData = React.useCallback(async () => {
    if (!schoolId || isAuthLoading) return;
    setIsLoading(true);
    try {
      const teachers = await getTeachers(schoolId);
      setStaff(teachers);
    } catch (error: any) {
      toast({ title: "Error loading staff", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, isAuthLoading, toast]);
  
  const fetchFinancialsData = React.useCallback(async () => {
    if (!schoolId || !date) return;
    setIsLoadingFinancials(true);
    try {
        const fetchedFinancials = await getTeacherFinancialsForMonth(schoolId, date);
        setFinancials(fetchedFinancials);
    } catch (error: any) {
        toast({ title: "Error loading financials", description: error.message, variant: "destructive" });
    } finally {
        setIsLoadingFinancials(false);
    }
  }, [schoolId, date, toast]);

  const fetchMonthlyAttendanceSummary = React.useCallback(async () => {
    if (!schoolId || staff.length === 0) return;

    let startDate: Date;
    let endDate: Date;

    if (summaryFilterType === 'monthly') {
        startDate = startOfMonth(summaryMonth);
        endDate = endOfMonth(summaryMonth);
    } else {
        if (!summaryCustomStart || !summaryCustomEnd) return;
        startDate = summaryCustomStart;
        endDate = summaryCustomEnd;
    }

    setIsLoadingMonthly(true);
    try {
        const records = await getStaffAttendanceForMonth(schoolId, startDate, endDate);
        const summary: Record<string, MonthlySummary> = {};

        staff.forEach(member => {
            summary[member.id] = { present: 0, absent: 0, late: 0 };
        });

        records.forEach(record => {
            Object.entries(record.statuses).forEach(([staffId, status]) => {
                if (summary[staffId] && summary[staffId][status] !== undefined) {
                    summary[staffId][status]++;
                }
            });
        });
        setMonthlyAttendance(summary);
    } catch (error: any) {
        toast({ title: "Error fetching monthly summary", description: error.message, variant: "destructive" });
    } finally {
        setIsLoadingMonthly(false);
    }
  }, [schoolId, staff, toast, summaryFilterType, summaryMonth, summaryCustomStart, summaryCustomEnd]);


  React.useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);
  
  React.useEffect(() => {
      fetchFinancialsData();
  }, [fetchFinancialsData]);

  React.useEffect(() => {
    fetchMonthlyAttendanceSummary();
  }, [fetchMonthlyAttendanceSummary]);

  // Effect to fetch attendance when date or staff list changes
  React.useEffect(() => {
    async function fetchAttendance() {
      if (!schoolId || !date || staff.length === 0) return;
      setIsLoadingAttendance(true);
      try {
        const record = await getStaffAttendanceForDate(schoolId, date);
        const newAttendance: Record<string, StaffAttendanceStatus> = {};
        staff.forEach(member => {
            newAttendance[member.id] = record?.statuses[member.id] || 'present';
        });
        setAttendance(newAttendance);
      } catch (error: any) {
        toast({ title: "Error fetching attendance", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingAttendance(false);
      }
    }
    fetchAttendance();
  }, [date, staff, schoolId, toast]);

  const handleAttendanceChange = (staffId: string, status: StaffAttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [staffId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!schoolId || !date) return;
    setIsSubmittingAttendance(true);
    try {
      await addStaffAttendanceRecord({ schoolId, date, statuses: attendance });
      toast({ title: "Success", description: `Attendance for ${format(date, "PPP")} has been saved.` });
    } catch (error: any) {
      toast({ title: "Error saving attendance", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingAttendance(false);
    }
  };
  
  const handleOpenPaySalary = (recordId: string) => {
    const record = financials.find(f => f.id === recordId);
    if(record) {
      setSelectedFinancialRecord(record);
      setPayAmount(record.netSalary.toString());
      setAdvanceAmount('0');
      setIsPaySalaryOpen(true);
    }
  };
  
  const handleSubmitPayment = async () => {
      if (!selectedFinancialRecord || !schoolId) return;
      setIsSubmittingPayment(true);
      try {
          const updateData: TeacherFinancialUpdateInput = {
              status: 'Paid',
              advance: parseCurrency(advanceAmount),
              paidAmount: parseCurrency(payAmount),
          };
          await updateTeacherFinancialRecord(selectedFinancialRecord.id, schoolId, updateData);
          toast({ title: "Payment Recorded", description: `Salary for ${selectedFinancialRecord.teacherName} has been marked as paid.`});
          setIsPaySalaryOpen(false);
          fetchFinancialsData(); // Refresh data
      } catch(error: any) {
          toast({ title: "Payment Error", description: error.message, variant: "destructive" });
      } finally {
          setIsSubmittingPayment(false);
      }
  };
  

  const filteredStaff = staff.filter(member => 
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const combinedFinancialData = React.useMemo(() => {
    return staff.map(member => {
        const financialRecord = financials.find(f => f.teacherId === member.appId);
        return {
            ...member,
            financials: financialRecord || null
        }
    }).filter(member => 
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, financials, searchTerm]);
  
  const totals = React.useMemo(() => {
    return combinedFinancialData.reduce((acc, member) => {
        if (member.financials) {
            acc.mushahar += member.financials.baseSalary;
            acc.horumarin += member.financials.advance;
            acc.nusasaac += member.financials.deductions;
            acc.cashuur += 0; // Placeholder for tax
            acc.net += member.financials.netSalary;
        }
        return acc;
    }, { mushahar: 0, horumarin: 0, nusasaac: 0, cashuur: 0, net: 0});
  }, [combinedFinancialData]);

  const MotionCard = motion(Card);
  const MotionTabsContent = motion(TabsContent);

  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };
  
  const paymentAmountNum = parseCurrency(payAmount);
  const advanceAmountNum = parseCurrency(advanceAmount);
  const totalSalary = selectedFinancialRecord?.netSalary || 0;
  const remainingBalance = totalSalary - paymentAmountNum - advanceAmountNum;


  return (
    <div className="space-y-6">
      <PageTitle title="Shaqaalaha Dugsiga (School Staff)" description="Manage attendance, monthly performance, and salaries for all staff members." />

      <MotionCard initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Staff Overview</CardTitle>
              <CardDescription>Total Staff Members: {staff.length}</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button className="w-full md:w-auto" onClick={() => router.push('/teachers/add-teacher')}>
                <UserPlus className="mr-2 h-4 w-4"/> Add New Staff
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full md:w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
        </CardHeader>
        <CardContent className="p-4">
            <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14">
                    <TabsTrigger value="attendance" className="text-base gap-2"><CheckSquare className="h-5 w-5"/>Attendance</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-base gap-2"><BarChart className="h-5 w-5"/>Monthly Summary</TabsTrigger>
                    <TabsTrigger value="salary" className="text-base gap-2"><Wallet className="h-5 w-5"/>Salary</TabsTrigger>
                </TabsList>
                
                <AnimatePresence mode="wait">
                  <MotionTabsContent key="attendance" value="attendance" variants={tabContentVariants} initial="hidden" animate="visible" exit="hidden" className="pt-4">
                    {isLoading || isLoadingAttendance ? (
                      <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow><TableHead>No</TableHead><TableHead>Staff Member</TableHead><TableHead>Role</TableHead><TableHead className="text-center">Status</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaff.map((member, index) => (
                                    <TableRow key={member.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium">{member.fullName}</TableCell>
                                        <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                {(['present', 'absent', 'late'] as StaffAttendanceStatus[]).map(status => {
                                                    const isActive = attendance[member.id] === status;
                                                    const Icon = status === 'present' ? Check : status === 'absent' ? X : Clock;
                                                    const colorClass = status === 'present' ? 'green' : status === 'absent' ? 'red' : 'yellow';
                                                    return (
                                                        <motion.button key={status} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleAttendanceChange(member.id, status)} disabled={isSubmittingAttendance} className={cn("relative h-10 w-10 rounded-full border-2 transition-all flex items-center justify-center", isActive ? `bg-${colorClass}-500 border-${colorClass}-600 text-white` : 'bg-muted border-transparent hover:border-muted-foreground/50')}>
                                                            <Icon className={cn("h-5 w-5", !isActive && `text-${colorClass}-500`)} />
                                                        </motion.button>
                                                    )
                                                })}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4} className="text-right">
                                        <Button onClick={handleSaveAttendance} disabled={isSubmittingAttendance || filteredStaff.length === 0}>
                                            {isSubmittingAttendance ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                            Save Attendance
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                      </div>
                    )}
                  </MotionTabsContent>
                  <MotionTabsContent key="monthly" value="monthly" variants={tabContentVariants} initial="hidden" animate="visible" exit="hidden" className="pt-4">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex-1 space-y-2">
                            <Label>Filter Type</Label>
                            <Select value={summaryFilterType} onValueChange={(v) => setSummaryFilterType(v as any)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {summaryFilterType === 'monthly' ? (
                            <div className="flex-1 space-y-2">
                                <Label>Select Month</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(summaryMonth, "MMMM yyyy")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={summaryMonth} onSelect={(d) => d && setSummaryMonth(d)} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 space-y-2">
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !summaryCustomStart && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {summaryCustomStart ? format(summaryCustomStart, "PPP") : <span>Pick start date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={summaryCustomStart} onSelect={setSummaryCustomStart} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !summaryCustomEnd && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {summaryCustomEnd ? format(summaryCustomEnd, "PPP") : <span>Pick end date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={summaryCustomEnd} onSelect={setSummaryCustomEnd} disabled={(d) => d < (summaryCustomStart || new Date(0))}/>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </>
                        )}
                    </div>
                    {isLoadingMonthly ? (
                      <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow><TableHead>No</TableHead><TableHead>Staff Member</TableHead><TableHead>Role</TableHead><TableHead className="text-center">Present</TableHead><TableHead className="text-center">Absent</TableHead><TableHead className="text-center">Late</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStaff.map((member, index) => {
                              const summary = monthlyAttendance[member.id] || { present: 0, absent: 0, late: 0 };
                              return (
                                <TableRow key={member.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell className="font-medium">{member.fullName}</TableCell>
                                  <TableCell><Badge variant="outline">{member.role}</Badge></TableCell>
                                  <TableCell className="text-center font-semibold text-green-600">{summary.present}</TableCell>
                                  <TableCell className="text-center font-semibold text-red-600">{summary.absent}</TableCell>
                                  <TableCell className="text-center font-semibold text-yellow-600">{summary.late}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </MotionTabsContent>
                  <MotionTabsContent key="salary" value="salary" variants={tabContentVariants} initial="hidden" animate="visible" exit="hidden" className="pt-4">
                    {isLoadingFinancials ? (
                      <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow><TableHead>No</TableHead><TableHead>Staff Member</TableHead><TableHead>Role</TableHead><TableHead>Salary</TableHead><TableHead>Advance</TableHead><TableHead>Deductions</TableHead><TableHead>Tax</TableHead><TableHead>Net Salary</TableHead><TableHead className="text-center">Actions</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {combinedFinancialData.map((member, index) => (
                              <TableRow key={member.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{member.fullName}</TableCell>
                                <TableCell><Badge variant="outline">{member.role}</Badge></TableCell>
                                <TableCell>{formatCurrency(member.financials?.baseSalary || 0)}</TableCell>
                                <TableCell>{formatCurrency(member.financials?.advance || 0)}</TableCell>
                                <TableCell>{formatCurrency(member.financials?.deductions || 0)}</TableCell>
                                <TableCell>{formatCurrency(0)}</TableCell>
                                <TableCell className="font-semibold">{formatCurrency(member.financials?.netSalary || 0)}</TableCell>
                                <TableCell className="text-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={!member.financials || member.financials.status === 'Paid'}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleOpenPaySalary(member.financials!.id)} disabled={!member.financials || member.financials.status === 'Paid'}>
                                                <Wallet className="mr-2 h-4 w-4" /> Pay Salary
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow className="font-bold bg-muted/50"><TableCell colSpan={3} className="text-right">Totals</TableCell><TableCell>{formatCurrency(totals.mushahar)}</TableCell><TableCell>{formatCurrency(totals.horumarin)}</TableCell><TableCell>{formatCurrency(totals.nusasaac)}</TableCell><TableCell>{formatCurrency(totals.cashuur)}</TableCell><TableCell>{formatCurrency(totals.net)}</TableCell><TableCell></TableCell></TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}
                  </MotionTabsContent>
                </AnimatePresence>
            </Tabs>
        </CardContent>
      </MotionCard>
      
      {/* Pay Salary Dialog */}
      <Dialog open={isPaySalaryOpen} onOpenChange={setIsPaySalaryOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Pay Salary: {selectedFinancialRecord?.teacherName}</DialogTitle>
                  <DialogDescription>Record salary payment for {selectedFinancialRecord?.month}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                      <Label>Total Salary for Month</Label>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(totalSalary)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="payAmount">Amount to Pay</Label>
                          <Input id="payAmount" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} disabled={isSubmittingPayment}/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="advanceAmount">Advance Payment</Label>
                          <Input id="advanceAmount" type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} disabled={isSubmittingPayment}/>
                      </div>
                  </div>
                   <div className={cn("p-3 rounded-lg text-center", remainingBalance < 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40')}>
                      <Label>Remaining Balance</Label>
                      <p className={cn("text-2xl font-bold", remainingBalance < 0 ? 'text-red-600' : 'text-green-700')}>{formatCurrency(remainingBalance)}</p>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="outline" disabled={isSubmittingPayment}>Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSubmitPayment} disabled={isSubmittingPayment}>
                      {isSubmittingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wallet className="mr-2 h-4 w-4"/>} Confirm Payment
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
