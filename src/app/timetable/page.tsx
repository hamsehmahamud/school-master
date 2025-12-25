
'use client';

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays } from "lucide-react";

// Placeholder data for the timetable
const timetableData = {
  "Monday": ["Mathematics", "Science", "Break", "English", "History"],
  "Tuesday": ["Science", "History", "Break", "Geography", "Art"],
  "Wednesday": ["English", "Mathematics", "Break", "Physical Education", "Science"],
  "Thursday": ["History", "Geography", "Break", "English", "Mathematics"],
  "Friday": ["Art", "Physical Education", "Break", "Science", "English"],
};

const timeSlots = ["8:00 - 9:00", "9:00 - 10:00", "10:00 - 10:30", "10:30 - 11:30", "11:30 - 12:30"];
const days = Object.keys(timetableData);

export default function TimetablePage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Class Timetable" 
        description="View the weekly schedule for your classes. (Placeholder)" 
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
             <CalendarDays className="h-6 w-6 text-primary" />
             <div>
                <CardTitle>Weekly Schedule for Grade 5A</CardTitle>
                <CardDescription>
                  This is a sample timetable. Future versions will allow dynamic selection of classes and display real-time data.
                </CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Time</TableHead>
                  {days.map(day => <TableHead key={day}>{day}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots.map((time, timeIndex) => (
                  <TableRow key={time}>
                    <TableCell className="font-medium bg-muted/50">{time}</TableCell>
                    {days.map(day => {
                      const subject = timetableData[day as keyof typeof timetableData][timeIndex];
                      return (
                        <TableCell key={`${day}-${time}`} className={subject === "Break" ? "bg-amber-100 dark:bg-amber-900/30 font-semibold" : ""}>
                          {subject}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
