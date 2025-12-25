
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, UserPlus, Briefcase } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { addTeacher, type ClientSafeTeacherData } from '@/services/teacherService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const teacherSchema = z.object({
  appId: z.string().min(1, "App ID is required."),
  fullName: z.string().min(3, "Full name must be at least 3 characters long."),
  gender: z.enum(['Male', 'Female'], { required_error: "Gender is required." }),
  email: z.string().email("Please enter a valid email address."),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number."),
  address: z.string().min(1, "Address is required."),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  subjectsTaught: z.string().min(2, "Please list at least one subject."),
  hireDate: z.date({ required_error: "Hire date is required." }),
  emergencyContactName: z.string().min(1, "Emergency contact name is required."),
  emergencyContactPhone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid emergency contact phone number."),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export default function AddTeacherPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      hireDate: new Date(),
    }
  });

  const onSubmit = async (data: TeacherFormValues) => {
    if (!currentUser?.schoolId) {
      toast({ title: "Error", description: "School ID not found. Cannot add teacher.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // The `addTeacher` function in `teacherService` now correctly handles all fields.
      const result = await addTeacher({
        ...data,
        schoolId: currentUser.schoolId,
        status: 'Active',
      });

      toast({
        title: "Macalin Waa La Diiwaan Geliyay (Teacher Added)",
        description: (
          <div>
            <p><strong>Magaca:</strong> {result.newTeacher.fullName}</p>
            <p><strong>Aqoonsiga Macalinka (Teacher ID):</strong> <span className="font-mono bg-muted p-1 rounded">{result.teacherUser.appId}</span></p>
            <p><strong>Furaha Sirta (Password):</strong> <span className="font-mono bg-muted p-1 rounded">{result.teacherUser.password}</span></p>
          </div>
        ),
        duration: 15000,
      });

      router.push('/teachers');

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

  return (
    <div className="space-y-6">
      <PageTitle title={`Kudar Macalin Cusub Dugsiga ${currentUser?.schoolName}`} description="Buuxi macluumaadka macalinka si aad u abuurto akoon cusub." />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-6 w-6 text-primary"/>Macluumaadka Macalinka (Teacher Information)</CardTitle>
            <CardDescription>Enter the personal and professional details of the new teacher.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Personal Info */}
            <div className="space-y-2">
              <Label htmlFor="appId">Aqoonsiga Macalinka (App ID)</Label>
              <Input id="appId" {...register("appId")} />
              {errors.appId && <p className="text-sm text-destructive">{errors.appId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Magaca oo Dhamaystiran</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
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
                        <SelectItem value="Male">Lab (Male)</SelectItem>
                        <SelectItem value="Female">Dhedig (Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Iimaylka (Email)</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefoonka</Label>
              <Input id="phoneNumber" type="tel" {...register("phoneNumber")} />
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
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
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent>
                  </Popover>
                )}
              />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
            </div>

            {/* Professional Info */}
             <div className="space-y-2">
              <Label>Taariikhda Shaqaalaysiinta (Hire Date)</Label>
              <Controller
                name="hireDate"
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
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                  </Popover>
                )}
              />
              {errors.hireDate && <p className="text-sm text-destructive">{errors.hireDate.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Magaca Xiriirka Degdegga ah</Label>
              <Input id="emergencyContactName" {...register("emergencyContactName")} />
              {errors.emergencyContactName && <p className="text-sm text-destructive">{errors.emergencyContactName.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Telefoonka Xiriirka Degdegga ah</Label>
              <Input id="emergencyContactPhone" type="tel" {...register("emergencyContactPhone")} />
              {errors.emergencyContactPhone && <p className="text-sm text-destructive">{errors.emergencyContactPhone.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-full">
              <Label htmlFor="subjectsTaught">Maadooyinka uu Dhigo (Subjects Taught)</Label>
              <Textarea
                id="subjectsTaught"
                {...register("subjectsTaught")}
                placeholder="List subjects separated by commas, e.g., Mathematics, Physics, Chemistry"
              />
              {errors.subjectsTaught && <p className="text-sm text-destructive">{errors.subjectsTaught.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add Teacher
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
