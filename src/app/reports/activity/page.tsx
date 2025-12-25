
'use client';

import * as React from 'react';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, UserMinus, CalendarOff, CheckCircle, XCircle, Wallet, Briefcase, FileWarning, Loader2, Search, Check, X, Clock, UserCheck, UserX, Building2, BookCopy } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getStudents, type ClientSafeStudentData } from '@/services/studentService';
import { getClassrooms, type ClientSafeClassroomData } from '@/services/classroomService';
import { getTeachers } from '@/services/teacherService';
import { getAttendanceForDate, type AttendanceStatus } from '@/services/attendanceService';
import { motion } from 'framer-motion';

const StatItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  bgColor: string;
  iconColor: string;
  gridClass?: string;
}> = ({ icon: Icon, label, value, bgColor, iconColor, gridClass = '' }) => (
  <motion.div
    className={`p-4 rounded-lg flex items-center shadow-md ${bgColor} ${gridClass}`}
    whileHover={{ scale: 1.05 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <Icon className={`h-8 w-8 mr-4 ${iconColor}`} />
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </motion.div>
);

const AttendanceStat: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;
}> = ({ icon: Icon, label, value, colorClass }) => (
    <div className={`p-3 bg-${colorClass}-100 dark:bg-${colorClass}-900/40 rounded-lg flex flex-col items-center justify-center`}>
        <Icon className={`h-7 w-7 text-${colorClass}-600 dark:text-${colorClass}-300 mb-1`}/>
        <p className={`text-xs font-semibold text-${colorClass}-800 dark:text-${colorClass}-200`}>{label}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);


export default function ActivityDashboardPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);

  const [studentCount, setStudentCount] = React.useState(0);
  const [classroomCount, setClassroomCount] = React.useState(0);
  const [teacherCount, setTeacherCount] = React.useState(0);
  const [classrooms, setClassrooms] = React.useState<ClientSafeClassroomData[]>([]);
  const [attendanceSummary, setAttendanceSummary] = React.useState<Record<AttendanceStatus, number>>({
      present: 0, absent: 0, late: 0
  });

  const schoolId = currentUser?.schoolId;

  React.useEffect(() => {
    async function fetchData() {
      if (!schoolId) {
        if (!isAuthLoading) toast({ title: "Error", description: "School context is missing.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [studentsData, classroomsData, teachersData] = await Promise.all([
          getStudents(schoolId),
          getClassrooms(schoolId),
          getTeachers(schoolId),
        ]);
        
        setStudentCount(studentsData.length);
        setClassroomCount(classroomsData.length);
        setTeacherCount(teachersData.length);
        setClassrooms(classroomsData);

        const today = new Date();
        const attendancePromises = classroomsData.map(c => getAttendanceForDate(schoolId, c.id, today));
        const allAttendanceRecords = await Promise.all(attendancePromises);

        const summary: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0 };
        allAttendanceRecords.flat().forEach(record => {
            if (record) {
                Object.values(record.statuses).forEach(status => {
                    if (summary[status] !== undefined) {
                        summary[status]++;
                    }
                });
            }
        });
        setAttendanceSummary(summary);

      } catch (error: any) {
        toast({ title: "Error Loading Dashboard", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    if(!isAuthLoading) fetchData();
  }, [schoolId, isAuthLoading, toast]);
  

  const studentStats = {
    new: 10,
    onLeave: 7,
    paid: studentCount - 58,
    unpaid: 49,
    free: 9,
    expelled: 21,
    left: 2,
  };
  
  const staffStats = {
    salary: "$2,200.00",
    paid: teacherCount - 1,
    unpaid: 1,
  };

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
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageTitle title="Warbixinta Dhaqdhaqaaqa Maalinlaha Ah" description="Daily Activity Report" />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader><CardTitle className="text-lg font-bold text-center">Xogta Tirada Ardayda (Student Count Data)</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 grid-rows-3 gap-4">
                    <StatItem label="Wadarta Guud" value={studentCount} icon={Users} bgColor="bg-blue-100 text-blue-800" iconColor="text-blue-600" />
                    <StatItem label="Wadarta Fasalada" value={classroomCount} icon={Building2} bgColor="bg-purple-100 text-purple-800" iconColor="text-purple-600" />
                    <StatItem label="Ardayda Fasaxa ku Maqan" value={studentStats.onLeave} icon={CalendarOff} bgColor="bg-yellow-100 text-yellow-800" iconColor="text-yellow-600" />

                    <StatItem label="Ardayda Cusub" value={studentStats.new} icon={UserPlus} bgColor="bg-cyan-100 text-cyan-800" iconColor="text-cyan-600" />
                    <StatItem label="Ardayda Lacagta Bixisay" value={studentStats.paid} icon={Wallet} bgColor="bg-green-100 text-green-800" iconColor="text-green-600" gridClass="col-span-1 row-span-1 transform scale-110 shadow-lg z-10" />
                    <StatItem label="Ardayda Aan Lacagta Bixin" value={studentStats.unpaid} icon={Wallet} bgColor="bg-orange-100 text-orange-800" iconColor="text-orange-600" />

                    <StatItem label="Ardayda Ka Baxday" value={studentStats.left} icon={UserMinus} bgColor="bg-pink-100 text-pink-800" iconColor="text-pink-600" />
                    <StatItem label="Ardayda Bilaashka ah" value={studentStats.free} icon={CheckCircle} bgColor="bg-indigo-100 text-indigo-800" iconColor="text-indigo-600" />
                    <StatItem label="Ardayda Laga Eryay" value={studentStats.expelled} icon={FileWarning} bgColor="bg-red-100 text-red-800" iconColor="text-red-600" />
                </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader><CardTitle className="text-lg font-bold text-center">Imaanshaha Ardayda (Student Attendance)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6 text-center">
                  <AttendanceStat icon={UserCheck} label="Jooga" value={attendanceSummary.present} colorClass="green" />
                  <AttendanceStat icon={UserX} label="Maqan" value={attendanceSummary.absent} colorClass="red" />
                  <AttendanceStat icon={Clock} label="Habsan" value={attendanceSummary.late} colorClass="yellow" />
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex flex-col items-center justify-center opacity-60">
                    <UserPlus className="h-7 w-7 text-blue-600 dark:text-blue-300 mb-1"/>
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">Fasax</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex flex-col items-center justify-center opacity-60">
                     <UserPlus className="h-7 w-7 text-purple-600 dark:text-purple-300 mb-1"/>
                    <p className="text-xs font-semibold text-purple-800 dark:text-purple-200">Buka</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-700/40 rounded-lg flex flex-col items-center justify-center opacity-60">
                     <UserMinus className="h-7 w-7 text-gray-600 dark:text-gray-300 mb-1"/>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Off</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fasal (Class)</TableHead>
                      <TableHead className="text-center">Jooga (Present)</TableHead>
                      <TableHead className="text-center">Maqan (Absent)</TableHead>
                      <TableHead className="text-center">Wadarta Ardayda (Total)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classrooms.map((c, index) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">{c.studentCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
            <Card className="border-2 border-dashed border-primary/20">
                <CardHeader><CardTitle className="text-lg font-bold text-center">Xogta Shaqaalaha (Staff Data)</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatItem icon={Briefcase} label="Wadarta Shaqaalaha" value={teacherCount} bgColor="bg-cyan-100 text-cyan-800" iconColor="text-cyan-500" />
                        <StatItem icon={Wallet} label="Wadarta Mushaarka" value={staffStats.salary} bgColor="bg-lime-100 text-lime-800" iconColor="text-lime-600" />
                        <StatItem icon={CheckCircle} label="Shaqaalaha La Bixiyay" value={staffStats.paid} bgColor="bg-green-100 text-green-800" iconColor="text-green-500" />
                        <StatItem icon={XCircle} label="Shaqaalaha Aan La Bixin" value={staffStats.unpaid} bgColor="bg-red-100 text-red-800" iconColor="text-red-500" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
            <Card className="border-2 border-dashed border-primary/20">
                <CardHeader><CardTitle className="text-lg font-bold text-center">Xogta Kiisoska (Incidents Data)</CardTitle></CardHeader>
                 <CardContent>
                  <p className="text-center text-muted-foreground p-8">No incident data available for today.</p>
                </CardContent>
            </Card>
        </motion.div>
        
      </motion.div>
      )}
    </div>
  );
}

    