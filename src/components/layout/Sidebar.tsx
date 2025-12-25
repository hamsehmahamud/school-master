
'use client';

import Link from 'next/link';
import { School } from 'lucide-react';
import { AppNav } from './AppNav';

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background shadow-lg md:flex no-scrollbar">
      <div className="flex h-20 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <School className="h-7 w-7" />
          <span>Barasho Hub</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AppNav />
      </div>
    </aside>
  );
}
