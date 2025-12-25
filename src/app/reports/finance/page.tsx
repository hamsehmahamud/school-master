
'use client';

import * as React from 'react';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


export default function FinanceReportsPage() {

  // This is placeholder data. In a real application, you would fetch this from your backend.
  const reports = [
    { id: 'Q1-2024', title: 'Q1 2024 Financial Summary', date: '2024-04-05', type: 'Quarterly' },
    { id: 'MAR-2024', title: 'March 2024 Expense Report', date: '2024-04-02', type: 'Monthly' },
    { id: 'Q4-2023', title: 'Q4 2023 Financial Summary', date: '2024-01-08', type: 'Quarterly' },
    { id: 'FY-2023', title: 'Fiscal Year 2023 Full Report', date: '2024-01-15', type: 'Annual' },
  ]

  return (
    <div className="space-y-6">
      <PageTitle title="Financial Reports" description="Access and download generated financial reports." />
      
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            This is a placeholder page for financial reports. Functionality to generate and download reports will be implemented in a future version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Generated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
