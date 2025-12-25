

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { cn } from "@/lib/utils";

const tiers = [
  {
    id: "basic",
    name: "Basic Plan",
    price: "$30",
    pricePeriod: "/month",
    description: "Ideal for small schools getting started with digital management.",
    features: [
      "Up to 500 Students",
      "Core School Management",
      "Teacher & Student Profiles",
      "Basic Reporting",
    ],
    buttonText: "Choose Basic",
    buttonVariant: "outline",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: "$0.05",
    pricePeriod: "/student/month",
    description: "A flexible plan that scales with your school's growth.",
    features: [
      "Unlimited Students",
      "Advanced Financial Tools",
      "Automated Exam Reports",
      "Parent Portal Access",
      "Priority Support",
    ],
    buttonText: "Choose Pro",
    buttonVariant: "default",
    featured: true,
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Our Pricing Plans" 
        description="Choose the perfect plan for your institution. Simple, transparent, and built to scale." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {tiers.map((tier) => (
          <Card key={tier.name} className={`flex flex-col ${tier.featured ? 'border-primary shadow-lg' : ''}`}>
            {tier.featured && (
              <div className="bg-primary text-primary-foreground text-center text-sm font-semibold py-1 rounded-t-lg">
                Most Popular
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.pricePeriod}</span>
              </div>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={tier.buttonVariant as any} size="lg">
                <Link href={`/pricing/checkout?plan=${tier.id}`}>
                    {tier.featured && <Zap className="mr-2 h-4 w-4" />}
                    {tier.buttonText}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
