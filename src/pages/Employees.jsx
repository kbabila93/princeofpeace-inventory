import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Mail, 
  Phone, 
  User 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EmployeeForm from '@/components/employees/EmployeeForm';
import { toast } from 'sonner';

export default function Employees() {
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const canDelete = user?.role === 'admin' || (user?.permissions || []).includes('delete_employees');

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("You don't have permission to remove employees");
      return;
    }
    if (confirm("Are you sure you want to remove this employee?")) {
      await base44.entities.Employee.delete(id);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Employee removed");
    }
  };

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(search.toLowerCase()) || 
    employee.role.toLowerCase().includes(search.toLowerCase()) ||
    employee.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const statusColors = {
    active: "bg-green-100 text-green-700 border-green-200",
    on_leave: "bg-yellow-100 text-yellow-700 border-yellow-200",
    terminated: "bg-red-100 text-red-700 border-red-200"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search employees..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading employees...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No employees found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-6 flex items-start justify-between">
                  <div className="flex gap-4">
                    <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                      <AvatarImage src={employee.image_url} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold text-lg">
                        {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{employee.role}</p>
                      <Badge variant="outline" className={statusColors[employee.status] || "bg-gray-100"}>
                        {employee.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(employee)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 space-y-2 border-t text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.salary && (
                    <div className="pt-2 text-xs text-gray-500 font-medium border-t border-gray-100 mt-2">
                      Salary: {employee.currency} {Number(employee.salary).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EmployeeForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        employee={editingEmployee} 
      />
    </div>
  );
}