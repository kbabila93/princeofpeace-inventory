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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';

const PAGE_PERMISSIONS = [
  { id: 'page_dashboard', label: 'Dashboard' },
  { id: 'page_quick_sale', label: 'Quick Sale' },
  { id: 'page_sales', label: 'Sales' },
  { id: 'page_sales_by_sections', label: 'Sales by Section' },
  { id: 'page_product_sales_report', label: 'Product Sales Report' },
  { id: 'page_expenditures', label: 'Expenditures' },
  { id: 'page_inventory', label: 'Inventory' },
  { id: 'page_inventory_sections', label: 'Sections View' },
  { id: 'page_damaged_inventory', label: 'Damaged Inventory' },
  { id: 'page_employees', label: 'Employees' },
  { id: 'page_customers', label: 'Customers' },
  { id: 'page_suppliers', label: 'Suppliers' },
  { id: 'page_transactions', label: 'Transactions' },
  { id: 'page_orders', label: 'Customer Orders' },
  { id: 'page_customer_shop', label: 'Customer Shop Link' },
  { id: 'page_shop_customization', label: 'Shop Customization' },
  { id: 'page_business_analytics', label: 'Business Analytics' },
  { id: 'page_meetings', label: 'Meetings' },
  { id: 'page_marketing', label: 'Marketing' },
  { id: 'page_shop_gallery', label: 'Shop Gallery' },
  { id: 'page_announcements', label: 'Announcements' },
  { id: 'delete_transactions', label: 'Delete Transactions' },
  { id: 'delete_sales', label: 'Delete Sales History' },
  { id: 'delete_inventory', label: 'Delete Inventory' },
  { id: 'delete_expenditures', label: 'Delete Expenditures' },
  { id: 'delete_employees', label: 'Delete Employees' },
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
      base44.functions.invoke('updateUserAccess', { userId, permissions }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User permissions updated");
    },
    onError: (err) => {
      console.error("Permission update error:", err);
      toast.error("Failed to update permissions", {
        description: err?.response?.data?.error || err?.message || "Unknown error"
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => 
      base44.functions.invoke('updateUserAccess', { userId, role }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User role updated");
    },
    onError: (err) => {
      toast.error("Failed to update user role", {
        description: err?.response?.data?.error || err?.message || "Unknown error"
      });
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
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    {user.last_seen && (new Date() - new Date(user.last_seen) < 5 * 60 * 1000) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" title="Online"></span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {user.full_name || 'Unnamed User'}
                      {user.last_seen && (new Date() - new Date(user.last_seen) < 5 * 60 * 1000) ? (
                        <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Online</span>
                      ) : (
                        <span className="text-xs font-normal text-gray-400">
                          {user.last_seen ? `Last seen ${new Date(user.last_seen).toLocaleDateString()} ${new Date(user.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Offline'}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
                <Select
                  value={user.role}
                  onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                  disabled={updateRoleMutation.isPending && updateRoleMutation.variables?.userId === user.id || currentUser?.id === user.id}
                >
                  <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="cursor-pointer">
                    {user.role}
                  </Badge>
                  <SelectTrigger className="w-28 h-7 text-xs ml-1">
                    <SelectValue placeholder={user.role} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="user">user</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {user.role === 'admin' ? (
                <p className="text-sm text-gray-500 italic">Admins have full access to all pages.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Page Access</h4>
                    <div className="flex gap-2">
                      <button
                        className="text-xs text-indigo-600 hover:underline"
                        onClick={() => updatePermissionsMutation.mutate({ userId: user.id, permissions: PAGE_PERMISSIONS.map(p => p.id) })}
                      >Grant All</button>
                      <span className="text-gray-300">|</span>
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => updatePermissionsMutation.mutate({ userId: user.id, permissions: [] })}
                      >Revoke All</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          {((user.permissions || []).length > 0)
                            ? `${(user.permissions || []).length} permission(s) granted — click to manage`
                            : "Select permissions..."}
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="max-h-72 overflow-y-auto p-2">
                          {PAGE_PERMISSIONS.map((perm) => {
                            const hasPermission = (user.permissions || []).includes(perm.id);
                            const isUpdating = updatePermissionsMutation.isPending && updatePermissionsMutation.variables?.userId === user.id;
                            return (
                              <div key={perm.id} className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-gray-50">
                                <Checkbox
                                  id={`popover-${user.id}-${perm.id}`}
                                  checked={hasPermission}
                                  disabled={isUpdating}
                                  onCheckedChange={(checked) => handlePermissionChange(user.id, user.permissions, perm.id, checked)}
                                />
                                <label
                                  htmlFor={`popover-${user.id}-${perm.id}`}
                                  className={`text-sm font-medium leading-none cursor-pointer flex-1 ${hasPermission ? 'text-gray-900' : 'text-gray-400'}`}
                                >
                                  {perm.label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {(user.permissions || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(user.permissions || []).map(permId => {
                          const perm = PAGE_PERMISSIONS.find(p => p.id === permId);
                          return (
                            <Badge
                              key={permId}
                              variant="secondary"
                              className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                              onClick={() => handlePermissionChange(user.id, user.permissions, permId, false)}
                              title="Click to remove"
                            >
                              {perm?.label || permId}
                              <span className="ml-1 text-xs">×</span>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
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