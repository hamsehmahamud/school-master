
'use client';

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookCopy } from "lucide-react";

export default function SubjectsPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="School Subjects" 
        description="This feature is under construction." 
      />
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <BookCopy className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Subjects Management</CardTitle>
          <CardDescription>
            This section will allow administrators to manage the subjects offered by the school, assign them to grades, and link them to teachers.
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
