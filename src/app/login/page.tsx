
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, GraduationCap, Briefcase, Shield, Users, School, Loader2, Eye, EyeOff, Building, UserCog } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/config/permissions';
import { authenticateUser } from '@/services/userService';
import { useAuth, type ClientSafeUserData as AuthContextUserData } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login: contextLogin } = useAuth();
  const [identifier, setIdentifier] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<UserRole | undefined>(undefined);
  const [schoolId, setSchoolId] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    
    const loginIdentifier = selectedRole === 'teacher' ? (identifier.trim() || email.trim()) : identifier.trim();
    let identifierTypeMessage = "credentials";
    if(selectedRole === 'teacher' && !loginIdentifier) {
        identifierTypeMessage = "Teacher ID or Email"
    }

    if (!loginIdentifier || !password.trim()) {
      toast({
        title: "Xog Ma Buuxsana (Information Missing)",
        description: `Fadlan geli ${identifierTypeMessage} iyo furaha sirta (Please enter ${identifierTypeMessage} and password).`,
        variant: "destructive",
      });
      setIsLoggingIn(false);
      return;
    }

    if (!selectedRole) {
      toast({
        title: "Doorka Dooro (Select Role)",
        description: "Fadlan dooro doorkaaga (Please select your role).",
        variant: "destructive",
      });
      setIsLoggingIn(false);
      return;
    }
    
    if (selectedRole !== 'main-admin' && !schoolId.trim()) {
        toast({
            title: "Aqoonsiga Dugsiga Laga Rabaa (School ID Required)",
            description: "Fadlan geli aqoonsiga dugsiga (Please enter the School ID).",
            variant: "destructive",
        });
        setIsLoggingIn(false);
        return;
    }

    try {
      const authenticatedUser = await authenticateUser({
        identifier: loginIdentifier,
        password,
        role: selectedRole,
        schoolId: schoolId.trim() || undefined,
      });

      if (authenticatedUser) {
        toast({
          title: `Login Succeeded for ${selectedRole}`,
          description: `Welcome ${authenticatedUser.name || authenticatedUser.email}! School: ${authenticatedUser.schoolName || 'Global Admin'}`,
        });
        contextLogin(authenticatedUser as AuthContextUserData);
        router.push('/');
      } else {
        toast({
          title: "Login Failed",
          description: `Aqoonsiga/iimaylka ama furaha sirta ah waa khalad. (Incorrect credentials).`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  let identifierLabel = "Iimayl-ka (Email)";
  let identifierPlaceholder = "Tusaale@gmail.com";
  let identifierInputType: "text" | "email" = "email";

  if (selectedRole === 'student') {
    identifierLabel = "Lambarka Ardayga (Student App ID)";
    identifierPlaceholder = "Geli lambarka ardayga (Enter student App ID)";
    identifierInputType = "text";
  } else if (selectedRole === 'teacher') {
    identifierLabel = "Aqoonsiga Macalinka (Teacher App ID)";
    identifierPlaceholder = "Geli aqoonsiga macalinka (Enter teacher App ID)";
    identifierInputType = "text";
  } else if (selectedRole === 'parent') {
    identifierLabel = "Aqoonsiga Waalidka ama Ardayga (Parent ID or Student ID)";
    identifierPlaceholder = "Geli aqoonsiga waalidka ama ardayga";
    identifierInputType = "text";
  }
  
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  const showSchoolIdField = selectedRole === 'admin' || selectedRole === 'teacher' || selectedRole === 'student' || selectedRole === 'parent';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center bg-primary rounded-full p-3 mb-4 shadow-lg">
          <School className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-primary tracking-tight">Barasho Hub</h1>
        <p className="text-muted-foreground mt-2">
          Nidaamka Maamulka Dugsiga Casriga Ah
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl rounded-xl overflow-hidden border-primary/20">
          <CardHeader className="p-8 text-center">
            <CardTitle className="text-2xl font-semibold text-primary">Welcome Back</CardTitle>
            <CardDescription className="pt-2">
              Select your role and enter your credentials to access the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <motion.form 
              onSubmit={handleLogin} 
              className="space-y-4"
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
               <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="role">Doorkaaga (Your Role)</Label>
                <Select onValueChange={(value) => setSelectedRole(value as UserRole)} value={selectedRole} disabled={isLoggingIn}>
                  <SelectTrigger id="role" className="h-12 text-base">
                    <SelectValue placeholder="Dooro doorkaaga..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main-admin"><UserCog className="mr-2 h-4 w-4 inline-block" /> Maamulka Guud (Main Admin)</SelectItem>
                    <SelectItem value="admin"><Shield className="mr-2 h-4 w-4 inline-block" /> Maamul Dugsiga (School Admin)</SelectItem>
                    <SelectItem value="teacher"><Briefcase className="mr-2 h-4 w-4 inline-block" /> Macalin (Teacher)</SelectItem>
                    <SelectItem value="student"><GraduationCap className="mr-2 h-4 w-4 inline-block" /> Arday (Student)</SelectItem>
                    <SelectItem value="parent"><Users className="mr-2 h-4 w-4 inline-block" /> Waalid (Parent)</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              
              {showSchoolIdField && (
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="schoolId">Aqoonsiga Dugsiga (School ID)</Label>
                  <Input
                    id="schoolId"
                    type="text"
                    placeholder="Geli aqoonsiga dugsiga"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    required={showSchoolIdField}
                    className="h-12 text-base"
                    disabled={isLoggingIn}
                  />
                </motion.div>
              )}
              
              {selectedRole !== 'teacher' && selectedRole && (
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="identifier">{identifierLabel}</Label>
                  <Input
                    id="identifier"
                    type={identifierInputType}
                    placeholder={identifierPlaceholder}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="h-12 text-base"
                    disabled={isLoggingIn}
                  />
                </motion.div>
              )}

              {selectedRole === 'teacher' && (
                 <>
                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="teacherId">{identifierLabel}</Label>
                        <Input
                            id="teacherId"
                            type="text"
                            placeholder={identifierPlaceholder}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="h-12 text-base"
                            disabled={isLoggingIn}
                        />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="teacherEmail">Iimayl-ka (Email)</Label>
                         <Input
                            id="teacherEmail"
                            type="email"
                            placeholder="ama geli iimaylka macalinka"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 text-base"
                            disabled={isLoggingIn}
                        />
                    </motion.div>
                 </>
              )}

              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Furaha Sirta</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm text-primary hover:underline"
                  >
                    Ma illowday Furaha Sirta ah?
                  </Link>
                </div>
                 <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-10 text-base"
                    disabled={isLoggingIn}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={togglePasswordVisibility}
                    disabled={isLoggingIn}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full h-14 text-lg font-semibold shadow-lg" disabled={isLoggingIn}>
                    {isLoggingIn ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <ArrowRight className="mr-2 h-6 w-6" />}
                    GAL
                  </Button>
                </motion.div>
              </motion.div>
            </motion.form>
          </CardContent>
           <CardFooter className="p-6 text-center text-sm text-muted-foreground border-t bg-muted/50">
             &copy; {new Date().getFullYear()} Barasho Hub. All rights reserved.
           </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
