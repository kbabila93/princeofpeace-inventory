import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Pencil,
  Trash2,
  Truck,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SupplierForm from '@/components/suppliers/SupplierForm';
import { toast } from 'sonner';

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const canDelete = user?.role === 'admin' || (user?.permissions || []).includes('manage_inventory');

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete suppliers");
      return;
    }
    if (confirm("Are you sure you want to delete this supplier?")) {
      await base44.entities.Supplier.delete(id);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Supplier deleted");
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsSupplierFormOpen(true);
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    setIsSupplierFormOpen(true);
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(search.toLowerCase()) || 
    (supplier.contact_person && supplier.contact_person.toLowerCase().includes(search.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(search.toLowerCase())) ||
    (supplier.country && supplier.country.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Suppliers</h2>
          <p className="text-gray-500">Manage your product suppliers and vendors.</p>
        </div>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search suppliers..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                          {supplier.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{supplier.name}</p>
                        {supplier.contact_person && (
                          <p className="text-xs text-gray-500">Contact: {supplier.contact_person}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.website && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-3 h-3" />
                          <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600">
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.country && (
                        <div className="font-medium text-sm text-gray-900">{supplier.country}</div>
                      )}
                      {supplier.address && (
                        <div className="flex items-start gap-2 text-sm text-gray-500 max-w-xs">
                          <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                          {supplier.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit Details
                        </DropdownMenuItem>
                        {canDelete && (
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(supplier.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierForm 
        isOpen={isSupplierFormOpen} 
        onClose={() => setIsSupplierFormOpen(false)} 
        supplier={editingSupplier} 
      />
    </div>
  );
}