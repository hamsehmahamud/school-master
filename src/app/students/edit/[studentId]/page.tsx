
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2, UserPlus, GraduationCap, School, Save, ChevronLeft } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentById, updateStudent, type ClientSafeStudentData } from '@/services/studentService';
import { getClassrooms, type ClientSafeClassroomData as ClassroomInfo } from '@/services/classroomService';

const studentSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long."),
  contactNumber: z.string().optional(),
  gender: z.enum(['male', 'female'], { required_error: "Gender is required." }),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  gradeApplyingFor: z.string().min(1, "Grade is required."),
  parentAppId: z.string().min(1, "Parent App ID is required."),
  parentName: z.string().min(3, "Parent's name is required."),
  parentContact: z.string().regex(/^\+?[0-9]{7,15}$/, "Please enter a valid contact number."),
  parentEmail: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  paymentType: z.enum(['Payer', 'Discount', 'Free'], { required_error: "Payment type is required." }),
  socialStatus: z.string().optional(),
  feeAmount: z.number().optional(),
  usesBus: z.enum(['yes', 'no'], { required_error: "Bus usage information is required." }),
  status: z.enum(['active', 'inactive', 'graduated'], { required_error: "Status is required." }),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function EditStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingPage, setIsLoadingPage] = React.useState(true);
  const [availableClassrooms, setAvailableClassrooms] = React.useState<ClassroomInfo[]>([]);
  const currentSchoolId = currentUser?.schoolId;

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
  });

  const paymentType = watch("paymentType");

  React.useEffect(() => {
    if (!studentId || !currentSchoolId || isAuthLoading) return;

    async function fetchStudentAndClassrooms() {
      if (!currentSchoolId) return;
      setIsLoadingPage(true);
      try {
        const [studentData, classroomsData] = await Promise.all([
          getStudentById(studentId, currentSchoolId),
          getClassrooms(currentSchoolId)
        ]);

        if (studentData) {
          reset({
            ...studentData,
            dateOfBirth: parseISO(studentData.dateOfBirth),
          });
        } else {
          toast({ title: "Error", description: "Student not found.", variant: "destructive" });
          router.push('/students');
        }

        setAvailableClassrooms(classroomsData);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load student data.", variant: "destructive" });
      } finally {
        setIsLoadingPage(false);
      }
    }
    fetchStudentAndClassrooms();
  }, [studentId, currentSchoolId, isAuthLoading, reset, toast, router]);

  const onSubmit = async (data: StudentFormValues) => {
    if (!currentSchoolId) {
      toast({ title: "Error", description: "School ID not found. Cannot update student.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const studentUpdateData: Partial<Omit<ClientSafeStudentData, 'id'>> = {
        ...data,
        dateOfBirth: data.dateOfBirth.toISOString(),
      };

      await updateStudent(studentId, currentSchoolId, studentUpdateData);

      toast({
        title: "Student Updated",
        description: `Information for ${data.fullName} has been successfully updated.`,
      });

      router.push('/students');

    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoadingPage) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Edit Student Information" description="Update the details for the selected student." />
        <Button variant="outline" onClick={() => router.back()} className="h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all group">
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="h-6 w-6 text-primary" />Student Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
              <Input id="contactNumber" {...register("contactNumber")} />
              {errors.contactNumber && <p className="text-sm text-destructive">{errors.contactNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1990} toYear={new Date().getFullYear()} initialFocus /></PopoverContent>
                  </Popover>
                )}
              />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><School className="h-6 w-6 text-primary" />Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Grade Applying For</Label>
              <Controller
                name="gradeApplyingFor"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={availableClassrooms.length === 0}>
                    <SelectTrigger><SelectValue placeholder={availableClassrooms.length > 0 ? "Select Grade" : "No classrooms available"} /></SelectTrigger>
                    <SelectContent>
                      {availableClassrooms.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gradeApplyingFor && <p className="text-sm text-destructive">{errors.gradeApplyingFor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Controller
                name="paymentType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select payment type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Payer">Payer</SelectItem>
                      <SelectItem value="Discount">Discount</SelectItem>
                      <SelectItem value="Free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentType && <p className="text-sm text-destructive">{errors.paymentType.message}</p>}
            </div>

            {paymentType === 'Discount' && (
              <div className="space-y-2">
                <Label htmlFor="feeAmount">Discounted Fee Amount</Label>
                <Input id="feeAmount" type="number" {...register("feeAmount", { valueAsNumber: true })} />
                {errors.feeAmount && <p className="text-sm text-destructive">{errors.feeAmount.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Social Status</Label>
              <Controller
                name="socialStatus"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yatiim">Orphan</SelectItem>
                      <SelectItem value="Danyar">Needy</SelectItem>
                      <SelectItem value="Walaalo">Siblings</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.socialStatus && <p className="text-sm text-destructive">{errors.socialStatus.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Uses Bus</Label>
              <Controller
                name="usesBus"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.usesBus && <p className="text-sm text-destructive">{errors.usesBus.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Student Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary" />Parent/Guardian Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="parentAppId">Parent App ID</Label>
              <Input id="parentAppId" {...register("parentAppId")} />
              {errors.parentAppId && <p className="text-sm text-destructive">{errors.parentAppId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent Name</Label>
              <Input id="parentName" {...register("parentName")} />
              {errors.parentName && <p className="text-sm text-destructive">{errors.parentName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentContact">Parent Contact</Label>
              <Input id="parentContact" type="tel" {...register("parentContact")} />
              {errors.parentContact && <p className="text-sm text-destructive">{errors.parentContact.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent Email (Optional)</Label>
              <Input id="parentEmail" type="email" {...register("parentEmail")} />
              {errors.parentEmail && <p className="text-sm text-destructive">{errors.parentEmail.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
