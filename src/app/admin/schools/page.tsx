
'use client';

import * as React from 'react';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Loader2, Building, Globe, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getAllSchools, addSchool, deleteSchool, updateSchool, type ClientSafeSchoolData } from '@/services/schoolService';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SchoolFormState {
  name: string;
  adminEmail: string;
  status: 'active' | 'inactive';
}

const initialSchoolFormState: SchoolFormState = {
  name: "",
  adminEmail: "",
  status: 'active',
};

export default function ManageSchoolsPage() {
  const { toast } = useToast();
  const [schools, setSchools] = React.useState<ClientSafeSchoolData[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = React.useState(false);
  const [schoolToManage, setSchoolToManage] = React.useState<ClientSafeSchoolData | null>(null);
  
  const [formState, setFormState] = React.useState<SchoolFormState>(initialSchoolFormState);

  const fetchSchools = React.useCallback(async () => {
    setIsLoadingSchools(true);
    try {
      const fetchedSchools = await getAllSchools();
      setSchools(fetchedSchools);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch schools.", variant: "destructive" });
    } finally {
      setIsLoadingSchools(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleOpenFormDialog = (school?: ClientSafeSchoolData) => {
    if (school) {
      setSchoolToManage(school);
      setFormState({
        name: school.name,
        adminEmail: school.contactEmail || "",
        status: school.status || 'active',
      });
    } else {
      setSchoolToManage(null);
      setFormState(initialSchoolFormState);
    }
    setIsFormDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (school: ClientSafeSchoolData) => {
    setSchoolToManage(school);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: 'active' | 'inactive') => {
    setFormState(prev => ({...prev, status: value}));
  };

  const handleSubmitSchool = async () => {
    if (!formState.name.trim() || !formState.adminEmail.trim()) {
      toast({ title: "Validation Error", description: "School Name and Admin Login Email are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (schoolToManage) {
        const updateData: Partial<ClientSafeSchoolData> & { status?: 'active' | 'inactive' } = { 
          name: formState.name,
          status: formState.status
        };
        if (formState.adminEmail) {
            updateData.contactEmail = formState.adminEmail;
        }
        await updateSchool(schoolToManage.id, updateData);
        toast({ title: "School Updated", description: `${formState.name} has been updated.` });
      } else {
        const { newSchool, adminUser } = await addSchool({ name: formState.name, adminEmail: formState.adminEmail });
        let description = `${newSchool.name} has been added. Admin Login: ${adminUser.email}. Password: ${adminUser.password}.`;
        toast({
          title: "School & Admin Created",
          description: description,
          duration: 15000, 
        });
      }
      setIsFormDialogOpen(false);
      fetchSchools();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save school.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!schoolToManage) return;
    setIsSubmitting(true);
    try {
      await deleteSchool(schoolToManage.id);
      toast({ title: "School Deleted", description: `${schoolToManage.name} has been deleted.` });
      fetchSchools();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete school.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsConfirmDeleteDialogOpen(false);
      setSchoolToManage(null);
    }
  };


  return (
    <div className="space-y-6">
      <PageTitle title="Maareynta Dugsiyada (Manage Schools)" description="Add, view, edit, or delete schools in the system." />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Liiska Dugsiyada (Schools List)</CardTitle>
            <Button onClick={() => handleOpenFormDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Ku Dar Dugsi Cusub
            </Button>
          </div>
          <CardDescription>
            Overview of all registered schools. School IDs and admin credentials are auto-generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSchools ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading schools...</p>
            </div>
          ) : schools.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Admin Login Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-mono text-xs">{school.id}</TableCell>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.contactEmail || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        school.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {school.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                        {school.status}
                      </span>
                    </TableCell>
                    <TableCell>{format(parseISO(school.createdAt), "PPp")}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isSubmitting}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleOpenFormDialog(school)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDeleteDialog(school)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-10">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-semibold">No Schools Found</p>
              <p className="text-muted-foreground text-sm">Click "Ku Dar Dugsi Cusub" to add the first school.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
          setIsFormDialogOpen(isOpen);
          if (!isOpen) setSchoolToManage(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{schoolToManage ? `Edit School: ${schoolToManage.name}` : 'Ku Dar Dugsi Cusub (Add New School)'}</DialogTitle>
            <DialogDescription>
              {schoolToManage ? 'Update the school details below.' : 'Buuxi foomka si aad u abuurto dugsi cusub iyo maamulkiisa.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">School Name</Label>
              <Input id="name" name="name" value={formState.name} onChange={handleInputChange} disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="adminEmail">School Admin Login Email</Label>
              <Input id="adminEmail" name="adminEmail" type="email" value={formState.adminEmail} onChange={handleInputChange} disabled={isSubmitting || !!schoolToManage} />
              {schoolToManage && <p className="text-xs text-muted-foreground mt-1">Admin email cannot be changed after creation.</p>}
            </div>
            {schoolToManage && (
                 <div>
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={handleStatusChange} value={formState.status} disabled={isSubmitting}>
                        <SelectTrigger id="status">
                           <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmitSchool} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (schoolToManage ? "Save Changes" : "Create School")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this school?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{schoolToManage?.name}</strong> and all associated users and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSchoolToManage(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchool} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
