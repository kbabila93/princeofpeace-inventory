import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  Pencil, 
  Trash2, 
  Receipt,
  MoreVertical 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ExpenditureForm from '@/components/expenditures/ExpenditureForm';
import { toast } from 'sonner';

export default function Expenditures() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: expenditures = [], isLoading } = useQuery({
    queryKey: ['expenditures'],
    queryFn: () => base44.entities.Expenditure.list('-date'),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const canDelete = user?.role === 'admin' || (user?.permissions || []).includes('delete_expenditures');

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete expenditures");
      return;
    }
    if (confirm("Are you sure you want to delete this expenditure?")) {
      await base44.entities.Expenditure.delete(id);
      queryClient.invalidateQueries({ queryKey: ['expenditures'] });
      toast.success("Expenditure deleted");
    }
  };

  const filteredExpenditures = expenditures.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const totalExpenditure = filteredExpenditures.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search expenditures..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="salaries">Salaries</SelectItem>
              <SelectItem value="supplies">Supplies</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-500">Total Shown</p>
            <p className="text-lg font-bold text-gray-900">${totalExpenditure.toLocaleString()}</p>
          </div>
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Record Expense
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  Loading expenditures...
                </TableCell>
              </TableRow>
            ) : filteredExpenditures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No expenditures found.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenditures.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {format(new Date(item.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-gray-500">{item.payment_method}</TableCell>
                  <TableCell className="text-right font-bold text-gray-900">
                    {item.currency || '$'} {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenditureForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        expenditure={editingItem} 
      />
    </div>
  );
}