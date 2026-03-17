import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  MoreVertical,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Camera,
  AlertCircle,
  Package,
  Edit,
  Printer
} from 'lucide-react';
import ProductForm from '@/components/inventory/ProductForm';
import StockAdjustmentDialog from '@/components/inventory/StockAdjustmentDialog';
import BarcodeScannerDialog from '@/components/scanner/BarcodeScannerDialog';
import BulkEditDialog from '@/components/inventory/BulkEditDialog';
import PrintLabelsDialog from '@/components/inventory/PrintLabelsDialog';
import { toast } from 'sonner';

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [initialSku, setInitialSku] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState({ isOpen: false, product: null, type: 'in' });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isPrintLabelsOpen, setIsPrintLabelsOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const filteredProducts = products
    .filter(product => {
      const searchLower = search.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(searchLower) || 
                           (product.sku || "").toLowerCase().includes(searchLower);
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const sectionA = (a.section || 'Main').toLowerCase();
      const sectionB = (b.section || 'Main').toLowerCase();
      if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);
      return a.name.localeCompare(b.name);
    });

  const totalStock = filteredProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalValue = filteredProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
  const lowStockCount = filteredProducts.filter(p => (p.quantity || 0) <= (p.low_stock_threshold || 10)).length;

  const handleDelete = async (id) => {
    if (confirm("Delete this product?")) {
      await base44.entities.Product.delete(id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product deleted");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setInitialSku(null);
    setIsProductFormOpen(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleScanResult = (code) => {
    const product = products.find(p => p.sku === code);
    if (product) {
      setSearch(code);
      toast.success(`Found: ${product.name}`);
    } else {
      setInitialSku(code);
      setEditingProduct(null);
      setIsProductFormOpen(true);
      toast.info("Product not found. Create it?");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search products..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          {selectedIds.length > 0 && (
            <>
              <Button onClick={() => setIsPrintLabelsOpen(true)} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <Printer className="w-4 h-4 mr-2" />
                Print Labels ({selectedIds.length})
              </Button>
              <Button onClick={() => setIsBulkEditOpen(true)} variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                <Edit className="w-4 h-4 mr-2" />
                Bulk Edit ({selectedIds.length})
              </Button>
            </>
          )}
          <Button onClick={() => setIsScannerOpen(true)} variant="outline">
            <Camera className="w-4 h-4 mr-2" />
            Scan
          </Button>
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.flatMap((product, index) => {
                const section = product.section || 'Main';
                const prevSection = index > 0 ? (filteredProducts[index - 1].section || 'Main') : null;
                const isLowStock = (product.quantity || 0) <= (product.low_stock_threshold || 10);
                const isOutOfStock = (product.quantity || 0) === 0;
                const rows = [];

                if (section !== prevSection) {
                  rows.push(
                    <TableRow key={`section-${section}-${index}`} className="bg-slate-50 border-t-2 border-indigo-100">
                      <TableCell colSpan={7} className="py-2 px-4">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{section}</span>
                      </TableCell>
                    </TableRow>
                  );
                }

                rows.push(
                  <TableRow key={product.id} className={selectedIds.includes(product.id) ? "bg-indigo-50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">
                              {product.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{product.category}</TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{product.quantity}</span>
                      <span className="text-xs text-gray-400"> / {product.low_stock_threshold}</span>
                    </TableCell>
                    <TableCell>
                      {isOutOfStock ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : isLowStock ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          <AlertCircle className="w-3 h-3 mr-1" /> Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          In Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-green-600"
                          onClick={() => setStockAdjustment({ isOpen: true, product, type: 'in' })}
                        >
                          <ArrowDownCircle className="w-5 h-5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-600"
                          onClick={() => setStockAdjustment({ isOpen: true, product, type: 'out' })}
                        >
                          <ArrowUpCircle className="w-5 h-5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );

                return rows;
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductForm 
        isOpen={isProductFormOpen} 
        onClose={() => setIsProductFormOpen(false)} 
        product={editingProduct}
        initialSku={initialSku}
      />

      <StockAdjustmentDialog
        isOpen={stockAdjustment.isOpen}
        onClose={() => setStockAdjustment({ ...stockAdjustment, isOpen: false })}
        product={stockAdjustment.product}
        type={stockAdjustment.type}
      />

      <BarcodeScannerDialog 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
      />

      <BulkEditDialog
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedIds={selectedIds}
        onComplete={() => setSelectedIds([])}
      />

      <PrintLabelsDialog
        isOpen={isPrintLabelsOpen}
        onClose={() => setIsPrintLabelsOpen(false)}
        products={products.filter(p => selectedIds.includes(p.id))}
      />
    </div>
  );
}