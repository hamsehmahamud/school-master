
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound, School, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Iimaylka Geli (Enter Email)",
        description: "Fadlan geli iimaylka akoonkaaga (Please enter your account's email address).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call to send reset email
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Check Your Email",
      description: `If an account with the email ${email} exists, a password reset link has been sent.`,
    });
    
    setIsSubmitting(false);
    router.push('/login');
  };

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
        <p className="text-muted-foreground mt-2">Soo Celinta Furaha Sirta (Password Reset)</p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } }}
      >
        <Card className="w-full max-w-md shadow-2xl rounded-xl overflow-hidden border-primary/20">
          <CardHeader className="p-8 text-center">
            <CardTitle className="text-2xl font-semibold text-primary">Forgot Your Password?</CardTitle>
            <CardDescription className="pt-2">
              No problem. Enter your email below and we'll send you a link to get back into your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <form onSubmit={handlePasswordReset}>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium text-foreground/90">Iimayl-ka (Email)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tusaale@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base"
                  disabled={isSubmitting}
                />
              </div>
              <motion.div className="mt-6" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold shadow-md" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
                  Send Reset Link
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/50 p-6 text-center text-sm text-muted-foreground border-t">
            <Link href="/login" className="flex items-center justify-center w-full text-primary hover:underline font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
