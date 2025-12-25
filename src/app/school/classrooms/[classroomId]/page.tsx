
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getClassroomById, type ClientSafeClassroomData } from '@/services/classroomService';
import { getStudents, deleteStudent, type ClientSafeStudentData } from '@/services/studentService';
import { getAttendanceForDate, addAttendanceRecord, type AttendanceData, type AttendanceStatus } from '@/services/attendanceService';
import { getExamResultsForClassroom, type ClientSafeExamResultData } from '@/services/examService';
import { Loader2, ChevronLeft, UserPlus, Edit, Trash2, FileText, FileUp, MoreHorizontal, BookOpen, CheckSquare, AlertOctagon, Calendar, PlusCircle, Check, X, Info, Save, BookUser } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const globalExamSubjects = ['REL', 'ARB', 'SOMALI', 'ENG', 'MATH\'S', 'BIO', 'CHEM', 'PHYS', 'GEO', 'HIS'];
const examTypeOptions = ['Monthly Exam 1', 'Mid-Exam', 'Monthly Exam 2', 'Final Exam'];

interface StudentExamScores extends ClientSafeStudentData {
  scores: Record<string, number | '-'>;
  total: number;
}

const ExamsTabContent = dynamic(() => import('@/components/shared/ExamsTabContent').then(mod => mod.ExamsTabContent), {
  loading: () => <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
});

const AttendanceTabContent = dynamic(() => import('@/components/shared/AttendanceTabContent').then(mod => mod.AttendanceTabContent), {
  loading: () => <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
});

const CasesTabContent = dynamic(() => import('@/components/shared/CasesTabContent').then(mod => mod.CasesTabContent), {
  loading: () => <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
});


export default function ClassroomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const classroomId = params.classroomId as string;
  const schoolId = currentUser?.schoolId;

  const [classroom, setClassroom] = React.useState<ClientSafeClassroomData | null>(null);
  const [students, setStudents] = React.useState<ClientSafeStudentData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const fetchClassroomData = React.useCallback(async () => {
    if (!classroomId || !schoolId) {
      if (!isAuthLoading) toast({ title: "Error", description: "Context is missing.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [classroomData, allStudents] = await Promise.all([
        getClassroomById(classroomId, schoolId),
        getStudents(schoolId)
      ]);
      
      if (classroomData) {
        setClassroom(classroomData);
        const studentsInClass = allStudents.filter(s => s.gradeApplyingFor === classroomData.name);
        setStudents(studentsInClass);
      } else {
        toast({ title: "Not Found", description: "Classroom could not be found.", variant: "destructive" });
        router.push('/school/classrooms');
      }

    } catch (error: any) {
      toast({ title: "Error", description: `Failed to load data: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [classroomId, schoolId, toast, isAuthLoading, router]);

  React.useEffect(() => {
    fetchClassroomData();
  }, [fetchClassroomData]);


  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Classroom Details...</p>
      </div>
    );
  }

  if (!classroom) {
    return (
       <div className="text-center py-10">
        <p className="text-muted-foreground">Could not load classroom details.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4 h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all group">
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Classrooms
        </Button>
       </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Manage Classroom: <span className="text-primary">{classroom.name}</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2">
                Teacher: {classroom.teacher} | Academic Year: {classroom.academicYear}
            </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all group absolute right-0 top-0 m-6">
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Button>
      </div>

      <Tabs defaultValue="imtixaan" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="imtixaan" className="text-base gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md"><BookUser className="h-5 w-5"/>Imtixaan (Exams)</TabsTrigger>
          <TabsTrigger value="xaadiris" className="text-base gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md"><CheckSquare className="h-5 w-5"/>Xaadiris (Attendance)</TabsTrigger>
          <TabsTrigger value="kiisas" className="text-base gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md"><AlertOctagon className="h-5 w-5"/>Kiisas (Cases)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="imtixaan">
            <ExamsTabContent 
              classroom={classroom} 
              students={students} 
              schoolId={schoolId!} 
              currentUser={currentUser} 
              fetchClassroomData={fetchClassroomData} 
            />
        </TabsContent>

        <TabsContent value="xaadiris">
             <AttendanceTabContent 
               classroom={classroom}
               students={students}
               schoolId={schoolId!}
               currentUser={currentUser}
             />
        </TabsContent>
        
        <TabsContent value="kiisas">
           <CasesTabContent />
        </TabsContent>
      </Tabs>
      
    </div>
  );
}
