
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { getExamResultsForClassroom, type ClientSafeExamResultData } from '@/services/examService';
import { deleteStudent } from '@/services/studentService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, FileUp, FileText, MoreHorizontal, UserPlus, Edit, Trash2 } from 'lucide-react';
import type { ClientSafeClassroomData } from '@/services/classroomService';
import type { ClientSafeStudentData } from '@/services/studentService';
import type { ClientSafeUserData } from '@/contexts/AuthContext';


const globalExamSubjects = ['REL', 'ARB', 'SOMALI', 'ENG', 'MATH\'S', 'BIO', 'CHEM', 'PHYS', 'GEO', 'HIS'];
const examTypeOptions = ['Monthly Exam 1', 'Mid-Exam', 'Monthly Exam 2', 'Final Exam', 'Yearly Exam Total'];

interface StudentExamScores extends ClientSafeStudentData {
  scores: Record<string, number | '-'>;
  total: number;
}

interface ExamsTabContentProps {
  classroom: ClientSafeClassroomData;
  students: ClientSafeStudentData[];
  schoolId: string;
  currentUser: ClientSafeUserData | null;
  fetchClassroomData: () => void;
}

export function ExamsTabContent({ classroom, students, schoolId, currentUser, fetchClassroomData }: ExamsTabContentProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedExamType, setSelectedExamType] = React.useState<string>(examTypeOptions[0]);
  const [selectedAcademicYear, setSelectedAcademicYear] = React.useState<string>(classroom.academicYear);
  const [examResults, setExamResults] = React.useState<StudentExamScores[]>([]);
  const [isLoadingExams, setIsLoadingExams] = React.useState(false);
  const [studentToDelete, setStudentToDelete] = React.useState<ClientSafeStudentData | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    async function fetchExamData() {
        if (!classroom || students.length === 0) {
            setExamResults([]);
            return;
        }

        setIsLoadingExams(true);
        try {
            let finalStudentScores: StudentExamScores[] = [];

            if (selectedExamType === 'Yearly Exam Total') {
                const allResultsForYear = await getExamResultsForClassroom(classroom.name, schoolId, selectedAcademicYear);
                
                finalStudentScores = students.map(student => {
                    const studentResults = allResultsForYear.filter(res => res.studentId === student.studentAppId);
                    const scores: Record<string, number | '-'> = {};
                    let grandTotal = 0;

                    globalExamSubjects.forEach(subject => {
                        let subjectTotal = 0;
                        studentResults.forEach(result => {
                            const foundScore = result.subjects.find(s => s.subjectName.toUpperCase() === subject.toUpperCase());
                            if(foundScore) {
                                subjectTotal += foundScore.score;
                            }
                        });
                        scores[subject] = subjectTotal > 0 ? subjectTotal : '-';
                        grandTotal += subjectTotal;
                    });

                    return { ...student, scores, total: grandTotal };
                });

            } else {
                const resultsData = await getExamResultsForClassroom(classroom.name, schoolId, selectedAcademicYear, selectedExamType);
                
                finalStudentScores = students.map(student => {
                    const studentResult = resultsData.find(res => res.studentId === student.studentAppId);
                    const scores: Record<string, number | '-'> = {};
                    let total = 0;
                    
                    globalExamSubjects.forEach(subject => {
                        const foundScore = studentResult?.subjects.find(s => s.subjectName.toUpperCase() === subject.toUpperCase());
                        if (foundScore) {
                            scores[subject] = foundScore.score;
                            total += foundScore.score;
                        } else {
                            scores[subject] = '-';
                        }
                    });

                    return { ...student, scores, total };
                });
            }
            
            setExamResults(finalStudentScores);
        } catch (error: any) {
            toast({ title: "Error fetching exam results", description: error.message, variant: "destructive" });
        } finally {
            setIsLoadingExams(false);
        }
    }
    fetchExamData();
  }, [classroom, students, selectedExamType, selectedAcademicYear, schoolId, toast]);

  const handlePrintAllReports = () => {
    router.push(`/exams/print-all/${classroom.id}?year=${selectedAcademicYear}&type=all-exams`);
  };

  const handleRemoveStudent = async () => {
    if (!studentToDelete || !schoolId) return;
    setIsDeleting(true);
    try {
        await deleteStudent(studentToDelete.id, schoolId);
        toast({ title: "Success", description: `Student "${studentToDelete.fullName}" has been removed.` });
        setStudentToDelete(null);
        fetchClassroomData(); 
    } catch (error: any) {
        toast({ title: "Error", description: `Failed to remove student: ${error.message}`, variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };

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
              <CardTitle>Results for {classroom.name}</CardTitle>
              <CardDescription>View scores for all students in this class. Total: {students.length}</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
               <Button asChild variant="outline"><Link href={`/exams/enter-results?classroomId=${classroom.id}`}><FileUp className="mr-2 h-4 w-4"/>Enter/Edit Results</Link></Button>
               <Button onClick={handlePrintAllReports}><FileText className="mr-2 h-4 w-4"/>Print All Reports</Button>
            </div>
          </div>
           <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className='flex-1'>
                  <label className="text-sm font-medium mb-1 block">Academic Year</label>
                  <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger><SelectValue placeholder="Select an academic year" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                  </SelectContent>
                  </Select>
              </div>
              <div className='flex-1'>
                  <label className="text-sm font-medium mb-1 block">Exam Type</label>
                  <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                  <SelectTrigger><SelectValue placeholder="Select an exam to view results" /></SelectTrigger>
                  <SelectContent>
                      {examTypeOptions.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
              </div>
           </div>
        </CardHeader>
        <CardContent>
          {isLoadingExams ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
          ) : examResults.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="sticky left-0 bg-muted/50 z-10">Student Name</TableHead>
                    {globalExamSubjects.map(subject => <TableHead key={subject} className="text-center">{subject}</TableHead>)}
                    <TableHead className="text-center font-bold">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examResults.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10 whitespace-nowrap">{student.fullName}</TableCell>
                      {globalExamSubjects.map(subject => <TableCell key={subject} className="text-center">{student.scores[subject]}</TableCell>)}
                      <TableCell className="text-center font-bold text-primary">{student.total}</TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => router.push(`/students/edit/${student.id}`)}><Edit className="mr-2 h-4 w-4"/> Manage Student</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setStudentToDelete(student)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No exam results found for "{selectedExamType}" in {selectedAcademicYear}.</p>
               <Button asChild><Link href={`/exams/enter-results?classroomId=${classroom.id}&examType=${selectedExamType}&academicYear=${selectedAcademicYear}`}><UserPlus className="mr-2 h-4 w-4"/>Enter Results</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to remove this student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete <strong>{studentToDelete?.fullName}</strong> and all their associated data, including their user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveStudent} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
