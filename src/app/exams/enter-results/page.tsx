

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter as DialogModalFooter } from "@/components/ui/dialog";
import { Loader2, Save, BookOpen, AlertTriangle, School, UserPlus, FileUp, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getClassrooms, type ClientSafeClassroomData as ClassroomInfo } from '@/services/classroomService';
import { getStudents, type ClientSafeStudentData } from '@/services/studentService';
import { addExamResult, type NewExamResultInput, getExamResultsForClassroom } from '@/services/examService';
import { useAuth } from '@/contexts/AuthContext';
import { getTeachers, type ClientSafeTeacherData } from '@/services/teacherService';
import Papa from 'papaparse';


const globalExamSubjects = ['REL', 'ARB', 'SOMALI', 'ENG', 'MATH\'S', 'BIO', 'CHEM', 'PHYS', 'GEO', 'HIS'];
const examTypeOptions = ['Monthly Exam 1', 'Mid-Exam', 'Monthly Exam 2', 'Final Exam', 'Yearly Exam Total'];

const subjectAliases: Record<string, string> = {
  TARBIYA: 'REL',
  ARABIC: 'ARB',
  ENGLISH: 'ENG',
  MATHEMATICS: 'MATH\'S',
  BIOLOGY: 'BIO',
  CHEMISTRY: 'CHEM',
  PHYSICS: 'PHYS',
  GEOGRAPHY: 'GEO',
  HISTORY: 'HIS',
};

type StudentScores = Record<string, string | number>; // { [subject: string]: score }
type AllStudentScores = Record<string, StudentScores>; // { [studentId: string]: StudentScores }

export default function EnterExamResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  const [availableClassrooms, setAvailableClassrooms] = React.useState<ClassroomInfo[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = React.useState<string | null>(searchParams.get('classroomId') || null);
  
  const [studentsForClass, setStudentsForClass] = React.useState<ClientSafeStudentData[]>([]);
  const [selectedExamType, setSelectedExamType] = React.useState<string>(searchParams.get('examType') || '');
  const [selectedAcademicYear, setSelectedAcademicYear] = React.useState<string>(searchParams.get('academicYear') || "2024-2025");
  
  const [allScores, setAllScores] = React.useState<AllStudentScores>({});

  const [isLoadingPageData, setIsLoadingPageData] = React.useState(true);
  const [isSavingExam, setIsSavingExam] = React.useState(false);
  const [actionableExamSubjects, setActionableExamSubjects] = React.useState<string[]>(globalExamSubjects);
  const [teacherAccessError, setTeacherAccessError] = React.useState<string | null>(null);
  
  const [isReadOnly, setIsReadOnly] = React.useState(false);

  // State for import dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isProcessingImport, setIsProcessingImport] = React.useState(false);


  const currentSchoolId = currentUser?.schoolId;

  // Fetch all classrooms on initial load
  React.useEffect(() => {
    async function fetchPagePrerequisites() {
      if (!currentSchoolId) {
        if (!isAuthLoading) toast({ title: "Error", description: "School context is missing.", variant: "destructive" });
        setIsLoadingPageData(false);
        return;
      }

      setIsLoadingPageData(true);
      try {
        const fetchedClassrooms = await getClassrooms(currentSchoolId);
        setAvailableClassrooms(fetchedClassrooms);
      } catch (error) {
        toast({ title: "Error loading classrooms", description: "Could not load classroom list.", variant: "destructive" });
      } finally {
        setIsLoadingPageData(false);
      }
    }
    if (!isAuthLoading) { 
        fetchPagePrerequisites();
    }
  }, [currentSchoolId, toast, isAuthLoading]);
  
  // Fetch students for the selected class
  React.useEffect(() => {
    async function fetchStudentsForClass() {
        if (!selectedClassroomId || !currentSchoolId) {
            setStudentsForClass([]);
            return;
        }
        setIsLoadingPageData(true);
        try {
            const allStudents = await getStudents(currentSchoolId);
            const selectedClassroom = availableClassrooms.find(c => c.id === selectedClassroomId);
            const filteredStudents = allStudents.filter(student => student.gradeApplyingFor === selectedClassroom?.name);
            setStudentsForClass(filteredStudents);

            // Reset scores when class changes
            const initialScores: AllStudentScores = {};
            filteredStudents.forEach(student => {
                initialScores[student.id] = actionableExamSubjects.reduce((acc, subject) => {
                    acc[subject] = '';
                    return acc;
                }, {} as StudentScores);
            });
            setAllScores(initialScores);

        } catch (error) {
            toast({ title: "Error loading students", description: "Could not load student details for the selected class.", variant: "destructive" });
        } finally {
            setIsLoadingPageData(false);
        }
    }
    fetchStudentsForClass();
  }, [selectedClassroomId, currentSchoolId, toast, availableClassrooms, actionableExamSubjects]);


  // Teacher-specific subject access logic
  React.useEffect(() => {
    if (isAuthLoading || !currentSchoolId) return; 

    async function configureSubjectsForTeacher() {
      if (currentUser && currentUser.role === 'teacher') {
        try {
          if (!currentSchoolId) return;
          const teachers = await getTeachers(currentSchoolId);
          let teacherDetail: ClientSafeTeacherData | undefined;
          
          if (currentUser.appId) teacherDetail = teachers.find(t => t.appId === currentUser.appId);
          if (!teacherDetail && currentUser.email) teacherDetail = teachers.find(t => t.email && t.email.toLowerCase().trim() === currentUser.email?.toLowerCase().trim());
          if (!teacherDetail && currentUser.name) teacherDetail = teachers.find(t => t.fullName && t.fullName.trim() === currentUser.name?.trim());
          
          if (teacherDetail) {
            const taughtSubjectsRaw = teacherDetail.subjectsTaught.split(',').map(s => s.trim().toUpperCase());
            const normalizedTaughtSubjects = taughtSubjectsRaw.map(s => subjectAliases[s] || s);

            const allowedSubjects = globalExamSubjects.filter(globalSub => 
              normalizedTaughtSubjects.includes(globalSub.toUpperCase())
            );
            
            setActionableExamSubjects(allowedSubjects.length > 0 ? allowedSubjects : []);
            if (allowedSubjects.length === 0) {
               setTeacherAccessError("You are not assigned any subjects valid for exam entry.");
            } else {
               setTeacherAccessError(null);
            }
          } else {
            setActionableExamSubjects([]);
            setTeacherAccessError("Could not find your teacher details. Contact admin.");
          }
        } catch (error) {
          setActionableExamSubjects([]);
          setTeacherAccessError("Error verifying your teaching subjects.");
        }
      } else if (currentUser?.role === 'admin') {
        setActionableExamSubjects(globalExamSubjects); 
        setTeacherAccessError(null);
      }
    }
    configureSubjectsForTeacher();
  }, [currentUser, isAuthLoading, toast, currentSchoolId]);

  // Fetch existing exam results for the whole class
  React.useEffect(() => {
    async function checkForExistingExamData() {
        if (!selectedClassroomId || !selectedAcademicYear || !selectedExamType || !currentSchoolId) {
            setIsReadOnly(false); 
            setAllScores({});
            return;
        }
        
        const classroom = availableClassrooms.find(c => c.id === selectedClassroomId);
        if(!classroom) return;

        setIsLoadingPageData(true);
        try {
            const results = await getExamResultsForClassroom(classroom.name, currentSchoolId, selectedAcademicYear, selectedExamType);
            const initialScores: AllStudentScores = {};

            studentsForClass.forEach(student => {
                const studentResult = results.find(r => r.studentId === student.studentAppId);
                const studentScores: StudentScores = {};

                globalExamSubjects.forEach(subject => {
                    studentScores[subject.toUpperCase()] = '';
                });

                if (studentResult) {
                    studentResult.subjects.forEach(subjectScore => {
                        const subjectKey = subjectScore.subjectName.toUpperCase();
                        studentScores[subjectKey] = subjectScore.score;
                    });
                }
                initialScores[student.id] = studentScores;
            });
            
            if (results.length > 0 && currentUser?.role !== 'admin') {
                setIsReadOnly(true);
                toast({ title: "Results Found", description: "Existing results are loaded but locked. Contact admin for changes.", variant: "default" });
            } else if (results.length > 0 && currentUser?.role === 'admin') {
                setIsReadOnly(false);
                toast({ title: "Existing Records Loaded", description: "You are in edit mode as an administrator.", variant: "default" });
            } else {
                setIsReadOnly(false);
            }
            
            setAllScores(initialScores);

        } catch(error: any) {
            toast({ title: "Error fetching existing results", description: error.message, variant: "destructive" });
            setAllScores({});
        } finally {
            setIsLoadingPageData(false);
        }
    }

    if (studentsForClass.length > 0) {
        checkForExistingExamData();
    } else if (selectedClassroomId) {
        setIsLoadingPageData(true);
    } else {
        setIsLoadingPageData(false);
    }
  }, [selectedClassroomId, selectedAcademicYear, selectedExamType, currentSchoolId, currentUser?.role, toast, studentsForClass, availableClassrooms]);


  const handleScoreChange = (studentId: string, subject: string, value: string) => {
    setAllScores(prev => ({
        ...prev,
        [studentId]: {
            ...prev[studentId],
            [subject]: value
        }
    }));
  };

  const handleSaveAllResults = async () => {
    if (isReadOnly) {
        toast({ title: "Action Blocked", description: "This exam record is locked.", variant: "destructive" });
        return;
    }

    const classroom = availableClassrooms.find(c => c.id === selectedClassroomId);
    if (!selectedExamType || !selectedClassroomId || !classroom || !currentSchoolId) {
      toast({ title: "Missing Details", description: "Please select Classroom, Exam Type, and ensure School context is correct.", variant: "destructive" });
      return;
    }
    if (teacherAccessError) {
        toast({ title: "Access Denied", description: teacherAccessError, variant: "destructive" });
        return;
    }

    setIsSavingExam(true);
    let successCount = 0;
    let errorCount = 0;

    for (const student of studentsForClass) {
        const studentScores = allScores[student.id];
        const scoresToSaveForUserRole: StudentScores = {};
        Object.entries(studentScores).forEach(([subject, score]) => {
            if(actionableExamSubjects.includes(subject.toUpperCase())) {
                scoresToSaveForUserRole[subject] = score;
            }
        });
        
        const hasScoresToSave = Object.values(scoresToSaveForUserRole).some(score => String(score).trim() !== '');

        if (!hasScoresToSave) continue;

        const examInput: NewExamResultInput = {
          studentId: student.studentAppId,
          studentName: student.fullName,
          classroomId: selectedClassroomId,
          classroomName: classroom.name,
          academicYear: selectedAcademicYear,
          examType: selectedExamType,
          scores: scoresToSaveForUserRole,
          schoolId: currentSchoolId,
        };
        
        try {
          await addExamResult(examInput); 
          successCount++;
        } catch (error: any) {
          console.error(`Failed to save results for ${student.fullName}:`, error.message);
          errorCount++;
        }
    }

    setIsSavingExam(false);
    toast({
        title: "Save Complete",
        description: `Successfully saved ${successCount} student results. Failed to save ${errorCount} results.`,
    });
  };

  const handleDownloadExamSample = () => {
    if (studentsForClass.length === 0) {
      toast({ title: "No Students", description: "There are no students in this class to create a sample for." });
      return;
    }
    const headers = ["studentAppId", "fullName", ...actionableExamSubjects];
    const sampleData = studentsForClass.map(student => {
      const row: (string | undefined)[] = [student.studentAppId, student.fullName];
      actionableExamSubjects.forEach(() => row.push(""));
      return row.join(',');
    });
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const classroomName = availableClassrooms.find(c => c.id === selectedClassroomId)?.name || 'class';

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `exam_import_sample_${classroomName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleProcessExamImport = async (data: any[]) => {
    if (!currentSchoolId || !selectedClassroomId) {
        toast({ title: "Missing Information", description: "Please ensure a classroom is selected.", variant: "destructive" });
        return;
    }
    if (!selectedExamType || !selectedAcademicYear) {
        toast({ title: "Missing Details", description: "Please select an Academic Year and Exam Type for the import.", variant: "destructive" });
        return;
    }

    setIsProcessingImport(true);
    let successCount = 0;
    let errorCount = 0;
    const classroomName = availableClassrooms.find(c => c.id === selectedClassroomId)?.name || 'Unknown';

    const normalizedSubjectAliases: Record<string, string> = {};
    for (const key in subjectAliases) {
        normalizedSubjectAliases[key.toUpperCase()] = subjectAliases[key].toUpperCase();
    }
    const normalizedGlobalSubjects = globalExamSubjects.map(s => s.toUpperCase());

    for (const row of data) {
        try {
            if (!row.studentAppId || !row.fullName) {
                console.warn("Skipping row with missing student ID or name:", row);
                errorCount++;
                continue;
            }

            const scores: Record<string, string | number> = {};
            for (const header in row) {
                const normalizedHeader = header.trim().toUpperCase();
                const subjectName = normalizedSubjectAliases[normalizedHeader] || normalizedHeader;
                
                if (actionableExamSubjects.map(s => s.toUpperCase()).includes(subjectName)) {
                    if (row[header] !== undefined && row[header] !== null && String(row[header]).trim() !== '') {
                        scores[subjectName] = row[header];
                    }
                }
            }

            const examInput: NewExamResultInput = {
                studentId: row.studentAppId,
                studentName: row.fullName,
                classroomId: selectedClassroomId,
                classroomName: classroomName,
                academicYear: selectedAcademicYear,
                examType: selectedExamType,
                scores: scores,
                schoolId: currentSchoolId,
            };
            
            await addExamResult(examInput);
            successCount++;

        } catch (error: any) {
            console.error("Error importing exam result for row:", row, error);
            errorCount++;
        }
    }
    
    toast({
        title: "Exam Import Complete",
        description: `Successfully imported ${successCount} exam records. Failed to import ${errorCount} records.`,
    });
    
    setIsProcessingImport(false);
    setIsImportDialogOpen(false);
    // Re-fetch exam data after import
    if (studentsForClass.length > 0 && selectedClassroomId && selectedExamType && currentSchoolId && selectedAcademicYear) {
        const results = await getExamResultsForClassroom(classroomName, currentSchoolId, selectedAcademicYear, selectedExamType);
        // Logic to update `allScores` state would go here...
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            handleProcessExamImport(results.data);
        },
        error: (error: any) => {
            toast({ title: "File Parsing Error", description: error.message, variant: "destructive" });
        }
    });
  };


  if (teacherAccessError) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PageTitle title="Access Denied" description="Problem accessing exam entry." />
        <Card className="border-destructive bg-destructive/10">
          <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Error</CardTitle></CardHeader>
          <CardContent><p className="text-destructive-foreground">{teacherAccessError}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageTitle title={`Geli Natiijada Imtixaanka (${currentUser?.schoolName || 'Dugsigaaga'})`} description="Dooro fasalka iyo imtixaanka, kadibna geli dhibcaha ardayda oo dhan." />

      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Faahfaahinta Imtixaanka</CardTitle>
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" disabled={!selectedClassroomId || !selectedExamType}>
                        <FileUp className="mr-2 h-4 w-4" /> Import Results
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Exam Results</DialogTitle>
                        <DialogDescription>
                          Upload a CSV file with student scores. Results will be saved for the currently selected Academic Year and Exam Type.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Button variant="secondary" onClick={handleDownloadExamSample} className="w-full" disabled={studentsForClass.length === 0}>
                            <FileText className="mr-2 h-4 w-4" /> Download Sample File
                        </Button>
                        <div className="space-y-2">
                            <Label htmlFor="exam-file">Excel/CSV File</Label>
                            <Input id="exam-file" type="file" accept=".csv,.xlsx" onChange={onFileChange} disabled={isProcessingImport}/>
                        </div>
                    </div>
                    <DialogModalFooter>
                        <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isProcessingImport}>Cancel</Button>
                    </DialogModalFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div>
                    <Label htmlFor="academicYearSelect" className="flex items-center mb-1"><BookOpen className="mr-2 h-4 w-4 text-muted-foreground"/>Sanad Dugsiyeedka</Label>
                    <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear} disabled={isSavingExam || isReadOnly}>
                        <SelectTrigger id="academicYearSelect"><SelectValue placeholder="Dooro Sanad Dugsiyeed" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2023-2024">2023-2024</SelectItem>
                            <SelectItem value="2024-2025">2024-2025</SelectItem>
                            <SelectItem value="2025-2026">2025-2026</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="classroomSelect" className="flex items-center mb-1"><School className="mr-2 h-4 w-4 text-muted-foreground"/>Fasalka</Label>
                    <Select value={selectedClassroomId || ''} onValueChange={setSelectedClassroomId} disabled={availableClassrooms.length === 0 || isSavingExam || isReadOnly}>
                        <SelectTrigger id="classroomSelect"><SelectValue placeholder="Dooro Fasal" /></SelectTrigger>
                        <SelectContent>
                            {availableClassrooms.map(classroom => (<SelectItem key={classroom.id} value={classroom.id}>{classroom.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="examTypeSelect" className="flex items-center mb-1"><BookOpen className="mr-2 h-4 w-4 text-muted-foreground"/>Nooca Imtixaanka</Label>
                    <Select value={selectedExamType} onValueChange={setSelectedExamType} disabled={isSavingExam || isReadOnly}>
                        <SelectTrigger id="examTypeSelect"><SelectValue placeholder="Dooro Nooca Imtixaanka" /></SelectTrigger>
                        <SelectContent>
                            {examTypeOptions.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
          {isReadOnly && (
              <div className="border-l-4 border-amber-500 bg-amber-50 text-amber-800 p-4 rounded-r-md mb-6">
                <p>Results for this exam have already been submitted. As a non-administrator, you cannot modify existing records.</p>
              </div>
            )}
          {selectedClassroomId && selectedExamType ? (
            actionableExamSubjects.length > 0 ? (
            <div className="space-y-4 overflow-x-auto">
              <CardDescription>Geli dhibcaha maadooyinka ardayda fasalka: <strong>{availableClassrooms.find(c => c.id === selectedClassroomId)?.name}</strong> ee imtixaanka: <strong>{selectedExamType}</strong></CardDescription>
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student Name</TableHead>
                        {globalExamSubjects.map(subject => <TableHead key={subject} className="text-center">{subject}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {studentsForClass.map(student => (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium whitespace-nowrap">{student.fullName}</TableCell>
                            {globalExamSubjects.map(subject => (
                                <TableCell key={subject}>
                                    <Input
                                      type="number"
                                      value={allScores[student.id]?.[subject.toUpperCase()] || ''}
                                      onChange={(e) => handleScoreChange(student.id, subject.toUpperCase(), e.target.value)}
                                      className="h-8 text-sm text-center"
                                      min="0"
                                      max="100"
                                      disabled={isSavingExam || isReadOnly || !actionableExamSubjects.includes(subject)}
                                      placeholder="0"
                                    />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
           ) : (
             <div className="text-center py-8 text-destructive-foreground bg-destructive/10 p-4 rounded-md">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-destructive" />
                <p className="font-semibold">No Subjects Available for Entry</p>
             </div>
           )
          ) : (
            <div className="text-center py-8">
              {!selectedClassroomId ? (
                <p className="text-muted-foreground">Fadlan dooro fasal iyo nooca imtixaanka si aad natiijooyinka u geliso.</p>
              ) : studentsForClass.length === 0 && selectedClassroomId ? (
                <>
                  <p className="text-muted-foreground mb-4">Fasalkan arday kuma jiraan. Fadlan marka hore arday ku dar.</p>
                  <Button asChild><Link href="/registration/new-student"><UserPlus className="mr-2 h-4 w-4" /> Ku Dar Arday Cusub</Link></Button>
                </>
              ) : (
                <p className="text-muted-foreground">Fadlan dooro nooca imtixaanka si aad u bilowdo gelinta dhibcaha.</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-6 flex justify-end">
            <Button onClick={handleSaveAllResults} disabled={isSavingExam || !selectedClassroomId || !selectedExamType || studentsForClass.length === 0 || isReadOnly} size="lg">
              {isSavingExam ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Diiwaangeli Natiijooyinka oo dhan
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
