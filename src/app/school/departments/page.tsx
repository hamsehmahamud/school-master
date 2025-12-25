
'use client';

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function DepartmentsPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="School Departments" 
        description="This feature is under construction." 
      />
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <Building2 className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="mt-4">Departments Management</CardTitle>
          <CardDescription>
            This section will allow administrators to define and manage various school departments, such as Academics, Administration, and Finance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Please check back later for updates on this feature.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
