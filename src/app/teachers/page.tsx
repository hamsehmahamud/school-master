
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserPlus, Briefcase, Mail, Phone, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getTeachers, deleteTeacher, type ClientSafeTeacherData } from '@/services/teacherService';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

export default function TeachersListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [teachers, setTeachers] = React.useState<ClientSafeTeacherData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [teacherToDelete, setTeacherToDelete] = React.useState<ClientSafeTeacherData | null>(null);
  const [teacherToView, setTeacherToView] = React.useState<ClientSafeTeacherData | null>(null);
  
  const schoolId = currentUser?.schoolId;

  const fetchTeachers = React.useCallback(async () => {
    if (!schoolId) {
      if (!isAuthLoading) toast({ title: "Error", description: "School context is missing.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedTeachers = await getTeachers(schoolId);
      setTeachers(fetchedTeachers);
    } catch (error: any) {
      toast({ title: "Error loading teachers", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, toast, isAuthLoading]);

  React.useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);
  
  const handleDeleteTeacher = async () => {
    if (!teacherToDelete || !schoolId) return;
    setIsDeleting(true);
    try {
      await deleteTeacher(teacherToDelete.id, schoolId);
      toast({ title: "Success", description: `Teacher "${teacherToDelete.fullName}" has been deleted.` });
      setTeacherToDelete(null);
      fetchTeachers();
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to delete teacher: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Teachers List" description="Manage all teachers in your school." />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Teachers</CardTitle>
            <Button onClick={() => router.push('/teachers/add-teacher')}>
              <UserPlus className="mr-2 h-4 w-4" /> Add New Teacher
            </Button>
          </div>
          <CardDescription>A list of all teachers currently employed at the school.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teachers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subjects Taught</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {teacher.fullName}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3"/> {teacher.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3"/> {teacher.phoneNumber}
                        </div>
                    </TableCell>
                    <TableCell>{teacher.subjectsTaught}</TableCell>
                    <TableCell>{format(new Date(teacher.hireDate), "PP")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => setTeacherToView(teacher)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => router.push('/teachers/add-teacher')}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => setTeacherToDelete(teacher)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No teachers have been added yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Teacher Details Dialog */}
      <Dialog open={!!teacherToView} onOpenChange={() => setTeacherToView(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Teacher Details: {teacherToView?.fullName}</DialogTitle>
          </DialogHeader>
          {teacherToView && (
            <div className="space-y-3 py-4 text-sm">
                <div className="grid grid-cols-2 gap-2"><strong>App ID:</strong> <span className="font-mono">{teacherToView.appId}</span></div>
                <div className="grid grid-cols-2 gap-2"><strong>Email:</strong> {teacherToView.email}</div>
                <div className="grid grid-cols-2 gap-2"><strong>Phone:</strong> {teacherToView.phoneNumber}</div>
                <div className="grid grid-cols-2 gap-2"><strong>Gender:</strong> {teacherToView.gender}</div>
                <div className="grid grid-cols-2 gap-2"><strong>Address:</strong> {teacherToView.address}</div>
                <div className="grid grid-cols-2 gap-2"><strong>Subjects:</strong> {teacherToView.subjectsTaught}</div>
                <div className="grid grid-cols-2 gap-2"><strong>Date of Birth:</strong> {format(new Date(teacherToView.dateOfBirth), "PP")}</div>
                <div className="grid grid-cols-2 gap-2"><strong>Hire Date:</strong> {format(new Date(teacherToView.hireDate), "PP")}</div>
                <div className="grid grid-cols-2 gap-2"><strong>Emergency Contact:</strong> {teacherToView.emergencyContactName} ({teacherToView.emergencyContactPhone})</div>
                <div className="grid grid-cols-2 gap-2"><strong>Status:</strong> <span className={`font-semibold ${teacherToView.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{teacherToView.status}</span></div>
            </div>
          )}
           <DialogFooter>
             <DialogClose asChild>
                <Button variant="outline">Close</Button>
             </DialogClose>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!teacherToDelete} onOpenChange={() => setTeacherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{teacherToDelete?.fullName}</strong> and their associated user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeacher} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
