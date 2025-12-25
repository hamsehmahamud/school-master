
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Loader2, UserCircle, AlertTriangle, Trophy } from 'lucide-react';
import type { ClientSafeStudentData } from '@/services/studentService';
import type { ClientSafeExamResultData } from '@/services/examService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ReportCardProps {
  student: ClientSafeStudentData | null;
  allExamResults: ClientSafeExamResultData[];
  selectedAcademicYear: string;
  schoolName: string;
  rank?: string;
  grandTotal?: number;
}

const ACADEMIC_SUBJECTS = ['REL', 'ARB', 'SOMALI', 'ENG', 'MATH\'S', 'BIO', 'CHEM', 'PHYS', 'GEO', 'HIS'];

const EXAM_TYPE_MAPPING: Record<string, 'monthly1' | 'midterm' | 'monthly2' | 'final'> = {
  'Monthly Exam 1': 'monthly1',
  'Mid-Exam': 'midterm',
  'Monthly Exam 2': 'monthly2',
  'Final Exam': 'final',
};

interface ReportCardScores {
  monthly1?: number;
  midterm?: number;
  term1Total?: number;
  monthly2?: number;
  final?: number;
  term2Total?: number;
  total?: number;
  grading?: string;
}

type ReportCardData = Record<string, ReportCardScores>;

interface TermTotals {
  monthly1: number;
  midterm: number;
  term1Total: number;
  monthly2: number;
  final: number;
  term2Total: number;
  total: number;
  grading: string;
}

const getGrading = (percentage: number): { grade: string, remark: string } => {
  if (percentage >= 90) return { grade: 'A', remark: 'Excellent' };
  if (percentage >= 75) return { grade: 'B', remark: 'Very Good' };
  if (percentage >= 60) return { grade: 'C', remark: 'Good' };
  if (percentage >= 50) return { grade: 'D', remark: 'Acceptable' };
  return { grade: 'F', remark: 'Fail' };
};

const GradingLegend = () => (
  <div className="mt-6 border-2 border-dashed rounded-lg no-print">
    <div className="grid grid-cols-5 divide-x-2 divide-dashed">
      <div className="p-2 text-center"><p className="font-bold">A = 100 - 90%</p><p className="text-sm text-muted-foreground">Excellent</p></div>
      <div className="p-2 text-center"><p className="font-bold">B = 89 - 75%</p><p className="text-sm text-muted-foreground">Very Good</p></div>
      <div className="p-2 text-center"><p className="font-bold">C = 74 - 60%</p><p className="text-sm text-muted-foreground">Good</p></div>
      <div className="p-2 text-center"><p className="font-bold">D = 59 - 50%</p><p className="text-sm text-muted-foreground">Acceptable</p></div>
      <div className="p-2 text-center"><p className="font-bold">F = 49 - 0%</p><p className="text-sm text-muted-foreground">Fail</p></div>
    </div>
  </div>
);

export const StudentReportCard: React.FC<ReportCardProps> = ({ student, allExamResults, selectedAcademicYear, schoolName, rank, grandTotal }) => {

  const reportCard = React.useMemo(() => {
    const data: ReportCardData = {};
    ACADEMIC_SUBJECTS.forEach(subject => { data[subject] = {}; });

    const filteredResults = allExamResults.filter(r => r.academicYear === selectedAcademicYear);

    filteredResults.forEach(result => {
      result.subjects.forEach(subjectScore => {
        const subjectKey = ACADEMIC_SUBJECTS.find(s => s.toUpperCase() === subjectScore.subjectName.toUpperCase());
        const examTypeKey = EXAM_TYPE_MAPPING[result.examType];
        if (subjectKey && examTypeKey) {
          data[subjectKey][examTypeKey] = subjectScore.score;
        }
      });
    });

    let calculatedGrandTotal = 0;
    const termTotals: TermTotals = { monthly1: 0, midterm: 0, term1Total: 0, monthly2: 0, final: 0, term2Total: 0, total: 0, grading: 'F' };

    ACADEMIC_SUBJECTS.forEach(subject => {
      const scores = data[subject];
      scores.term1Total = (scores.monthly1 || 0) + (scores.midterm || 0);
      scores.term2Total = (scores.monthly2 || 0) + (scores.final || 0);

      const totalForSubject = scores.term1Total + scores.term2Total;
      scores.total = totalForSubject;
      // The grading is based on the total score out of 200 (since it's two terms)
      scores.grading = getGrading(totalForSubject / 2).grade;

      termTotals.monthly1 += scores.monthly1 || 0;
      termTotals.midterm += scores.midterm || 0;
      termTotals.term1Total += scores.term1Total;
      termTotals.monthly2 += scores.monthly2 || 0;
      termTotals.final += scores.final || 0;
      termTotals.term2Total += scores.term2Total;

      calculatedGrandTotal += totalForSubject;
    });

    termTotals.total = calculatedGrandTotal;
    // Grand total is out of (number of subjects * 200)
    const maxTotalScore = ACADEMIC_SUBJECTS.length * 200;
    termTotals.grading = getGrading((calculatedGrandTotal / maxTotalScore) * 100).grade;

    return { data, termTotals, grandTotal: calculatedGrandTotal };

  }, [allExamResults, selectedAcademicYear]);

  if (!student) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="ml-4 text-muted-foreground">Student data is missing.</p>
      </div>
    );
  }

  const displayGrandTotal = grandTotal !== undefined ? grandTotal : reportCard.grandTotal;

  return (
    <div className="p-8 space-y-6 bg-white student-report-card">
      <header className="report-header text-center space-y-2 border-b-4 border-green-600 pb-4">
        <div className="flex justify-between items-center">
          <Image src="https://picsum.photos/seed/logo1/100/100" alt="School Logo Left" width={100} height={100} data-ai-hint="school logo" />
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-green-700 uppercase">{schoolName}</h1>
            <p className="text-md font-semibold text-gray-600">Student Report</p>
            <p className="text-sm text-gray-500">{selectedAcademicYear}</p>
            <p className="text-xs text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <Image src="https://picsum.photos/seed/logo2/100/100" alt="School Logo Right" width={100} height={100} data-ai-hint="school logo" />
        </div>
      </header>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableBody>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableCell>{student.studentAppId}</TableCell>
              <TableHead>Name</TableHead>
              <TableCell className="font-semibold">{student.fullName}</TableCell>
              <TableHead>Class</TableHead>
              <TableCell>{student.gradeApplyingFor}</TableCell>
              <TableHead>Contacts</TableHead>
              <TableCell>{student.parentContact}</TableCell>
              <TableHead>Parents</TableHead>
              <TableCell>{student.parentName}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="overflow-x-auto">
        <Table className="border">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead rowSpan={2} className="border p-2 align-middle font-bold">Subjects</TableHead>
              <TableHead colSpan={3} className="text-center border p-2 font-bold">Term 1</TableHead>
              <TableHead colSpan={3} className="text-center border p-2 font-bold">Term 2</TableHead>
              <TableHead colSpan={2} className="text-center border p-2 font-bold">Academic progress</TableHead>
            </TableRow>
            <TableRow className="bg-gray-100">
              <TableHead className="text-center border p-2">Monthly (1)</TableHead>
              <TableHead className="text-center border p-2">Mid-Exam</TableHead>
              <TableHead className="text-center border p-2 font-semibold">Term (1)</TableHead>
              <TableHead className="text-center border p-2">Monthly (2)</TableHead>
              <TableHead className="text-center border p-2">Final-Exam</TableHead>
              <TableHead className="text-center border p-2 font-semibold">Term (2)</TableHead>
              <TableHead className="text-center border p-2 font-semibold">Total</TableHead>
              <TableHead className="text-center border p-2 font-semibold">Grading</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ACADEMIC_SUBJECTS.map(subject => {
              const subjectData = reportCard.data[subject];
              return (
                <TableRow key={subject}>
                  <TableCell className="border p-2 font-medium">{subject}</TableCell>
                  <TableCell className="text-center border p-2">{subjectData?.monthly1 ?? '-'}</TableCell>
                  <TableCell className="text-center border p-2">{subjectData?.midterm ?? '-'}</TableCell>
                  <TableCell className="text-center border p-2 font-semibold bg-muted/30">{subjectData?.term1Total ?? '-'}</TableCell>
                  <TableCell className="text-center border p-2">{subjectData?.monthly2 ?? '-'}</TableCell>
                  <TableCell className="text-center border p-2">{subjectData?.final ?? '-'}</TableCell>
                  <TableCell className="text-center border p-2 font-semibold bg-muted/30">{subjectData?.term2Total ?? '-'}</TableCell>
                  <TableCell className="text-center border p-2 font-semibold bg-primary/10">{subjectData?.total ?? '-'}</TableCell>
                  <TableCell className={cn("text-center border p-2 font-bold", subjectData?.grading === 'F' && 'text-destructive')}>{subjectData?.grading ?? '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-gray-200 font-bold">
              <TableCell className="border p-2">Total</TableCell>
              <TableCell className="text-center border p-2">{reportCard.termTotals.monthly1}</TableCell>
              <TableCell className="text-center border p-2">{reportCard.termTotals.midterm}</TableCell>
              <TableCell className="text-center border p-2">{reportCard.termTotals.term1Total}</TableCell>
              <TableCell className="text-center border p-2">{reportCard.termTotals.monthly2}</TableCell>
              <TableCell className="text-center border p-2">{reportCard.termTotals.final}</TableCell>
              <TableCell className="text-center border p-2">{reportCard.termTotals.term2Total}</TableCell>
              <TableCell className="text-center border p-2">{reportCard.termTotals.total}</TableCell>
              <TableCell className="text-center border p-2">{reportCard.termTotals.grading}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={7} className="text-right font-bold p-2">GRAND TOTAL:</TableCell>
              <TableCell colSpan={2} className="text-left font-bold p-2 text-lg">{displayGrandTotal} / {ACADEMIC_SUBJECTS.length * 200}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        {rank !== undefined && (
          <div className="flex items-center gap-2 p-2 px-4 border-2 border-amber-400 bg-amber-50 rounded-lg">
            <Trophy className="h-6 w-6 text-amber-600" />
            <p className="text-md font-bold text-amber-800">Rank: {rank}</p>
          </div>
        )}
      </div>

      <GradingLegend />

      <footer className="pt-16 flex justify-between items-end">
        <div className="text-center">
          <p className="font-semibold">_________________________</p>
          <p className="text-sm">Maamulaha Dugsiga</p>
        </div>
        <div className="text-center">
          <Image src="https://picsum.photos/seed/seal/150/150" alt="School Seal" width={150} height={150} data-ai-hint="school seal" />
        </div>
        <div className="text-center">
          <p className="font-semibold">_________________________</p>
          <p className="text-sm">Saxiixa Waalidka</p>
        </div>
      </footer>
    </div>
  );
};

