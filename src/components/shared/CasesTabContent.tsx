
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Check, Info } from 'lucide-react';

const sampleCases = [
  { id: 1, studentName: 'Student One', date: '2024-05-10', issue: 'Incomplete homework submission.', status: 'Resolved' },
  { id: 2, studentName: 'Student Two', date: '2024-05-12', issue: 'Disruptive behavior during science class.', status: 'Pending' },
];

export function CasesTabContent() {
  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <CardTitle>Student Cases</CardTitle>
                  <CardDescription>Track and manage student incidents and behavioral issues.</CardDescription>
              </div>
              <Button disabled><PlusCircle className="mr-2 h-4 w-4"/> Report New Case</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sampleCases.length > 0 ? sampleCases.map(c => (
              <motion.div key={c.id} whileHover={{ scale: 1.02 }} className="border p-4 rounded-lg flex items-start justify-between gap-4 bg-card hover:bg-muted/50 transition-colors">
                  <div>
                      <p className="font-semibold">{c.studentName}</p>
                      <p className="text-sm text-muted-foreground">{c.issue}</p>
                      <p className="text-xs text-muted-foreground mt-1">Reported on: {c.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                      <Badge variant={c.status === 'Resolved' ? 'default' : 'secondary'} className={c.status === 'Resolved' ? 'bg-green-600' : 'bg-yellow-500 text-black'}>
                          {c.status === 'Resolved' ? <Check className="mr-1 h-3 w-3"/> : <Info className="mr-1 h-3 w-3"/> }
                          {c.status}
                      </Badge>
                      <Button variant="ghost" size="sm" disabled>View Details</Button>
                  </div>
              </motion.div>
          )) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
               <p className="text-muted-foreground">No cases reported for this classroom yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
