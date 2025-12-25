
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceForDate, addAttendanceRecord, type AttendanceStatus } from '@/services/attendanceService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Calendar, Check, X, Info, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ClientSafeClassroomData } from '@/services/classroomService';
import type { ClientSafeStudentData } from '@/services/studentService';
import type { ClientSafeUserData } from '@/contexts/AuthContext';

interface AttendanceTabContentProps {
  classroom: ClientSafeClassroomData;
  students: ClientSafeStudentData[];
  schoolId: string;
  currentUser: ClientSafeUserData | null;
}

export function AttendanceTabContent({ classroom, students, schoolId, currentUser }: AttendanceTabContentProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [attendance, setAttendance] = React.useState<Record<string, AttendanceStatus>>({});
  const [isAttendanceLocked, setIsAttendanceLocked] = React.useState(false);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = React.useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(true);

  React.useEffect(() => {
    const fetchAttendance = async () => {
        setIsLoadingAttendance(true);
        try {
            const existingRecord = await getAttendanceForDate(schoolId, classroom.id, selectedDate);
            const initialAttendance: Record<string, AttendanceStatus> = {};

            if (existingRecord) {
                Object.entries(existingRecord.statuses).forEach(([studentDocId, status]) => {
                    if (students.some(s => s.id === studentDocId)) {
                        initialAttendance[studentDocId] = status;
                    }
                });

                students.forEach(student => {
                    if (!initialAttendance[student.id]) {
                        initialAttendance[student.id] = 'present';
                    }
                });

                setAttendance(initialAttendance);
                if (currentUser?.role !== 'admin') {
                  setIsAttendanceLocked(true);
                  toast({ title: "Attendance Locked", description: "Attendance for this date has already been submitted." });
                } else {
                  setIsAttendanceLocked(false);
                  toast({ title: "Record Loaded", description: "Editing as administrator." });
                }
            } else {
                students.forEach(student => {
                    initialAttendance[student.id] = 'present';
                });
                setAttendance(initialAttendance);
                setIsAttendanceLocked(false);
            }
        } catch (error: any) {
            toast({ title: "Error fetching attendance", description: error.message, variant: "destructive" });
        } finally {
            setIsLoadingAttendance(false);
        }
    };
    if (students.length > 0) {
        fetchAttendance();
    } else {
      setIsLoadingAttendance(false);
    }
  }, [selectedDate, classroom.id, schoolId, toast, students, currentUser?.role]);
  
  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
      setIsSubmittingAttendance(true);
      try {
          await addAttendanceRecord({
              classroomId: classroom.id,
              schoolId,
              date: selectedDate,
              statuses: attendance,
          });
          toast({ title: "Success", description: `Attendance for ${format(selectedDate, "PPP")} has been saved.`});
          setIsAttendanceLocked(true); 
      } catch (error: any) {
          toast({ title: "Error saving attendance", description: error.message, variant: "destructive" });
      } finally {
          setIsSubmittingAttendance(false);
      }
  };

  const attendanceCounts = React.useMemo(() => {
    return Object.values(attendance).reduce((acc, status) => {
        if (acc[status] !== undefined) {
            acc[status]++;
        }
        return acc;
    }, { present: 0, absent: 0, late: 0});
  }, [attendance]);
  
  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="visible">
       <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <CardTitle>Class Attendance</CardTitle>
                  <CardDescription>Select a date to mark attendance for {classroom.name}.</CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full md:w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAttendance ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : students.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">There are no students in this class to mark attendance for.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg"><p className="text-sm font-semibold text-green-700 dark:text-green-300">Present</p><p className="text-2xl font-bold">{attendanceCounts.present}</p></div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg"><p className="text-sm font-semibold text-red-700 dark:text-red-300">Absent</p><p className="text-2xl font-bold">{attendanceCounts.absent}</p></div>
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg"><p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Late</p><p className="text-2xl font-bold">{attendanceCounts.late}</p></div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg"><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total</p><p className="text-2xl font-bold">{students.length}</p></div>
              </div>
               <Table>
                  <TableHeader><TableRow><TableHead>Student Name</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                      {students.map((student) => (
                          <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.fullName}</TableCell>
                              <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                      <Button 
                                          size="sm"
                                          variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                                          className={cn("border-green-500", attendance[student.id] === 'present' && "bg-green-600 hover:bg-green-700")}
                                          onClick={() => handleAttendanceChange(student.id, 'present')}
                                          disabled={isAttendanceLocked || isSubmittingAttendance}>
                                              <Check className="h-4 w-4 mr-1"/> Present
                                      </Button>
                                      <Button 
                                          size="sm"
                                          variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                                          className="border-red-500"
                                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                                          disabled={isAttendanceLocked || isSubmittingAttendance}>
                                              <X className="h-4 w-4 mr-1"/> Absent
                                      </Button>
                                      <Button 
                                          size="sm"
                                          variant={attendance[student.id] === 'late' ? 'secondary' : 'outline'}
                                          className={cn("border-yellow-500", attendance[student.id] === 'late' && "bg-yellow-500 text-black hover:bg-yellow-600")}
                                          onClick={() => handleAttendanceChange(student.id, 'late')}
                                          disabled={isAttendanceLocked || isSubmittingAttendance}>
                                              <Info className="h-4 w-4 mr-1"/> Late
                                      </Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
               </Table>
               <div className="flex justify-end mt-4">
                  <Button 
                    size="lg" 
                    onClick={handleSaveAttendance} 
                    disabled={isAttendanceLocked || isSubmittingAttendance || students.length === 0}
                  >
                    {isSubmittingAttendance ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Diiwaangeli Xaadiris
                  </Button>
               </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
