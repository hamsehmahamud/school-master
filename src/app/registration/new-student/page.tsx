
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, UserPlus, GraduationCap, School } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { addStudent, type ClientSafeStudentData } from '@/services/studentService';
import { useAuth } from '@/contexts/AuthContext';
import { getClassrooms, type ClientSafeClassroomData as ClassroomInfo } from '@/services/classroomService';
import { useRouter } from 'next/navigation';

const studentSchema = z.object({
  studentAppId: z.string().min(1, "Student App ID is required."),
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
}).refine(data => {
  if (data.paymentType === 'Discount') {
    return data.feeAmount !== undefined && data.feeAmount > 0;
  }
  return true;
}, {
  message: "Fee amount is required for 'Discount' payment type.",
  path: ["feeAmount"],
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function NewStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [availableClassrooms, setAvailableClassrooms] = React.useState<ClassroomInfo[]>([]);
  const currentSchoolId = currentUser?.schoolId;
  const currentSchoolName = currentUser?.schoolName || "Your School";

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      usesBus: 'no',
    }
  });

  const paymentType = watch("paymentType");
  
  React.useEffect(() => {
    async function fetchClassrooms() {
      if (!currentSchoolId || isAuthLoading) return;
      try {
        const fetchedClassrooms = await getClassrooms(currentSchoolId);
        setAvailableClassrooms(fetchedClassrooms);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load classrooms.", variant: "destructive" });
      }
    }
    fetchClassrooms();
  }, [currentSchoolId, isAuthLoading, toast]);


  const onSubmit = async (data: StudentFormValues) => {
    if (!currentSchoolId) {
        toast({ title: "Error", description: "School ID not found. Cannot register student.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const studentData = {
        ...data,
        dateOfBirth: data.dateOfBirth.toISOString(),
        schoolId: currentSchoolId,
      };

      const result = await addStudent(studentData as any); // Cast because service expects a specific shape

      toast({
        title: "Ardayga Waa La Diiwaan Geliyay (Student Registered)",
        description: (
          <div>
            <p><strong>Magaca:</strong> {result.newStudent.fullName}</p>
            <p><strong>Aqoonsiga Ardayga (Student ID):</strong> <span className="font-mono bg-muted p-1 rounded">{result.studentUser.appId}</span></p>
            <p><strong>Furaha Sirta (Password):</strong> <span className="font-mono bg-muted p-1 rounded">{result.studentUser.password}</span></p>
            <hr className="my-2"/>
            <p><strong>Aqoonsiga Waalidka (Parent ID):</strong> <span className="font-mono bg-muted p-1 rounded">{result.parentUser.appId}</span></p>
            <p><strong>Furaha Sirta Waalidka (Parent Password):</strong> <span className="font-mono bg-muted p-1 rounded">{result.parentUser.password}</span></p>
          </div>
        ),
        duration: 20000,
      });

      router.push('/school/classrooms');

    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <PageTitle title={`Diiwaangelinta Ardayda ee ${currentSchoolName}`} description="Buuxi foomkan si aad u diiwaangeliso arday cusub." />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="h-6 w-6 text-primary"/>Macluumaadka Ardayga (Student Information)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="studentAppId">Aqoonsiga Ardayga (Student App ID)</Label>
                <Input id="studentAppId" {...register("studentAppId")} />
                {errors.studentAppId && <p className="text-sm text-destructive">{errors.studentAppId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Magaca oo Dhamaystiran</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
                <Input id="contactNumber" {...register("contactNumber")} />
                {errors.contactNumber && <p className="text-sm text-destructive">{errors.contactNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Jinsiga (Gender)</Label>
                 <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Dooro Jinsiga" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Lab (Male)</SelectItem>
                          <SelectItem value="female">Dhedig (Female)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Taariikhda Dhalashada</Label>
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
                            {field.value ? format(field.value, "PPP") : <span>Dooro taariikh</span>}
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
            <CardTitle className="flex items-center gap-2"><School className="h-6 w-6 text-primary"/>Macluumaadka Waxbarashada (Academic Information)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label>Fasalka Loo Diiwaangelinayo</Label>
                 <Controller
                    name="gradeApplyingFor"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={availableClassrooms.length === 0}>
                        <SelectTrigger><SelectValue placeholder={availableClassrooms.length > 0 ? "Dooro Fasal" : "No classrooms available"} /></SelectTrigger>
                        <SelectContent>
                          {availableClassrooms.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                {errors.gradeApplyingFor && <p className="text-sm text-destructive">{errors.gradeApplyingFor.message}</p>}
            </div>
            
            <div className="space-y-2">
                <Label>Nooca Lacag Bixinta</Label>
                 <Controller
                    name="paymentType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Dooro nooca lacag bixinta" /></SelectTrigger>
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
                <Label htmlFor="feeAmount">Qiimaha La Dhimay (Discounted Fee Amount)</Label>
                <Input id="feeAmount" type="number" {...register("feeAmount", { valueAsNumber: true })} />
                {errors.feeAmount && <p className="text-sm text-destructive">{errors.feeAmount.message}</p>}
              </div>
            )}
            
            <div className="space-y-2">
                <Label>Xaalada Bulsho (Social Status)</Label>
                 <Controller
                    name="socialStatus"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Dooro xaalada" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yatiim">Yatiim (Orphan)</SelectItem>
                          <SelectItem value="Danyar">Danyar (Needy)</SelectItem>
                          <SelectItem value="Walaalo">Walaalo (Siblings)</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                {errors.socialStatus && <p className="text-sm text-destructive">{errors.socialStatus.message}</p>}
            </div>

             <div className="space-y-2">
                <Label>Isticmaala Baska (Uses Bus)</Label>
                 <Controller
                    name="usesBus"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Haa (Yes)</SelectItem>
                          <SelectItem value="no">Maya (No)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                {errors.usesBus && <p className="text-sm text-destructive">{errors.usesBus.message}</p>}
            </div>
            
          </CardContent>
         </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary"/>Macluumaadka Waalidka (Parent/Guardian Information)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="parentAppId">Aqoonsiga Waalidka (Parent App ID)</Label>
                <Input id="parentAppId" {...register("parentAppId")} />
                {errors.parentAppId && <p className="text-sm text-destructive">{errors.parentAppId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentName">Magaca Waalidka</Label>
                <Input id="parentName" {...register("parentName")} />
                {errors.parentName && <p className="text-sm text-destructive">{errors.parentName.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentContact">Telefoonka Waalidka (Parent Contact)</Label>
                <Input id="parentContact" type="tel" {...register("parentContact")} />
                {errors.parentContact && <p className="text-sm text-destructive">{errors.parentContact.message}</p>}
              </div>

               <div className="space-y-2">
                <Label htmlFor="parentEmail">Iimaylka Waalidka (Ikhtiyaari)</Label>
                <Input id="parentEmail" type="email" {...register("parentEmail")} />
                {errors.parentEmail && <p className="text-sm text-destructive">{errors.parentEmail.message}</p>}
              </div>
          </CardContent>
           <CardFooter className="flex justify-end">
             <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Diiwaangeli Ardayga
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
