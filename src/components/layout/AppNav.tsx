
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    School, LayoutDashboard, Users, GraduationCap, Briefcase, DollarSign, 
    BarChart, Settings, UserCog, Info, FileText, CalendarDays, 
    Megaphone, Banknote, FilePlus2, UserPlus, BookCopy, Building2, AlertOctagon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/config/permissions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[] | 'all';
  subLinks?: NavLink[];
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: 'all' },
  
  // --- Main Admin ---
  { 
    href: '/admin', label: 'System Admin', icon: UserCog, roles: ['main-admin'],
    subLinks: [
      { href: '/admin/schools', label: 'Manage Schools', icon: Building2, roles: ['main-admin'] },
      { href: '/users', label: 'User Management', icon: Users, roles: ['main-admin'] },
    ]
  },

  // --- Diwaangalinta (Registration) ---
  {
    href: '/registration', label: 'Diwaangalinta', icon: UserPlus, roles: ['admin'],
    subLinks: [
      { href: '/registration/new-student', label: 'Arday Cusub', icon: GraduationCap, roles: ['admin'] },
      { href: '/students', label: 'Liiska Ardayda', icon: Users, roles: ['admin'] },
      { href: '/teachers/add-teacher', label: 'Macalin Cusub', icon: Briefcase, roles: ['admin'] },
      { href: '/teachers', label: 'Liiska Macalimiinta', icon: Users, roles: ['admin'] },
    ]
  },

  // --- Dugsiga (School) ---
  { 
    href: '/school', label: 'Dugsiga', icon: School, roles: ['admin', 'teacher'],
    subLinks: [
      { href: '/school/classrooms', label: 'Fasal (Classrooms)', icon: Users, roles: ['admin', 'teacher'] },
      { href: '/school/staff', label: 'Shaqaalaha (Staff)', icon: Briefcase, roles: ['admin'] },
      { href: '/school/subjects', label: 'Maado (Subjects)', icon: BookCopy, roles: ['admin'] },
      { href: '/school/departments', label: 'Qismi (Departments)', icon: Building2, roles: ['admin'] },
      { href: '/school/cases', label: 'Kiisas (Cases)', icon: AlertOctagon, roles: ['admin'] },
      { href: '/timetable', label: 'Jadwalka', icon: CalendarDays, roles: ['student', 'parent', 'teacher', 'admin'] },
      { href: '/announcements', label: 'Ogeysiisyada', icon: Megaphone, roles: ['student', 'parent', 'teacher', 'admin'] },
    ]
  },
  
  // --- Imtixaano (Exams) ---
  { 
    href: '/exams', label: 'Imtixaano', icon: GraduationCap, roles: ['admin', 'teacher', 'student', 'parent'],
    subLinks: [
      { href: '/exams', label: 'Exams Dashboard', icon: BarChart, roles: ['admin', 'teacher', 'student', 'parent'] },
      { href: '/exams/enter-results', label: 'Enter Results', icon: FilePlus2, roles: ['admin', 'teacher']},
    ]
  },
  
  // --- Maaliyadda (Finance) ---
  {
    href: '/finance', label: 'Maaliyadda', icon: DollarSign, roles: ['admin'],
    subLinks: [
        { href: '/finance', label: 'Financial Overview', icon: LayoutDashboard, roles: ['admin'] },
        { href: '/finance/student-payments', label: 'Student Payments', icon: FilePlus2, roles: ['admin'] },
        { href: '/finance/monthly-report', label: 'Monthly Report', icon: FileText, roles: ['admin'] },
        { href: '/finance/income-statement', label: 'Income Statement', icon: FileText, roles: ['admin'] },
    ]
  },

  // --- Warbixino (Reports) ---
  { 
    href: '/reports', label: 'Warbixino', icon: BarChart, roles: ['admin']
  },

  // --- Isticmaalayaasha (User Management) & Settings ---
  { 
    href: '/settings', label: 'Settings', icon: Settings, roles: 'all',
    subLinks: [
        { href: '/profile', label: 'My Profile', icon: Settings, roles: 'all' },
        { href: '/users', label: 'Maamul Isticmaal', icon: Users, roles: ['admin'] },
        { href: '/about', label: 'About', icon: Info, roles: 'all' },
        { href: '/pricing', label: 'Pricing', icon: Banknote, roles: 'all' },
    ]
  },
];

const SidebarNavLink = ({ href, label, icon: Icon }: { href:string; label:string; icon:React.ElementType }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-primary',
        isActive && 'bg-primary/10 text-primary font-semibold'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};


export function AppNav() {
  const { currentUser } = useAuth();
  const pathname = usePathname();

  const isUserRole = (roles: UserRole[] | 'all'): boolean => {
    if (!currentUser) return false;
    if (roles === 'all') return true;

    const isMainAdmin = currentUser.role === 'admin' && !currentUser.schoolId;
    if (isMainAdmin) {
      return roles.includes('main-admin');
    }
    
    return roles.includes(currentUser.role);
  };
  
  const getVisibleLinks = () => navLinks.filter(link => isUserRole(link.roles));

  const defaultOpenValue = getVisibleLinks().find(link => link.subLinks?.some(sub => pathname.startsWith(sub.href)))?.href;

  return (
    <Accordion type="single" collapsible className="w-full p-2" defaultValue={defaultOpenValue}>
      {getVisibleLinks().map((link) => {
        const visibleSubLinks = link.subLinks?.filter(sublink => isUserRole(sublink.roles));
        
        const isParentActive = visibleSubLinks?.some(sub => pathname.startsWith(sub.href));

        return (visibleSubLinks && visibleSubLinks.length > 0) ? (
          <AccordionItem value={link.href} key={link.href} className="border-b-0 mb-1">
            <AccordionTrigger className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-foreground/80 transition-all hover:bg-muted hover:text-primary hover:no-underline [&[data-state=open]]:bg-muted/50",
              isParentActive && 'bg-primary/10 text-primary'
            )}>
               <div className="flex items-center gap-3">
                <link.icon className="h-5 w-5" />
                {link.label}
               </div>
            </AccordionTrigger>
            <AccordionContent className="pl-6 pt-1 space-y-1">
              {visibleSubLinks.map(sublink => (
                 <SidebarNavLink key={sublink.href} {...sublink} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ) : (
           <div className="px-1 py-1" key={link.href}>
              <SidebarNavLink {...link} />
           </div>
        )
      })}
    </Accordion>
  );
}
