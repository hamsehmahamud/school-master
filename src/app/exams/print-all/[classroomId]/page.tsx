
'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, AlertTriangle, ArrowDownUp } from 'lucide-react';
import { getStudents, type ClientSafeStudentData } from '@/services/studentService';
import { getExamResultsForClassroom, type ClientSafeExamResultData } from '@/services/examService';
import { getClassroomById } from '@/services/classroomService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { StudentReportCard } from '@/components/reports/StudentReportCard';

interface StudentWithResultsAndRank {
  student: ClientSafeStudentData;
  results: ClientSafeExamResultData[];
  grandTotal: number;
  rank: number;
}

const calculateStudentGrandTotal = (studentExamResults: ClientSafeExamResultData[]): number => {
  let grandTotal = 0;
  const subjectsTotal: Record<string, number> = {};

  // This logic needs to correctly sum up the terms as in the report card.
  // The report card sums term1 (monthly1+midterm) and term2 (monthly2+final).
  // The logic here should reflect that to match the final report card total.
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

export default function PrintAllReportsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const classroomId = params.classroomId as string;
  const academicYear = searchParams.get('year') || "";
  const examTypeFilter = searchParams.get('type') || ""; // Can be "all-exams" or a specific exam
  const { currentUser } = useAuth();
  const schoolName = currentUser?.schoolName || 'Barasho Hub';

  const [studentsWithResults, setStudentsWithResults] = React.useState<StudentWithResultsAndRank[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [reportTitle, setReportTitle] = React.useState<string>("");
  const [isSorted, setIsSorted] = React.useState(false);

  React.useEffect(() => {
    async function fetchAllData() {
      if (!classroomId || !academicYear || !examTypeFilter || !currentUser?.schoolId) {
        toast({ title: "Error", description: "Missing required information (class, year, or exam type) to generate reports.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const classroomDetails = await getClassroomById(classroomId, currentUser.schoolId);
        if (!classroomDetails) {
          throw new Error("Classroom not found.");
        }

        setReportTitle(`${classroomDetails.name} - ${examTypeFilter === 'all-exams' ? 'Annual Report' : examTypeFilter} - ${academicYear}`);

        const allStudents = await getStudents(currentUser.schoolId);
        const classroomStudents = allStudents.filter(s => s.gradeApplyingFor === classroomDetails.name);

        if (classroomStudents.length === 0) {
          setStudentsWithResults([]);
          return;
        }

        const allResultsForClassInYear = await getExamResultsForClassroom(classroomDetails.name, currentUser.schoolId, academicYear);

        let studentDataWithTotals: Omit<StudentWithResultsAndRank, 'rank'>[] = classroomStudents.map(student => {
          let studentResults = allResultsForClassInYear.filter(res => res.studentId === student.studentAppId);
          // If a specific exam type is selected, filter for that. Otherwise, use all results for the year.
          if (examTypeFilter !== 'all-exams') {
            studentResults = studentResults.filter(res => res.examType === examTypeFilter);
          }
          const grandTotal = calculateStudentGrandTotal(studentResults);
          return { student, results: studentResults, grandTotal };
        });

        // Now, rank students based on grandTotal
        studentDataWithTotals.sort((a, b) => b.grandTotal - a.grandTotal);

        const rankedStudents: StudentWithResultsAndRank[] = [];
        for (let i = 0; i < studentDataWithTotals.length; i++) {
          const s = studentDataWithTotals[i];
          let rank = i + 1;
          // Handle ties: if the score is the same as the previous student, they get the same rank
          if (i > 0 && s.grandTotal === studentDataWithTotals[i - 1].grandTotal) {
            rank = rankedStudents[i - 1].rank;
          }
          rankedStudents.push({ ...s, rank });
        }

        // Initial sort by name
        rankedStudents.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
        setStudentsWithResults(rankedStudents);

      } catch (error: any) {
        toast({ title: "Error loading data", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllData();
  }, [classroomId, academicYear, examTypeFilter, currentUser?.schoolId, toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleSortByRank = () => {
    setStudentsWithResults(prev => [...prev].sort((a, b) => a.rank - b.rank));
    setIsSorted(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Generating all reports for printing...</p>
      </div>
    );
  }

  if (studentsWithResults.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-center p-8">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold">No Data to Display</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Could not find any students with exam results for the selected classroom, academic year, and exam type. Please go back and verify your selections or ensure results have been entered.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print-area">
      <header className="sticky top-0 z-10 p-4 bg-white shadow-md no-print flex justify-center items-center gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Print Preview</h2>
          <p className="text-muted-foreground">{reportTitle}</p>
        </div>
        <Button onClick={handleSortByRank} size="lg" variant="outline" disabled={isSorted}>
          <ArrowDownUp className="mr-2 h-5 w-5" /> Sort by Rank
        </Button>
        <Button onClick={handlePrint} size="lg">
          <Printer className="mr-2 h-5 w-5" /> Print All Reports ({studentsWithResults.length})
        </Button>
      </header>

      <main className="p-4 md:p-8 space-y-8">
        {studentsWithResults.map((item) => (
          <div key={item.student.id} className="report-card-container bg-white shadow-lg mx-auto">
            <StudentReportCard
              student={item.student}
              allExamResults={item.results}
              selectedAcademicYear={academicYear}
              schoolName={schoolName}
              rank={`${item.rank} of ${studentsWithResults.length}`}
              grandTotal={item.grandTotal}
            />
          </div>
        ))}
      </main>

      <style jsx global>{`
            @media print {
              body, .print-area {
                background-color: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              .print-header {
                  display: block !important;
              }
              main {
                padding: 0 !important;
                margin: 0 !important;
              }
              .report-card-container {
                page-break-after: always;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
               .report-card-container:last-child {
                page-break-after: auto;
              }
            }
        `}</style>
    </div>
  );
}

