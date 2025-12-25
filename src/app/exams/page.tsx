
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, PlusCircle, Edit, FileSpreadsheet, Search, Filter, FileText, Loader2, School, Info, AlertTriangle, Users } from "lucide-react";
import Image from "next/image";
import { getStudents, type ClientSafeStudentData as StudentServiceStudentData, getStudentByStudentAppId, getStudentsByParentDetails } from '@/services/studentService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const upcomingExams = [
  { id: "EXM001", subject: "Mathematics", grade: "Grade 5", date: "2024-08-15", time: "09:00 AM" },
  { id: "EXM002", subject: "Science", grade: "Grade 10", date: "2024-08-18", time: "10:30 AM" },
  { id: "EXM003", subject: "English Literature", grade: "Grade 12", date: "2024-08-22", time: "01:00 PM" },
];

interface DisplayStudentForExams {
  id: string;
  name: string;
  grade: string;
}

export default function ExamsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const currentSchoolId = currentUser?.schoolId;

  const [students, setStudents] = React.useState<DisplayStudentForExams[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(true); 
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterGrade, setFilterGrade] = React.useState("all");

  const [isStudentRedirecting, setIsStudentRedirecting] = React.useState(false);
  const [parentLinkedStudents, setParentLinkedStudents] = React.useState<StudentServiceStudentData[] | null>(null);
  const [isLoadingParentStudents, setIsLoadingParentStudents] = React.useState(false);
  const studentRecordsRef = React.useRef<HTMLDivElement>(null);

  const fetchStudentsDataForAdminOrTeacher = React.useCallback(async () => {
    if (!currentSchoolId) {
      if (!isAuthLoading) toast({ title: "School Context Error", description: "Cannot load students without a school context.", variant: "destructive" });
      setIsLoadingStudents(false);
      return;
    }
    setIsLoadingStudents(true);
    try {
      const fetchedStudents: StudentServiceStudentData[] = await getStudents(currentSchoolId);
      const displayStudents = fetchedStudents.map(s => ({
        id: s.id,
        name: s.fullName,
        grade: s.gradeApplyingFor,
      }));
      setStudents(displayStudents);
    } catch (error: any) {
      toast({
        title: "Error Fetching Students",
        description: error.message || "Could not load student data for exam reports.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStudents(false);
    }
  }, [toast, currentSchoolId, isAuthLoading]);

  React.useEffect(() => {
    if (isAuthLoading) return;

    if (currentUser?.role === 'student') {
      if (currentUser.studentAppId && currentUser.schoolId) {
        setIsStudentRedirecting(true);
        getStudentByStudentAppId(currentUser.studentAppId, currentUser.schoolId)
          .then(studentData => {
            if (studentData && studentData.id) {
              router.replace(`/exams/student-report/${studentData.id}`);
            } else {
              toast({ title: "Error", description: "Could not find your student record.", variant: "destructive" });
              setIsStudentRedirecting(false);
            }
          })
          .catch(error => {
            console.error("Error fetching student data for redirect:", error);
            toast({ title: "Error", description: "An error occurred loading your exam info.", variant: "destructive" });
            setIsStudentRedirecting(false);
          });
      } else {
        toast({ title: "Account Issue", description: "Student ID not linked to your account.", variant: "destructive" });
        setIsLoadingStudents(false);
      }
    } else if (currentUser?.role === 'parent') {
      setIsLoadingParentStudents(true);
      const parentIdentifier = currentUser.appId || currentUser.email;

      if (!parentIdentifier || !currentSchoolId) {
        toast({ title: "Error", description: "Parent identifier or school ID not found for your account.", variant: "destructive" });
        setIsLoadingParentStudents(false);
        setParentLinkedStudents([]);
        return;
      }

      getStudentsByParentDetails({ parentId: parentIdentifier, schoolId: currentSchoolId })
        .then(linkedStudents => {
          if (linkedStudents.length === 1) {
            router.replace(`/exams/student-report/${linkedStudents[0].id}`);
          } else {
            setParentLinkedStudents(linkedStudents);
            setIsLoadingParentStudents(false);
          }
        })
        .catch(error => {
          console.error("Error fetching students for parent:", error);
          toast({ title: "Error", description: "Could not load your child's information.", variant: "destructive" });
          setParentLinkedStudents([]);
          setIsLoadingParentStudents(false);
        });
    } else if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher')) {
      fetchStudentsDataForAdminOrTeacher();
    } else {
      setIsLoadingStudents(false);
    }
  }, [currentUser, isAuthLoading, router, toast, fetchStudentsDataForAdminOrTeacher]);


  if (isAuthLoading || isStudentRedirecting || (currentUser?.role === 'parent' && isLoadingParentStudents && !parentLinkedStudents)) {
    return (
      <div className="flex flex-col h-screen p-4 md:p-6 items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          {isAuthLoading ? "Verifying user..." : 
           isStudentRedirecting ? "Loading your exam details..." :
           "Loading your child's exam information..."}
        </p>
      </div>
    );
  }

  if (currentUser?.role === 'student') {
    return (
      <div className="space-y-6">
        <PageTitle title="My Exams" description="Your exam information." />
        <Card>
          <CardHeader><CardTitle>Access Issue</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">We could not load your exam report. This might be due to an issue with your student ID linkage. Please contact administration.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (currentUser?.role === 'parent') {
    if (parentLinkedStudents && parentLinkedStudents.length > 1) {
      return (
        <div className="space-y-6">
          <PageTitle title="Children's Exam Information" description="Select your child to view their report." />
          <Card>
            <CardHeader>
              <CardTitle>Multiple Children Found</CardTitle>
              <CardDescription>Multiple student records are linked to your account. Please select a child to view their report.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-3">
                    {parentLinkedStudents.map(student => (
                        <Button 
                            key={student.id} 
                            onClick={() => router.push(`/exams/student-report/${student.id}`)}
                            variant="outline"
                            className="justify-start h-12"
                        >
                           <Users className="mr-3 h-5 w-5 text-primary" />
                           <div>
                            <p className="font-semibold">{student.fullName}</p>
                            <p className="text-xs text-muted-foreground">Grade: {student.gradeApplyingFor}</p>
                           </div>
                        </Button>
                    ))}
                </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    if (parentLinkedStudents && parentLinkedStudents.length === 0) {
      return (
        <div className="space-y-6">
          <PageTitle title="Child's Exam Information" description="Access your child's exam results." />
          <Card>
            <CardHeader><CardTitle>No Child Linked</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No student records are currently linked to your parent account. 
              </p>
              <p className="text-muted-foreground mt-2">
                Please ensure your parent account (using email: {currentUser.email || 'N/A'} or App ID: {currentUser.appId || 'N/A'}) is correctly associated with your child's record by the school administration.
              </p>
              <Button asChild className="mt-4">
                <Link href="/">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
     return (
        <div className="flex flex-col h-screen p-4 md:p-6 items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Processing request...</p>
        </div>
    );
  }


  // Admin/Teacher View
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === "all" || student.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const uniqueGrades = ["all", ...Array.from(new Set(students.map(s => s.grade).filter(g => typeof g === 'string' && g.trim() !== '')))].sort();

  const handleViewStudentReport = (studentId: string) => {
    router.push(`/exams/student-report/${studentId}`);
  };

  const handleScrollToStudentRecords = () => {
    studentRecordsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Imtixaano (Exams)" description="Schedule exams, record grades, and generate report cards." />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Exams Schedule</CardTitle>
            <CardDescription>View and manage scheduled examinations.</CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Schedule New Exam
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingExams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>{exam.id}</TableCell>
                    <TableCell>{exam.subject}</TableCell>
                    <TableCell>{exam.grade}</TableCell>
                    <TableCell>{exam.date}</TableCell>
                    <TableCell>{exam.time}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3" /> Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No upcoming exams scheduled.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Record Grades</CardTitle>
            <CardDescription>Input and manage student grades for completed exams.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To enter grades, first navigate to the classroom list, select a specific classroom, and then use the 'Enter Exam Results' option available on the classroom's page.
            </p>
            <Button asChild className="mt-4">
              <Link href="/school/classrooms">
                <School className="mr-2 h-4 w-4" /> Go to Classrooms
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generate Report Cards</CardTitle>
            <CardDescription>Create and distribute student report cards.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To generate an individual report card, find the student in the list at the bottom of this page and click 'View Report'.
            </p>
          </CardContent>
           <CardFooter>
            <Button onClick={handleScrollToStudentRecords}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> View Student Records
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div ref={studentRecordsRef}>
        <Card>
          <CardHeader>
            <CardTitle>Student Exam Records</CardTitle>
            <CardDescription>View individual student exam performance and generate reports for {currentUser?.schoolName}.</CardDescription>
            <div className="mt-4 flex flex-col md:flex-row items-center gap-2">
              <div className="relative flex-1 w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students by name or ID..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-full md:w-[180px]">
                   <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filter by grade" />
                   </div>
                </SelectTrigger>
                <SelectContent>
                  {uniqueGrades.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade === "all" ? "All Grades" : grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading students...</p>
              </div>
            ) : !currentSchoolId ? (
               <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <p className="font-semibold text-destructive">School Context Error</p>
                <p className="text-muted-foreground text-sm">Cannot load students. Your account is not associated with a school.</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewStudentReport(student.id)}>
                          <FileText className="mr-1 h-3 w-3" /> View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <Image src="https://placehold.co/300x200.png" alt="No students found" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="empty state users" />
                <p className="text-muted-foreground">No students match your criteria, or no students registered yet for {currentUser?.schoolName}.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    