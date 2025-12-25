
'use client';

import { permissions, type UserRole } from '@/config/permissions';
import { Check } from 'lucide-react';
import * as React from 'react';

interface PermissionsDisplayProps {
  role: UserRole;
}

export const PermissionsDisplay: React.FC<PermissionsDisplayProps> = ({ role }) => {
  const rolePermissions = permissions[role]?.static || [];
  
  if (rolePermissions.length === 0) {
    return <p className="text-xs text-muted-foreground mt-1">No specific permissions defined.</p>;
  }

  // To make it more readable, let's just show a few.
  const displayPermissions = rolePermissions.slice(0, 3);
  const remainingCount = rolePermissions.length - displayPermissions.length;

  return (
    <div className="mt-2 space-y-1">
      {displayPermissions.map(permission => (
        <div key={permission} className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-xs text-muted-foreground capitalize">{permission.replace(':', ' ')}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground italic">+ {remainingCount} more...</p>
      )}
    </div>
  );
};
