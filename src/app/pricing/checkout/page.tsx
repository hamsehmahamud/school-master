
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const checkoutSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("A valid email is required"),
  cardName: z.string().min(3, "Name on card is required"),
  cardNumber: z.string().regex(/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/, "Invalid card number"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/, "Invalid expiry date (MM/YY)"),
  cvc: z.string().regex(/^[0-9]{3,4}$/, "Invalid CVC"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const plans = {
  basic: { name: 'Basic Plan', price: '$30/month' },
  pro: { name: 'Pro Plan', price: '$0.05/student/month' }
};

type PaymentMethod = 'mastercard' | 'waafi';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const planId = searchParams.get('plan') as keyof typeof plans | null;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>('mastercard');

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const selectedPlan = planId ? plans[planId] : null;

  const onSubmit: SubmitHandler<CheckoutFormValues> = async (data) => {
    setIsSubmitting(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsCompleted(true);
    toast({
      title: "Payment Successful!",
      description: `Your subscription for the ${selectedPlan?.name} is now active.`,
    });
  };
  
  if (!selectedPlan) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">No Plan Selected</h2>
        <p className="text-muted-foreground mt-2">Please go back to the pricing page and choose a plan.</p>
        <Button onClick={() => router.push('/pricing')} className="mt-4">Go to Pricing</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
       <AnimatePresence mode="wait">
        {isCompleted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 flex flex-col items-center"
            >
              <CheckCircle className="h-24 w-24 text-green-500 mb-6" />
              <h1 className="text-4xl font-bold">Thank You!</h1>
              <p className="text-lg text-muted-foreground mt-2">Your subscription to the {selectedPlan.name} is complete.</p>
              <Button onClick={() => router.push('/')} className="mt-8" size="lg">Go to Dashboard</Button>
            </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0, y: 20 }}>
            <PageTitle title="Complete Your Subscription" description={`You are subscribing to the ${selectedPlan.name} (${selectedPlan.price})`} />
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <Card className="border-primary/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary"/> Billing Information</CardTitle>
                  <CardDescription>Choose a payment method and enter your details.</CardDescription>
                </CardHeader>
                <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={selectedPaymentMethod === 'mastercard' ? 'default' : 'outline'} onClick={() => setSelectedPaymentMethod('mastercard')}>
                            <CreditCard className="mr-2 h-4 w-4"/> Mastercard
                        </Button>
                        <Button variant={selectedPaymentMethod === 'waafi' ? 'default' : 'outline'} onClick={() => setSelectedPaymentMethod('waafi')}>
                            Waafi
                        </Button>
                    </div>
                </div>

                {selectedPaymentMethod === 'mastercard' && (
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" {...register("fullName")} disabled={isSubmitting} />
                            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" {...register("email")} disabled={isSubmitting} />
                            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                          </div>
                      </div>
                      <hr className="my-4" />
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input id="cardName" {...register("cardName")} disabled={isSubmitting} />
                        {errors.cardName && <p className="text-sm text-destructive">{errors.cardName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" {...register("cardNumber")} disabled={isSubmitting} placeholder="•••• •••• •••• ••••" />
                        {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry (MM/YY)</Label>
                          <Input id="expiryDate" {...register("expiryDate")} disabled={isSubmitting} placeholder="MM/YY" />
                          {errors.expiryDate && <p className="text-sm text-destructive">{errors.expiryDate.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input id="cvc" {...register("cvc")} disabled={isSubmitting} placeholder="•••" />
                          {errors.cvc && <p className="text-sm text-destructive">{errors.cvc.message}</p>}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch">
                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                        Subscribe Now
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-1"><Lock className="h-3 w-3"/> Secure SSL Encrypted Payment</p>
                    </CardFooter>
                  </form>
                )}

                {selectedPaymentMethod === 'waafi' && (
                    <div className="p-6">
                        <p className="text-center text-muted-foreground">Waafi integration is coming soon. A real implementation would show instructions or a QR code here.</p>
                        <Button className="w-full mt-4" disabled>Complete with Waafi</Button>
                    </div>
                )}

              </Card>
              
              <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-8 border border-dashed">
                <h3 className="text-xl font-bold">Summary</h3>
                <div className="mt-6 w-full space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">{selectedPlan.price}</span>
                  </div>
                  <hr/>
                   <div className="flex justify-between text-lg">
                    <span className="text-foreground font-bold">Total Due Today:</span>
                    <span className="font-bold text-primary">{planId === 'pro' ? 'Usage-Based' : '$30.00'}</span>
                  </div>
                </div>
                 <Button variant="ghost" onClick={() => router.push('/pricing')} className="mt-8 text-sm">
                   <ArrowLeft className="mr-2 h-4 w-4" />
                   Change Plan
                 </Button>
              </div>

            </div>
          </motion.div>
        )}
       </AnimatePresence>
    </div>
  );
}
