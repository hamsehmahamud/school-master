
'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getClassrooms, addClassroom, deleteClassroom, type ClientSafeClassroomData } from '@/services/classroomService';
import { Loader2, PlusCircle, Users, ArrowRight, Trash2, Edit, School, MoreVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ClassroomsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [classrooms, setClassrooms] = React.useState<ClientSafeClassroomData[]>([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // State for forms
  const [newClassName, setNewClassName] = React.useState('');
  const [newClassTeacher, setNewClassTeacher] = React.useState('');
  const [newClassAcademicYear, setNewClassAcademicYear] = React.useState('2024-2025');
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  // State for delete confirmation
  const [classroomToDelete, setClassroomToDelete] = React.useState<ClientSafeClassroomData | null>(null);

  const schoolId = currentUser?.schoolId;
  const schoolName = currentUser?.schoolName || "Your School";

  const fetchClassrooms = React.useCallback(async () => {
    if (!schoolId) {
      if (!isAuthLoading) toast({ title: "Error", description: "School context is missing.", variant: "destructive" });
      setIsLoadingClassrooms(false);
      return;
    }
    setIsLoadingClassrooms(true);
    try {
      const fetchedClassrooms = await getClassrooms(schoolId);
      setClassrooms(fetchedClassrooms);
    } catch (error: any) {
      toast({ title: "Error loading classrooms", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingClassrooms(false);
    }
  }, [schoolId, toast, isAuthLoading]);

  React.useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleAddClassroom = async () => {
    if (!newClassName.trim() || !schoolId) {
      toast({ title: "Validation Error", description: "Classroom name is required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addClassroom({
        name: newClassName,
        teacher: newClassTeacher,
        academicYear: newClassAcademicYear,
        schoolId,
      });
      toast({ title: "Success", description: `Classroom "${newClassName}" has been created.` });
      setNewClassName('');
      setNewClassTeacher('');
      setIsFormOpen(false);
      fetchClassrooms();
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to create classroom: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClassroom = async () => {
    if (!classroomToDelete || !schoolId) return;
    setIsSubmitting(true);
    try {
      await deleteClassroom(classroomToDelete.id, schoolId);
      toast({ title: "Success", description: `Classroom "${classroomToDelete.name}" has been deleted.` });
      setClassroomToDelete(null);
      fetchClassrooms();
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to delete classroom: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle title={`Fasallada Dugsiga ${schoolName}`} description="View, create, and manage classrooms for your school." />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" /> Ku dar Fasal Cusub
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Classroom</DialogTitle>
                <DialogDescription>Fill in the details for the new classroom.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Classroom Name</Label>
                  <Input id="className" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g., Grade 1A" disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classTeacher">Teacher Name (Optional)</Label>
                  <Input id="classTeacher" value={newClassTeacher} onChange={(e) => setNewClassTeacher(e.target.value)} placeholder="e.g., Mr. Ahmed" disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input id="academicYear" value={newClassAcademicYear} onChange={(e) => setNewClassAcademicYear(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddClassroom} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Classroom'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>

      {isLoadingClassrooms ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading classrooms...</p>
        </div>
      ) : classrooms.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {classrooms.map((classroom) => (
            <motion.div key={classroom.id} variants={itemVariants} className="group">
              <Card className="relative h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <CardHeader className="bg-muted/30 p-4">
                   <div className="flex justify-between items-start">
                     <div className="p-3 bg-primary/10 rounded-lg">
                       <School className="h-6 w-6 text-primary" />
                     </div>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={e => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); toast({title: "Coming Soon", description: "Editing will be available in a future update."})}}>
                          <Edit className="mr-2 h-4 w-4"/> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); setClassroomToDelete(classroom)}} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col justify-end">
                  <h3 className="text-lg font-bold text-foreground leading-tight">{classroom.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{classroom.teacher || 'Unassigned'}</p>
                </CardContent>
                <CardFooter className="p-4 pt-2 flex items-end justify-between">
                    <div className="flex items-center text-sm font-semibold text-muted-foreground">
                        <Users className="mr-1.5 h-4 w-4" />
                        <span>{classroom.studentCount} Arday</span>
                    </div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                      <Button asChild size="sm" className="w-full rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => router.push(`/school/classrooms/${classroom.id}`)}>
                          <Link href={`/school/classrooms/${classroom.id}`}>
                              Maamul <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                      </Button>
                    </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <School className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No Classrooms Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Click the button to add the first classroom to {schoolName}.</p>
          <div className="mt-6">
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Ku dar Fasal Cusub
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!classroomToDelete} onOpenChange={() => setClassroomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the <strong>{classroomToDelete?.name}</strong> classroom.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClassroom} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
