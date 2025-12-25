
'use client';

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function RegistrationReportsPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Registration Reports" 
        description="This feature is under construction." 
      />
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <UserPlus className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="mt-4">Student and Teacher Registration Analytics</CardTitle>
          <CardDescription>
            This section will provide reports on registration trends, demographics, and other enrollment data.
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
