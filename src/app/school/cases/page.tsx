
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Printer, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Case {
  id: string;
  studentName: string;
  date: string;
  caseType: string;
  class: string;
  createdBy: string;
  details: string;
}

const sampleCases: Case[] = [
  // Initially empty, matching the design
];

export default function CasesPage() {
  const [cases, setCases] = React.useState<Case[]>(sampleCases);

  return (
    <div className="space-y-6">
      <Card className="p-4 border-dashed">
        <CardHeader className="text-center mb-4">
          <h1 className="text-2xl font-bold">Xogta Kiisaska</h1>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Select defaultValue="daily">
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full max-w-[150px]">
                <Input type="text" defaultValue="7/17/2025" className="pl-8" />
                <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Dooro Fasal" />
                </SelectTrigger>
                <SelectContent>
                  {/* Classroom options would be populated here */}
                  <SelectItem value="grade1">Grade 1A</SelectItem>
                  <SelectItem value="grade2">Grade 2B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Abuur Kiis
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Total: ({cases.length})</span>
                <Button variant="ghost" size="icon">
                  <Printer className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Magaca Ardayga</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Nooca Kiiska</TableHead>
                  <TableHead>Fasal</TableHead>
                  <TableHead>Abuuray</TableHead>
                  <TableHead>Faahfaahin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No cases have been reported yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((c, index) => (
                    <TableRow key={c.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{c.id}</TableCell>
                      <TableCell>{c.studentName}</TableCell>
                      <TableCell>{c.date}</TableCell>
                      <TableCell>{c.caseType}</TableCell>
                      <TableCell>{c.class}</TableCell>
                      <TableCell>{c.createdBy}</TableCell>
                      <TableCell>{c.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
