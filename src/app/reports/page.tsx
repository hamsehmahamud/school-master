
'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, GraduationCap, CalendarCheck, ArrowRight, UserPlus, Activity } from "lucide-react";
import { motion } from 'framer-motion';

const reportCategories = [
  {
    title: "Warbixinta Maaliyadda",
    description: "Access financial summaries, payment records, and expense reports.",
    icon: DollarSign,
    href: "/reports/finance",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Warbixinta Ardayda",
    description: "View student exam results, performance analytics, and generate report cards.",
    icon: GraduationCap,
    href: "/exams",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Warbixinta Xaadiriska",
    description: "Track student attendance records, view trends, and generate daily or monthly reports.",
    icon: CalendarCheck,
    href: "/school/classrooms",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Warbixinta Diiwaangelinta",
    description: "View reports on new student and teacher registrations over time.",
    icon: UserPlus,
    href: "/reports/registration",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
    {
    title: "Warbixinta Dhaqdhaqaaqa",
    description: "Audit user activity, system changes, and access logs for security.",
    icon: Activity,
    href: "/reports/activity",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export default function GeneralReportsPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Guudmar Warbixino (General Reports)" 
        description="Your central hub for all school reports. Select a category to view detailed insights." 
      />
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {reportCategories.map((report) => (
          <motion.div key={report.title} variants={itemVariants}>
            <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${report.bgColor}`}>
                    <report.icon className={`h-7 w-7 ${report.color}`} />
                  </div>
                  <CardTitle className="text-xl">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{report.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link href={report.href}>
                    View Reports <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
