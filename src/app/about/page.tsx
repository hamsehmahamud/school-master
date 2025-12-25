
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Ku Saabsan Barasho Hub" 
        description="Learn more about our mission, vision, and the team dedicated to revolutionizing school management." 
      />

      <Card className="overflow-hidden shadow-lg">
        <div className="relative h-48 w-full">
          <Image
            src="https://picsum.photos/seed/about/1200/400"
            alt="About Barasho Hub"
            fill
            objectFit="cover"
            data-ai-hint="team collaboration office"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
          </div>
        </div>
        <CardContent className="p-6 text-lg text-foreground/80">
          <p>
            To empower educational institutions with a comprehensive, intuitive, and modern management system. 
            Barasho Hub is designed to streamline administrative tasks, enhance communication, and provide valuable insights, 
            allowing educators to focus on what matters most: student success.
          </p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Users className="h-8 w-8 text-primary" />
            <CardTitle>For Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Access timetables, exam results, and school announcements with ease. Stay connected with your academic journey.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <BookOpen className="h-8 w-8 text-primary" />
            <CardTitle>For Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Manage classrooms, enter grades, and track student progress effortlessly. Spend more time teaching, less time on paperwork.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <CardTitle>For Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Oversee all school operations, from student enrollment to financial reporting, with a powerful and centralized dashboard.
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
