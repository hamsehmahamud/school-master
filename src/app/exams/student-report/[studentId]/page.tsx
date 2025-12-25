
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Printer, AlertTriangle } from 'lucide-react';
import { getStudentById, type ClientSafeStudentData } from '@/services/studentService';
import { getExamResultsForStudent, getExamResultsForClassroom, type ClientSafeExamResultData } from '@/services/examService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { StudentReportCard } from '@/components/reports/StudentReportCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";


interface StudentAnnualSummary {
  studentId: string;
  studentName: string;
  grandTotal: number;
  rank?: number;
}

const calculateStudentGrandTotal = (studentExamResults: ClientSafeExamResultData[]): number => {
    let grandTotal = 0;
    const examScoresBySubject: Record<string, Record<string, number>> = {};

    studentExamResults.forEach(result => {
        result.subjects.forEach(subjectScore => {
            const subjectKey = subjectScore.subjectName.toUpperCase();
            if (!examScoresBySubject[subjectKey]) examScoresBySubject[subjectKey] = {};
            examScoresBySubject[subjectKey][result.examType] = subjectScore.score;
        });
    });

    Object.values(examScoresBySubject).forEach(scores => {
        const term1 = (scores['Monthly Exam 1'] || 0) + (scores['Mid-Exam'] || 0);
        const term2 = (scores['Monthly Exam 2'] || 0) + (scores['Final Exam'] || 0);
        grandTotal += term1 + term2;
    });

    return grandTotal;
};

const getGrading = (percentage: number): { grade: string, remark: string } => {
    if (percentage >= 90) return { grade: 'A', remark: 'Excellent' };
    if (percentage >= 75) return { grade: 'B', remark: 'Very Good' };
    if (percentage >= 60) return { grade: 'C', remark: 'Good' };
    if (percentage >= 50) return { grade: 'D', remark: 'Acceptable' };
    return { grade: 'F', remark: 'Fail' };
};


export default function StudentExamReportPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const studentId = params.studentId as string;
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  const [student, setStudent] = React.useState<ClientSafeStudentData | null>(null);
  const [allExamResults, setAllExamResults] = React.useState<ClientSafeExamResultData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [academicYears, setAcademicYears] = React.useState<string[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = React.useState<string>("");
  const [selectedExamType, setSelectedExamType] = React.useState<string>("Yearly Exam Total");

  const [studentRank, setStudentRank] = React.useState<string>("N/A");

  const grandTotal = React.useMemo(() => {
    if (selectedExamType === 'Yearly Exam Total') {
        const resultsForYear = allExamResults.filter(r => r.academicYear === selectedAcademicYear);
        return calculateStudentGrandTotal(resultsForYear);
    }
    const selectedExamResult = allExamResults.find(r => 
        r.academicYear === selectedAcademicYear && r.examType === selectedExamType
    );
    return selectedExamResult?.totalScore ?? 0;
  }, [allExamResults, selectedAcademicYear, selectedExamType]);

  React.useEffect(() => {
    async function fetchStudentAndExamData() {
      if (!studentId || !currentUser?.schoolId) {
        if (!isAuthLoading) toast({ title: "Error", description: "Student ID or School context missing.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const fetchedStudent = await getStudentById(studentId, currentUser.schoolId);
        if (fetchedStudent) {
          setStudent(fetchedStudent);
          const fetchedExamResults = await getExamResultsForStudent(fetchedStudent.studentAppId, fetchedStudent.schoolId);
          setAllExamResults(fetchedExamResults);

          if (fetchedExamResults.length > 0) {
            const uniqueYears = [...new Set(fetchedExamResults.map(r => r.academicYear))].sort().reverse();
            setAcademicYears(uniqueYears);
            if (uniqueYears.length > 0) {
              setSelectedAcademicYear(uniqueYears[0]);
            }
          } else {
             toast({ title: "No Exam Data", description: "No exam results found for this student.", variant: "default" });
          }
        } else {
          toast({ title: "Student Not Found", description: `Student with ID ${studentId} not found in your school: ${currentUser.schoolName || 'N/A'}.`, variant: "destructive" });
          router.push('/exams');
        }
      } catch (error: any) {
        toast({ title: "Error Loading Report", description: error.message || "Could not load data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    if (!isAuthLoading) {
      fetchStudentAndExamData();
    }
  }, [studentId, toast, currentUser, isAuthLoading, router]);

  const uniqueExamTypesForYear = React.useMemo(() => {
    if (!selectedAcademicYear) return [];
    const types = new Set(
        allExamResults
            .filter(r => r.academicYear === selectedAcademicYear)
            .map(r => r.examType)
    );
    return ["Yearly Exam Total", ...Array.from(types)];
  }, [allExamResults, selectedAcademicYear]);

  const selectedExamResult = React.useMemo(() => {
    if (selectedExamType === 'Yearly Exam Total') return null;
    return allExamResults.find(r => 
        r.academicYear === selectedAcademicYear && r.examType === selectedExamType
    );
  }, [allExamResults, selectedAcademicYear, selectedExamType]);
  
  React.useEffect(() => {
      async function calculateAndSetRank() {
          if (!student || !selectedAcademicYear || !student.gradeApplyingFor || !currentUser?.schoolId) {
              setStudentRank("N/A");
              return;
          }

          setIsLoading(true);
          try {
              const allClassResults = await getExamResultsForClassroom(student.gradeApplyingFor, currentUser.schoolId, selectedAcademicYear);
              
              const studentTotals: StudentAnnualSummary[] = [];
              const resultsByStudent = allClassResults.reduce((acc, result) => {
                  (acc[result.studentId] = acc[result.studentId] || []).push(result);
                  return acc;
              }, {} as Record<string, ClientSafeExamResultData[]>);

              for (const studentAppId in resultsByStudent) {
                  studentTotals.push({
                      studentId: studentAppId,
                      studentName: resultsByStudent[studentAppId][0]?.studentName || studentAppId,
                      grandTotal: calculateStudentGrandTotal(resultsByStudent[studentAppId])
                  });
              }

              studentTotals.sort((a, b) => b.grandTotal - a.grandTotal);
              
              let currentRank = 0;
              let lastScore = -1;
              let rankCounter = 0;
              studentTotals.forEach((s) => {
                  rankCounter++;
                  if (s.grandTotal !== lastScore) {
                      currentRank = rankCounter;
                      lastScore = s.grandTotal;
                  }
                  s.rank = currentRank;
              });

              const currentStudentSummary = studentTotals.find(s => s.studentId === student.studentAppId);
              setStudentRank(currentStudentSummary?.rank ? `${currentStudentSummary.rank} of ${studentTotals.length}` : "N/A");

          } catch (error) {
              console.error("Error calculating rank:", error);
              setStudentRank("Error");
          } finally {
              setIsLoading(false);
          }
      }

      if (selectedExamType === 'Yearly Exam Total' && selectedAcademicYear) {
          calculateAndSetRank();
      } else {
          setStudentRank("N/A");
      }
  }, [student, selectedAcademicYear, selectedExamType, currentUser?.schoolId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading student report...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col h-screen p-4 md:p-6 items-center justify-center">
        <h1 className="text-2xl font-bold">Student Not Found</h1>
        <p className="text-muted-foreground">The requested student info could not be loaded.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4 h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all group">
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
       <div className="flex items-center justify-between no-print">
        <Button variant="outline" onClick={() => router.back()} className="h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all group">
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Button>
        <div className="flex-1 text-center">
            <h2 className="text-2xl font-bold">Student Academic Report</h2>
            <p className="text-muted-foreground">Report for {student.fullName} (ID: {student.studentAppId})</p>
        </div>
        <div className="w-24 flex justify-end">
            <Button variant="default" onClick={handlePrint} disabled={allExamResults.length === 0} className="bg-green-600 hover:bg-green-700 text-white">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 no-print">
        <div className="w-full sm:w-48">
            <Label htmlFor="academic-year-select" className="text-xs">Academic Year</Label>
            <Select
                value={selectedAcademicYear}
                onValueChange={(value) => {
                    setSelectedAcademicYear(value);
                    setSelectedExamType("Yearly Exam Total");
                }}
                disabled={academicYears.length === 0}
            >
                <SelectTrigger id="academic-year-select"><SelectValue placeholder="Select Year" /></SelectTrigger>
                <SelectContent>
                    {academicYears.map(year => (
                       <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="w-full sm:w-48">
             <Label htmlFor="exam-type-select" className="text-xs">Exam Type</Label>
            <Select 
                value={selectedExamType} 
                onValueChange={setSelectedExamType} 
                disabled={uniqueExamTypesForYear.length <= 1}
            >
                <SelectTrigger id="exam-type-select"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                <SelectContent>
                    {uniqueExamTypesForYear.map(type => (
                       <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {selectedExamType === 'Yearly Exam Total' ? (
        <StudentReportCard 
          student={student}
          allExamResults={allExamResults}
          selectedAcademicYear={selectedAcademicYear}
          schoolName={currentUser?.schoolName || 'Barasho Hub'}
          rank={studentRank}
          grandTotal={grandTotal}
        />
      ) : selectedExamResult ? (
          <Card>
              <CardHeader>
                  <CardTitle>{selectedExamResult.examType} Results</CardTitle>
                  <CardDescription>Detailed scores for the selected examination.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead className="text-right">Score</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {selectedExamResult.subjects.map(subject => (
                              <TableRow key={subject.subjectName}>
                                  <TableCell className="font-medium">{subject.subjectName}</TableCell>
                                  <TableCell className="text-right">{subject.score}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                      <TableFooter>
                          <TableRow>
                              <TableCell className="font-semibold">Total Score:</TableCell>
                              <TableCell className="text-right font-bold">{selectedExamResult.totalScore}</TableCell>
                          </TableRow>
                          <TableRow>
                              <TableCell className="font-semibold">Average Score:</TableCell>
                              <TableCell className="text-right font-bold">{selectedExamResult.averageScore.toFixed(2)}%</TableCell>
                          </TableRow>
                           <TableRow>
                              <TableCell className="font-semibold">Grade:</TableCell>
                              <TableCell className="text-right font-bold">{getGrading(selectedExamResult.averageScore).grade}</TableCell>
                          </TableRow>
                      </TableFooter>
                  </Table>
              </CardContent>
          </Card>
      ) : (
          <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
              <p className="font-semibold">Exam Data Not Found</p>
              <p className="text-sm">Could not find the specific exam result for your selection.</p>
          </div>
      )}
      
      <style jsx global>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 10pt;
          }
          .no-print { display: none !important; }
          .student-report-card {
            box-shadow: none !important;
            border: none !important;
            margin: 0;
            padding: 0;
          }
          .report-header {
            display: block !important; 
          }
          table {
            font-size: 9pt;
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 4px 6px !important;
            border: 1px solid #ddd;
          }
           thead {
            display: table-header-group; /* Important for repeating headers */
          }
          .bg-muted\/50 {
            background-color: #f1f5f9 !important; /* A light gray */
          }
          .bg-muted {
            background-color: #f1f5f9 !important;
          }
          .bg-primary\/10 {
            background-color: rgba(var(--primary), 0.1) !important;
          }
        }
      `}</style>
    </div>
  );
}
