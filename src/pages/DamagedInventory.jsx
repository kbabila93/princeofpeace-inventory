import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  MoreVertical,
  ArrowLeft,
  Trash2,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import RecordDamageDialog from '@/components/inventory/RecordDamageDialog';
import ProductDetailsDialog from '@/components/inventory/ProductDetailsDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DamagedInventory() {
  const [search, setSearch] = useState("");
  const [recordDamageOpen, setRecordDamageOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const damagedProducts = products.filter(p => p.status === 'damaged');
  
  const filteredProducts = damagedProducts.filter(p => 
    (p.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  // Calculate totals
  const totalDamagedItems = filteredProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  
  const totalLossByCurrency = filteredProducts.reduce((acc, p) => {
    const curr = p.currency || 'USD';
    const val = (p.quantity || 0) * (p.cost_price || 0);
    acc[curr] = (acc[curr] || 0) + val;
    return acc;
  }, {});

  const formatCurrencyTotals = (totals) => {
    const entries = Object.entries(totals);
    if (entries.length === 0) return "0.00";
    return entries.map(([curr, val]) => `${curr} ${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`).join(' + ');
  };

  const restoreToActiveMutation = useMutation({
    mutationFn: async (product) => {
      await base44.entities.Product.update(product.id, { 
        status: 'active',
        last_updated_by: user?.email 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product restored to active status");
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Product.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product deleted");
    }
  });

  const handleRestore = (product) => {
    if (confirm(`Restore "${product.name}" to active inventory?`)) {
      restoreToActiveMutation.mutate(product);
    }
  };

  const handleDelete = (product) => {
    if (confirm(`Permanently delete "${product.name}"? This cannot be undone.`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          Damaged Inventory
        </h1>
        <p className="text-gray-500">Track and manage damaged items</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500">Total Damaged Items</span>
            <span className="text-2xl font-bold text-red-600">{totalDamagedItems}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500">Damaged Products</span>
            <span className="text-2xl font-bold text-orange-600">{filteredProducts.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500">Estimated Loss Value</span>
            <span className="text-2xl font-bold text-red-700">{formatCurrencyTotals(totalLossByCurrency)}</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search damaged items..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setRecordDamageOpen(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Record Damage
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Quantity Damaged</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Total Loss</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                  Loading damaged items...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
                    <p className="font-medium">No damaged items</p>
                    <p className="text-sm">All inventory is in good condition</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const totalLoss = (product.quantity || 0) * (product.cost_price || 0);
                
                return (
                  <TableRow 
                    key={product.id} 
                    className="cursor-pointer hover:bg-red-50"
                    onClick={() => setViewingProduct(product)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover opacity-60" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">
                              {product.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <Badge variant="destructive" className="mt-1 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Damaged
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{product.sku || '-'}</TableCell>
                    <TableCell>{product.section || 'Main'}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">{product.quantity}</span>
                    </TableCell>
                    <TableCell>
                      {product.currency || '$'} {Number(product.cost_price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-700">
                        {product.currency || '$'} {totalLoss.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium">{product.last_updated_by || 'System'}</span>
                        <span className="text-xs">{format(new Date(product.updated_date || product.created_date), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setViewingProduct(product);
                          }}>
                            <FileText className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(product);
                          }}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Restore to Active
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(product);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <RecordDamageDialog 
        isOpen={recordDamageOpen}
        onClose={() => setRecordDamageOpen(false)}
        user={user}
      />

      <ProductDetailsDialog 
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
        onEdit={() => {}}
      />
    </div>
  );
}