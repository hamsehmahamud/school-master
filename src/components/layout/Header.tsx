
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Moon, Sun, UserCircle, LogOut, LayoutDashboard, Settings, Menu, School } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppNav } from './AppNav';

export function Header() {
  const { setTheme, theme } = useTheme();
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const isMainAdmin = currentUser?.role === 'admin' && !currentUser.schoolId;
  const displayRole = isMainAdmin ? 'Main Administrator' : (currentUser?.role?.charAt(0).toUpperCase() ?? '') + (currentUser?.role?.slice(1) ?? 'User');


  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 sticky top-0 z-30">
       <div className="flex items-center gap-4 md:hidden">
         <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
                <SheetHeader className="h-20 flex flex-row items-center border-b px-6">
                    <SheetTitle className="sr-only">Main Navigation</SheetTitle>
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                        <School className="h-7 w-7" />
                        <span>Barasho Hub</span>
                    </Link>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                   <AppNav />
                </div>
            </SheetContent>
         </Sheet>
       </div>

      <div className="flex w-full items-center justify-end gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <UserCircle className="h-8 w-8" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name || currentUser.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayRole}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/profile"><Settings className="mr-2 h-4 w-4" /> Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
