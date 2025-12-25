
'use client';

import { StatCard } from "@/components/shared/StatCard";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ClipboardCheck, TrendingUp, Activity, Loader2, CalendarDays, FileText, Megaphone, ArrowRight, UserCircle, AlertTriangle, Building, CheckCircle, XCircle } from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getStudents, type ClientSafeStudentData } from '@/services/studentService';
import { getTeachers, type ClientSafeTeacherData } from '@/services/teacherService';
import { getClassrooms, type ClientSafeClassroomData } from '@/services/classroomService';
import { getAllSchools, type ClientSafeSchoolData as SchoolData } from '@/services/schoolService';
import { getAllUsers, type ClientSafeUserData } from '@/services/userService';

const lineChartData = [ 
  { date: "2024-01", income: 4000, expenses: 2400 },
  { date: "2024-02", income: 3000, expenses: 1398 },
  { date: "2024-03", income: 2000, expenses: 5800 },
  { date: "2024-04", income: 2780, expenses: 3908 },
  { date: "2024-05", income: 1890, expenses: 4800 },
  { date: "2024-06", income: 2390, expenses: 3800 },
];

const chartConfig = {
  students: { label: "Students", color: "hsl(var(--chart-1))" },
  income: { label: "Income", color: "hsl(var(--chart-2))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-3))" },
};

interface DashboardStats {
  totalStudents: number | string;
  totalTeachers: number | string;
  activeClassrooms: number | string;
  upcomingExams: number | string;
}

interface GeneralAdminStats {
  totalSchools: number;
  totalUsers: number;
  activeSchools: number;
  inactiveSchools: number;
  expectedMonthlyRevenue: number;
  activeSchoolsList: SchoolData[];
  inactiveSchoolsList: SchoolData[];
}


interface ClassroomBarChartData {
  name: string;
  students: number;
}

export default function DashboardOverviewPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: "...",
    totalTeachers: "...",
    activeClassrooms: "...",
    upcomingExams: "5", 
  });
  
  const [generalAdminStats, setGeneralAdminStats] = useState<GeneralAdminStats>({ totalSchools: 0, totalUsers: 0, activeSchools: 0, inactiveSchools: 0, expectedMonthlyRevenue: 0, activeSchoolsList: [], inactiveSchoolsList: [] });
  const [classroomChartData, setClassroomChartData] = useState<ClassroomBarChartData[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isDbError, setIsDbError] = useState(false);
  

  const fetchGeneralAdminData = useCallback(async () => {
    setIsLoadingPageData(true);
    try {
      const [schoolsData, allUsersData] = await Promise.all([
        getAllSchools(),
        getAllUsers(),
      ]);

      if (!schoolsData || !allUsersData) {
        setIsDbError(true);
        return;
      }

      const activeSchoolsList: SchoolData[] = [];
      const inactiveSchoolsList: SchoolData[] = [];

      for (const school of schoolsData) {
        if (school.status === 'active') {
          activeSchoolsList.push(school);
        } else {
          inactiveSchoolsList.push(school);
        }
      }

      setGeneralAdminStats({
        totalSchools: schoolsData.length,
        totalUsers: allUsersData.length,
        activeSchools: activeSchoolsList.length,
        inactiveSchools: inactiveSchoolsList.length,
        expectedMonthlyRevenue: activeSchoolsList.length * 30, // Simplified calculation
        activeSchoolsList,
        inactiveSchoolsList,
      });
    } catch (error) {
      console.error("Failed to fetch general admin data:", error);
      setIsDbError(true);
    } finally {
      setIsLoadingPageData(false);
    }
  }, []);


  const fetchDataForSchool = useCallback(async (schoolId: string) => {
    setIsLoadingPageData(true);
    try {
      const [studentsData, classroomsData, teachersData] = await Promise.all([
        getStudents(schoolId),
        getClassrooms(schoolId),
        getTeachers(schoolId),
      ]);

      if (!classroomsData || !teachersData) {
        setIsDbError(true);
        setStats({ totalStudents: 'N/A', totalTeachers: 'N/A', activeClassrooms: 'N/A', upcomingExams: 'N/A' });
        return;
      }
      
      const studentsList = studentsData || [];

      setStats(prevStats => ({
        ...prevStats,
        totalStudents: studentsList.length,
        totalTeachers: teachersData.length,
        activeClassrooms: classroomsData.length,
      }));

      const newClassroomChartData = classroomsData.map(c => ({
        name: c.name,
        students: studentsList.filter(s => s.gradeApplyingFor === c.name).length,
      }));
      setClassroomChartData(newClassroomChartData);

    } catch (error) {
      console.error("Failed to fetch dashboard data for school:", error);
      setIsDbError(true);
      setStats(prevStats => ({
        ...prevStats,
        totalStudents: "Error",
        totalTeachers: "Error",
        activeClassrooms: "Error",
      }));
    } finally {
      setIsLoadingPageData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    
    if (currentUser?.role === 'main-admin') {
      fetchGeneralAdminData();
    } else if (currentUser?.schoolId) {
      fetchDataForSchool(currentUser.schoolId);
    } else {
      setIsLoadingPageData(false); 
    }
  }, [currentUser, isAuthLoading, fetchGeneralAdminData, fetchDataForSchool]);


  if (isAuthLoading || (!currentUser && !isAuthLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isDbError) {
     return (
        <div className="space-y-6">
            <PageTitle title="Dashboard Overview" description="Welcome to Barasho Hub Management System." />
            <Card className="border-destructive bg-destructive/10">
                <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Database Connection Error</CardTitle></CardHeader>
                <CardContent><p className="text-destructive-foreground">Could not connect to the database. This is likely because the Firebase Admin credentials are not set up correctly on the server. Please contact your system administrator to resolve this issue.</p></CardContent>
            </Card>
        </div>
    );
  }

  const isMainAdmin = currentUser?.role === 'main-admin';

  if (isMainAdmin) {
    return (
      <div className="space-y-6">
        <PageTitle title="Main Administrator Dashboard" description="Welcome, System Administrator. Manage all schools and users from here." />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Schools" value={isLoadingPageData ? <Loader2 className="h-5 w-5 animate-spin"/> : generalAdminStats.totalSchools.toString()} icon={Building} description="All registered schools" />
            <StatCard title="Total Users" value={isLoadingPageData ? <Loader2 className="h-5 w-5 animate-spin"/> : generalAdminStats.totalUsers.toString()} icon={Users} description="All roles included" />
            <StatCard title="Active Subscriptions" value={isLoadingPageData ? <Loader2 className="h-5 w-5 animate-spin"/> : generalAdminStats.activeSchools.toString()} icon={CheckCircle} description="Schools with active plans" />
            <StatCard title="Expected Monthly Revenue" value={isLoadingPageData ? <Loader2 className="h-5 w-5 animate-spin"/> : `$${generalAdminStats.expectedMonthlyRevenue.toFixed(2)}`} icon={TrendingUp} description="Based on active schools" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Active Schools ({generalAdminStats.activeSchools})</CardTitle>
                    <CardDescription>Schools with an active subscription plan.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPageData ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <div className="space-y-4">
                      {generalAdminStats.activeSchoolsList.map(school => (
                        <div key={school.id} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                          <div>
                            <p className="font-semibold">{school.name}</p>
                            <p className="text-sm text-muted-foreground">{school.contactEmail}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/schools">Manage</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Inactive Schools ({generalAdminStats.inactiveSchools})</CardTitle>
                    <CardDescription>Schools with an expired or inactive plan.</CardDescription>
                </CardHeader>
                <CardContent>
                   {isLoadingPageData ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <div className="space-y-4">
                      {generalAdminStats.inactiveSchoolsList.map(school => (
                        <div key={school.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                           <div>
                            <p className="font-semibold">{school.name}</p>
                            <p className="text-sm text-muted-foreground">{school.contactEmail}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/schools">Manage</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }
  
  if (!currentUser?.schoolId && currentUser?.role !== 'main-admin') {
    return (
      <div className="space-y-6">
        <PageTitle title="Dashboard Overview" description="Welcome to Barasho Hub Management System." />
        <Card className="border-destructive bg-destructive/10">
            <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> School Context Error</CardTitle></CardHeader>
            <CardContent><p className="text-destructive-foreground">Your account is not associated with a specific school, or the school context could not be determined. Some data may not be available. Please contact support or ensure your school ID is correctly set up.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser && (currentUser.role === 'student' || currentUser.role === 'parent')) {
    return (
      <div className="space-y-6">
        <PageTitle title={`Welcome, ${currentUser.name || 'User'}!`} description="Here's your personal dashboard for Barasho Hub." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary"><FileText className="h-5 w-5" />My Exam Results</CardTitle>
              <CardDescription>View your exam scores and academic performance.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Access detailed reports for your performance.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/exams">View Exam Results <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />My Timetable</CardTitle>
              <CardDescription>Check your class schedule.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Stay informed about your classes and activities.
              </p>
            </CardContent>
             <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/timetable">View Timetable <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />School Announcements</CardTitle>
              <CardDescription>Stay updated with the latest news from the school.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
            </CardContent>
             <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/announcements">View Announcements <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard Overview" description={`Welcome to Barasho Hub Management System${currentUser?.schoolName ? ` for ${currentUser.schoolName}` : ''}.`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={isLoadingPageData ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalStudents.toString()} icon={Users} description="+20 since last month" />
        <StatCard title="Total Teachers" value={isLoadingPageData ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalTeachers.toString()} icon={UserCircle} description="+2 this quarter" />
        <StatCard title="Active Classrooms" value={isLoadingPageData ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.activeClassrooms.toString()} icon={BookOpen} description="All active classes" />
        <StatCard title="Upcoming Exams" value={stats.upcomingExams.toString()} icon={ClipboardCheck} description="Next exam in 3 days" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Students per Classroom
            </CardTitle>
            <CardDescription>Distribution of students across active classrooms{currentUser?.schoolName ? ` for ${currentUser.schoolName}` : ''}.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPageData ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : classroomChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <RechartsBarChart data={classroomChartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="students" fill="var(--color-students)" radius={4} />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
               <p className="text-center text-muted-foreground py-10">No classroom data available for chart{currentUser?.schoolName ? ` for ${currentUser.schoolName}` : ''}.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Financial Overview
            </CardTitle>
            <CardDescription>Monthly income vs. expenses. (Static Data)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
               <RechartsLineChart data={lineChartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Line dataKey="income" type="monotone" stroke="var(--color-income)" strokeWidth={2} dot={true} />
                <Line dataKey="expenses" type="monotone" stroke="var(--color-expenses)" strokeWidth={2} dot={true} />
              </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
