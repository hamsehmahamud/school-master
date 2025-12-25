
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle, KeyRound, Save, Eye, EyeOff } from 'lucide-react';
import { changeUserPassword } from '@/services/userService'; // Import the new service

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);

  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }
  });

  const onPasswordChangeSubmit: SubmitHandler<ChangePasswordFormValues> = async (data) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to change your password.", variant: "destructive" });
      return;
    }
    setIsSubmittingPassword(true);
    try {
      await changeUserPassword(currentUser.id, data.oldPassword, data.newPassword);
      toast({ title: "Password Changed", description: "Your password has been successfully updated." });
      resetPasswordForm();
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Could not change your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (isAuthLoading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isMainAdmin = currentUser.role === 'admin' && !currentUser.schoolId;
  const displayRole = isMainAdmin ? 'Main Administrator' : (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1));

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <PageTitle title="User Profile" description="View your profile information and manage your account settings." />
      
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center space-x-4">
            <UserCircle className="h-16 w-16 text-primary" />
            <div>
              <CardTitle className="text-2xl">{currentUser.name || 'User'}</CardTitle>
              <CardDescription>Manage your personal information and security.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="text-sm font-semibold text-muted-foreground">Full Name</Label>
            <p className="text-lg">{currentUser.name || 'N/A'}</p>
          </div>
          {currentUser.email && (
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">Email Address</Label>
              <p className="text-lg">{currentUser.email}</p>
            </div>
          )}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground">User ID</Label>
            <p className="text-lg font-mono text-muted-foreground">{currentUser.id}</p>
          </div>
          {currentUser.role === 'student' && currentUser.studentAppId && (
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">Student Application ID</Label>
              <p className="text-lg">{currentUser.studentAppId}</p>
            </div>
          )}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground">Role</Label>
            <p className="text-lg">{displayRole}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password. Choose a strong, unique password.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onPasswordChangeSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Old Password</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  {...register("oldPassword")}
                  disabled={isSubmittingPassword}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  disabled={isSubmittingPassword}
                  aria-label={showOldPassword ? "Hide old password" : "Show old password"}
                >
                  {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {passwordErrors.oldPassword && <p className="text-sm text-destructive">{passwordErrors.oldPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...register("newPassword")}
                  disabled={isSubmittingPassword}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isSubmittingPassword}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmNewPassword ? "text" : "password"}
                  {...register("confirmNewPassword")}
                  disabled={isSubmittingPassword}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  disabled={isSubmittingPassword}
                  aria-label={showConfirmNewPassword ? "Hide confirm new password" : "Show confirm new password"}
                >
                  {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {passwordErrors.confirmNewPassword && <p className="text-sm text-destructive">{passwordErrors.confirmNewPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmittingPassword} className="ml-auto">
              {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
