import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, 
  Search, 
  User as UserIcon, 
  Check,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Mail
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';

const AVAILABLE_PERMISSIONS = [
  { id: 'view_dashboard', label: 'View Dashboard' },
  { id: 'manage_inventory', label: 'Manage Inventory' },
  { id: 'manage_sales', label: 'Manage Sales' },
  { id: 'manage_expenditures', label: 'Manage Expenditures' },
  { id: 'manage_employees', label: 'Manage Employees' },
  { id: 'manage_transactions', label: 'View Transactions' },
  { id: 'delete_transactions', label: 'Delete Transactions' },
  { id: 'delete_sales', label: 'Delete Sales History' },
  { id: 'delete_inventory', label: 'Delete Inventory' },
  { id: 'delete_expenditures', label: 'Delete Expenditures' },
  { id: 'delete_employees', label: 'Delete Employees' },
  { id: 'manage_users', label: 'Manage Users (Admin)' },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    // Only fetch if user is admin, otherwise this might fail due to security rules
    enabled: !!currentUser && currentUser.role === 'admin'
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }) => 
      base44.entities.User.update(userId, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User permissions updated");
    },
    onError: () => {
      toast.error("Failed to update permissions");
    }
  });

  const handlePermissionChange = (userId, currentPermissions, permissionId, checked) => {
    const newPermissions = checked
      ? [...(currentPermissions || []), permissionId]
      : (currentPermissions || []).filter(p => p !== permissionId);
    
    updatePermissionsMutation.mutate({ userId, permissions: newPermissions });
  };

  const handleInviteUser = () => {
    toast.info("Invite Users via Dashboard", {
      description: "To add new users, please use the 'Invite User' feature in your Base44 App Dashboard settings.",
      duration: 6000,
      icon: <Mail className="w-4 h-4" />
    });
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(search.toLowerCase()) || 
    (user.full_name && user.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) {
    return <div className="p-8 text-center">Loading users...</div>;
  }

  if (error || (currentUser && currentUser.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">Only administrators can manage users and permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Define access rights and permissions for system users.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search users..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={handleInviteUser} className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredUsers.map(user => (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50/50 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{user.full_name || 'Unnamed User'}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
                <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Permissions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const hasPermission = (user.permissions || []).includes(perm.id);
                  const isUpdating = updatePermissionsMutation.isPending && updatePermissionsMutation.variables?.userId === user.id;
                  
                  // Admins implicitly have all permissions usually, but here we allow explicit control
                  // Except manage_users which is tied to admin role
                  const isDisabled = user.role === 'admin' && perm.id === 'manage_users'; 

                  return (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`${user.id}-${perm.id}`} 
                        checked={hasPermission || (user.role === 'admin' && perm.id === 'manage_users')}
                        disabled={isDisabled || isUpdating}
                        onCheckedChange={(checked) => handlePermissionChange(user.id, user.permissions, perm.id, checked)}
                      />
                      <label 
                        htmlFor={`${user.id}-${perm.id}`} 
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${hasPermission ? 'text-gray-900' : 'text-gray-500'}`}
                      >
                        {perm.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <p className="text-gray-500">No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}