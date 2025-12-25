
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Info, ChevronLeft, ArrowRight } from "lucide-react";
import Image from "next/image";

interface Announcement {
  id: string;
  title: string;
  date: string;
  summary: string;
  imageUrl?: string;
  imageHint?: string;
}

const sampleAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Mid-Term Exams Schedule Released",
    date: "October 26, 2024",
    summary: "The schedule for the upcoming mid-term examinations has been released. Please check the notice board or the exams section for details.",
    imageUrl: "https://picsum.photos/seed/exams/600/400",
    imageHint: "exam schedule"
  },
  {
    id: "2",
    title: "Annual Sports Day Postponed",
    date: "October 24, 2024",
    summary: "Due to unforeseen weather conditions, the Annual Sports Day has been postponed. New dates will be announced soon.",
    imageUrl: "https://picsum.photos/seed/sports/600/400",
    imageHint: "sports day children"
  },
  {
    id: "3",
    title: "Parent-Teacher Meeting Next Week",
    date: "October 20, 2024",
    summary: "A parent-teacher meeting is scheduled for all grades next Saturday. We encourage all parents to attend and discuss their child's progress.",
    imageUrl: "https://picsum.photos/seed/meeting/600/400",
    imageHint: "meeting conference"
  },
];

export default function AnnouncementsPage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageTitle title="School Announcements" description="Stay updated with the latest news, events, and important notices from Barasho Hub." />
        <Button variant="outline" onClick={() => router.back()} className="h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all group">
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sampleAnnouncements.map((announcement) => (
          <Card key={announcement.id} className="flex flex-col group overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary">
            {announcement.imageUrl && (
              <div className="relative h-48 w-full">
                <Image
                  src={announcement.imageUrl}
                  alt={announcement.title}
                  fill
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={announcement.imageHint || "general announcement"}
                />
              </div>
            )}
            <CardHeader>
              <CardDescription className="text-xs">
                Posted on: {announcement.date}
              </CardDescription>
              <CardTitle className="flex items-start gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                {announcement.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {announcement.summary}
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full justify-start text-primary" disabled>
                Read More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-800 dark:text-blue-300">
            <Info className="h-5 w-5" />
            Feature Under Development
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 dark:text-blue-300/80">
            This announcements page is currently a placeholder. In a future version, announcements will be dynamically fetched from the database and managed through an administrative interface.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
