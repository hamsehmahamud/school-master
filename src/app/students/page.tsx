

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserPlus, Search, Edit, Trash2, MoreHorizontal, Eye, FileUp, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getStudents, deleteStudent, addStudent, type ClientSafeStudentData } from '@/services/studentService';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import Papa from 'papaparse';
import { Label } from '@/components/ui/label';

export default function StudentsListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [students, setStudents] = React.useState<ClientSafeStudentData[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [studentToDelete, setStudentToDelete] = React.useState<ClientSafeStudentData | null>(null);
  const [studentToView, setStudentToView] = React.useState<ClientSafeStudentData | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  // State for import dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isProcessingImport, setIsProcessingImport] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);

  const schoolId = currentUser?.schoolId;

  const fetchStudents = React.useCallback(async () => {
    if (!schoolId) {
      if (!isAuthLoading) toast({ title: "Error", description: "School context is missing.", variant: "destructive" });
      setIsLoadingStudents(false);
      return;
    }
    setIsLoadingStudents(true);
    try {
      const fetchedStudents = await getStudents(schoolId);
      setStudents(fetchedStudents);
    } catch (error: any) {
      toast({ title: "Error loading students", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingStudents(false);
    }
  }, [schoolId, toast, isAuthLoading]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDeleteStudent = async () => {
    if (!studentToDelete || !schoolId) return;
    setIsDeleting(true);
    try {
      await deleteStudent(studentToDelete.id, schoolId);
      toast({ title: "Success", description: `Student "${studentToDelete.fullName}" has been deleted.` });
      setStudentToDelete(null);
      fetchStudents();
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to delete student: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditStudent = (studentId: string) => {
    router.push(`/students/edit/${studentId}`);
  };

  const handleDownloadSample = () => {
    const headers = [
      "studentAppId", "fullName", "gender", "dateOfBirth", "contactNumber", "gradeApplyingFor",
      "parentAppId", "parentName", "parentContact", "parentEmail",
      "paymentType", "socialStatus", "feeAmount", "usesBus"
    ];
    const sampleData = [
      ["STU-001", "John Doe", "male", "2010-05-15", "123456789", "Grade 5A", "PAR-001", "Jane Doe", "555-123-4567", "jane.doe@example.com", "Payer", "", "", "yes"],
      ["STU-002", "Alice Smith", "female", "2011-02-20", "234567890", "Grade 4B", "PAR-002", "Bob Smith", "555-765-4321", "bob.smith@example.com", "Discount", "Walaalo", "15", "no"],
      ["STU-003", "Sam Blue", "male", "2012-09-01", "345678901", "Grade 3A", "PAR-003", "Mary Blue", "555-987-6543", "mary.blue@example.com", "Free", "Yatiim", "", "no"],
    ];

    const csvContent = Papa.unparse({
      fields: headers,
      data: sampleData
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "student_import_sample.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleProcessImport = () => {
    if (!importFile || !schoolId) {
      toast({ title: "Missing Information", description: "Please select a file to import.", variant: "destructive" });
      return;
    }
    setIsProcessingImport(true);

    Papa.parse(importFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        let successCount = 0;
        let errorCount = 0;

        for (const row of data) {
          try {
            // Basic validation
            if (!row.studentAppId || !row.fullName || !row.gender || !row.dateOfBirth || !row.gradeApplyingFor || !row.parentAppId || !row.parentName || !row.parentContact) {
              console.warn("Skipping row with missing required fields:", row);
              errorCount++;
              continue;
            }

            await addStudent({
              studentAppId: row.studentAppId,
              fullName: row.fullName,
              gender: row.gender,
              dateOfBirth: row.dateOfBirth,
              contactNumber: row.contactNumber,
              gradeApplyingFor: row.gradeApplyingFor,
              parentAppId: row.parentAppId,
              parentName: row.parentName,
              parentContact: row.parentContact,
              parentEmail: row.parentEmail,
              paymentType: row.paymentType || 'Payer',
              socialStatus: row.socialStatus,
              feeAmount: row.feeAmount ? parseFloat(row.feeAmount) : undefined,
              usesBus: row.usesBus || 'no',
              schoolId: schoolId,
            });
            successCount++;

          } catch (error: any) {
            console.error(`Error importing student ${row.fullName}:`, error);
            errorCount++;
          }
        }

        toast({
          title: "Student Import Complete",
          description: `Successfully imported ${successCount} students. Failed to import ${errorCount} students.`,
          duration: 8000,
        });

        setIsProcessingImport(false);
        setImportFile(null);
        setIsImportDialogOpen(false);
        fetchStudents(); // Refresh the student list
      },
      error: (error: any) => {
        toast({ title: "File Parsing Error", description: error.message, variant: "destructive" });
        setIsProcessingImport(false);
      }
    });
  };


  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentAppId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageTitle title="Students List" description="Manage all students registered in your school." />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Total Students: {students.length}</CardDescription>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64"
              />
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}><FileUp className="mr-2 h-4 w-4" /> Import</Button>
              <Button onClick={() => router.push('/registration/new-student')}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student App ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs">{student.studentAppId}</TableCell>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{student.gradeApplyingFor}</TableCell>
                    <TableCell>{format(new Date(student.registrationDate), "PP")}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setStudentToView(student)}>
                            <Eye className="mr-2 h-4 w-4" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditStudent(student.id)}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStudentToDelete(student)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No students found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Students via Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel or CSV file to bulk-add students. Make sure the file format matches the sample.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button variant="secondary" onClick={handleDownloadSample} className="w-full">
              <FileText className="mr-2 h-4 w-4" /> Download Sample File
            </Button>
            <div className="space-y-2">
              <Label htmlFor="student-file">Excel/CSV File</Label>
              <Input id="student-file" type="file" accept=".csv,.xlsx" onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)} disabled={isProcessingImport} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isProcessingImport}>Cancel</Button>
            <Button onClick={handleProcessImport} disabled={isProcessingImport || !importFile}>
              {isProcessingImport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Process Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{studentToDelete?.fullName}</strong> and all associated data, including their user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!studentToView} onOpenChange={(open) => !open && setStudentToView(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Details: {studentToView?.fullName}</DialogTitle>
          </DialogHeader>
          {studentToView && (
            <div className="space-y-3 py-4 text-sm">
              <div className="grid grid-cols-2 gap-2"><strong>Student ID:</strong> <span className="font-mono">{studentToView.studentAppId}</span></div>
              <div className="grid grid-cols-2 gap-2"><strong>Grade:</strong> {studentToView.gradeApplyingFor}</div>
              <div className="grid grid-cols-2 gap-2"><strong>Gender:</strong> {studentToView.gender}</div>
              <div className="grid grid-cols-2 gap-2"><strong>Date of Birth:</strong> {format(new Date(studentToView.dateOfBirth), "PP")}</div>
              <div className="grid grid-cols-2 gap-2"><strong>Contact Number:</strong> {studentToView.contactNumber || 'N/A'}</div>
              <div className="grid grid-cols-2 gap-2"><strong>Registration Date:</strong> {format(new Date(studentToView.registrationDate), "PP")}</div>
              <hr className="my-2" />
              <div className="grid grid-cols-2 gap-2"><strong>Parent Name:</strong> {studentToView.parentName}</div>
              <div className="grid grid-cols-2 gap-2"><strong>Parent ID:</strong> <span className="font-mono">{studentToView.parentAppId}</span></div>
              <div className="grid grid-cols-2 gap-2"><strong>Parent Contact:</strong> {studentToView.parentContact}</div>
              <div className="grid grid-cols-2 gap-2"><strong>Parent Email:</strong> {studentToView.parentEmail || 'N/A'}</div>
              <hr className="my-2" />
              <div className="grid grid-cols-2 gap-2"><strong>Payment Type:</strong> {studentToView.paymentType}</div>
              {studentToView.paymentType === 'Discount' && <div className="grid grid-cols-2 gap-2"><strong>Fee Amount:</strong> ${studentToView.feeAmount}</div>}
              <div className="grid grid-cols-2 gap-2"><strong>Uses Bus:</strong> {studentToView.usesBus}</div>
              <div className="grid grid-cols-2 gap-2"><strong>Status:</strong> <span className={`font-semibold ${studentToView.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{studentToView.status}</span></div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
