
'use client';

import * as React from 'react';
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Edit, Trash2, MoreHorizontal, UserCog, Shield, Briefcase, GraduationCap, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, deleteUserByEmail, type ClientSafeUserData } from '@/services/userService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { UserRole } from '@/config/permissions';
import { Badge } from '@/components/ui/badge';
import { PermissionsDisplay } from '@/components/shared/PermissionsDisplay';

const roleIcons: Record<UserRole, React.ElementType> = {
  'main-admin': UserCog,
  'admin': Shield,
  'teacher': Briefcase,
  'student': GraduationCap,
  'parent': Users,
};

export default function UserManagementPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [users, setUsers] = React.useState<ClientSafeUserData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<ClientSafeUserData | null>(null);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<UserRole | 'all'>('all');

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUsers();
      let usersToDisplay = fetchedUsers;
      // If the current user is a school admin, only show users from their school
      if (currentUser?.role === 'admin' && currentUser.schoolId) {
        usersToDisplay = fetchedUsers.filter(u => u.schoolId === currentUser.schoolId);
      }
      setUsers(usersToDisplay);
    } catch (error: any) {
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentUser]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async () => {
    if (!userToDelete || !userToDelete.email) {
      toast({ title: "Error", description: "User email is missing, cannot delete.", variant: "destructive" });
      return;
    }
    setIsDeleting(true);
    try {
      await deleteUserByEmail(userToDelete.email);
      toast({ title: "Success", description: `User "${userToDelete.name || userToDelete.email}" has been deleted.` });
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to delete user: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.appId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <PageTitle title="User Management" description="View, manage, and assign permissions to all users." />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>All System Users</CardTitle>
              <CardDescription>Total Users: {filteredUsers.length}</CardDescription>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                placeholder="Search by name, email, school, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Filter by Role
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Role</DropdownMenuLabel>
                  <DropdownMenuSeparator/>
                  <DropdownMenuCheckboxItem checked={roleFilter === 'all'} onCheckedChange={() => setRoleFilter('all')}>All</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={roleFilter === 'main-admin'} onCheckedChange={() => setRoleFilter('main-admin')}>Main Admin</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={roleFilter === 'admin'} onCheckedChange={() => setRoleFilter('admin')}>Admin</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={roleFilter === 'teacher'} onCheckedChange={() => setRoleFilter('teacher')}>Teacher</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={roleFilter === 'student'} onCheckedChange={() => setRoleFilter('student')}>Student</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={roleFilter === 'parent'} onCheckedChange={() => setRoleFilter('parent')}>Parent</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role & Permissions</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>App ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const RoleIcon = roleIcons[user.role] || Users;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{user.email || 'No Email'}</div>
                      </TableCell>
                       <TableCell>
                        <Badge variant="secondary" className="capitalize flex items-center gap-1.5 w-fit">
                          <RoleIcon className="h-3.5 w-3.5" />
                          {user.role}
                        </Badge>
                        <PermissionsDisplay role={user.role} />
                      </TableCell>
                      <TableCell>{user.schoolName || 'Global'}</TableCell>
                      <TableCell className="font-mono text-xs">{user.appId || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setUserToDelete(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{userToDelete?.name || userToDelete?.email}</strong> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
