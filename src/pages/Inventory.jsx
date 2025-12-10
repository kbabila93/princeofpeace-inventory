import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowDownCircle, 
  ArrowUpCircle,
  AlertCircle,
  Pencil,
  Trash2,
  Printer,
  Share2
  } from 'lucide-react';
  import { jsPDF } from "jspdf";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductForm from '@/components/inventory/ProductForm';
import StockAdjustmentDialog from '@/components/inventory/StockAdjustmentDialog';
import ShareProductDialog from '@/components/inventory/ShareProductDialog';
import { toast } from 'sonner';

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [shareDialog, setShareDialog] = useState({ isOpen: false, product: null });

  const [stockAdjustment, setStockAdjustment] = useState({ isOpen: false, product: null, type: 'in' });

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const canDelete = user?.role === 'admin' || (user?.permissions || []).includes('delete_inventory');

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete products");
      return;
    }
    if (confirm("Are you sure you want to delete this product?")) {
      await base44.entities.Product.delete(id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product deleted");
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                          product.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesSection = sectionFilter === "all" || (product.section || "Main") === sectionFilter;
    
    let matchesStatus = true;
    if (statusFilter === "low_stock") {
      matchesStatus = (product.quantity || 0) <= (product.low_stock_threshold || 10);
    } else if (statusFilter === "out_of_stock") {
      matchesStatus = (product.quantity || 0) === 0;
    }

    return matchesSearch && matchesCategory && matchesSection && matchesStatus;
  });

  // Get unique sections for filter
  const uniqueSections = [...new Set(products.map(p => p.section || "Main"))].sort();

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const openStockAdjustment = (product, type) => {
    setStockAdjustment({ isOpen: true, product, type });
  };

  const handlePrintLabel = async (product) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [50, 30]
    });

    const sku = product.sku || "NO SKU";
    // Using bwip-js API for barcode generation
    const barcodeUrl = `https://bwipjs-api.metafloor.org/?bcid=code128&text=${encodeURIComponent(sku)}&scale=3&height=10&incltext=true`;

    doc.setFontSize(9);
    doc.text(product.name.substring(0, 25), 25, 5, { align: "center" });

    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = barcodeUrl;
      });

      // Calculate dimensions to fit in 40mm width approx
      const imgWidth = 35; 
      const imgHeight = (img.height * imgWidth) / img.width;
      const x = (50 - imgWidth) / 2;
      
      doc.addImage(img, 'PNG', x, 7, imgWidth, imgHeight);
    } catch (error) {
      console.error("Barcode load failed", error);
      doc.setFontSize(8);
      doc.text(sku, 25, 15, { align: "center" });
    }
    
    doc.setFontSize(10);
    doc.text(`${product.currency || '$'} ${Number(product.price).toFixed(2)}`, 25, 27, { align: "center" });
    
    doc.save(`${sku}-label.pdf`);
  };

  const handleShare = (product) => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} - ${product.currency} ${Number(product.price).toFixed(2)}`,
        url: `${window.location.origin}/Inventory?search=${encodeURIComponent(product.sku || product.name)}`
      }).catch((error) => console.log('Error sharing', error));
    } else {
      setShareDialog({ isOpen: true, product });
    }
  };

  const handlePrintReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Inventory Report", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Headers
    let yPos = 40;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Product", 14, yPos);
    doc.text("SKU", 80, yPos);
    doc.text("Category", 110, yPos);
    doc.text("Stock", 140, yPos);
    doc.text("Price", 170, yPos);
    
    doc.line(14, yPos + 2, 196, yPos + 2);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    
    filteredProducts.forEach((product) => {
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.text(product.name.substring(0, 30), 14, yPos);
        doc.text(product.sku || "-", 80, yPos);
        doc.text(product.category || "-", 110, yPos);
        doc.text(String(product.quantity), 140, yPos);
        doc.text(`${product.currency || '$'} ${Number(product.price).toFixed(2)}`, 170, yPos);
        
        yPos += 7;
    });
    
    doc.save("inventory-report.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Category" />
              </div>
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
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {uniqueSections.map(section => (
                <SelectItem key={section} value={section}>{section}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handlePrintReport} variant="outline" className="mr-0">
          <Printer className="w-4 h-4 mr-2" />
          Print List
        </Button>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  Loading inventory...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = (product.quantity || 0) <= (product.low_stock_threshold || 10);
                const isOutOfStock = (product.quantity || 0) === 0;

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">
                              {product.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{product.category}</TableCell>
                    <TableCell>{product.section || "Main"}</TableCell>
                    <TableCell>{product.currency || '$'} {Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.quantity}</span>
                        <span className="text-xs text-gray-400">/ {product.low_stock_threshold} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isOutOfStock ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                          Out of Stock
                        </Badge>
                      ) : isLowStock ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                          <AlertCircle className="w-3 h-3 mr-1" /> Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                          In Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Add Stock"
                          onClick={() => openStockAdjustment(product, 'in')}
                        >
                          <ArrowDownCircle className="w-5 h-5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove Stock"
                          onClick={() => openStockAdjustment(product, 'out')}
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handlePrintLabel(product)}>
                              <Printer className="w-4 h-4 mr-2" /> Print Label
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(product)}>
                              <Share2 className="w-4 h-4 mr-2" /> Share Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canDelete && (
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductForm 
        isOpen={isProductFormOpen} 
        onClose={() => setIsProductFormOpen(false)} 
        product={editingProduct} 
      />

      <StockAdjustmentDialog
        isOpen={stockAdjustment.isOpen}
        onClose={() => setStockAdjustment({ ...stockAdjustment, isOpen: false })}
        product={stockAdjustment.product}
        type={stockAdjustment.type}
      />

      <ShareProductDialog 
        isOpen={shareDialog.isOpen} 
        onClose={() => setShareDialog({ ...shareDialog, isOpen: false })} 
        product={shareDialog.product} 
      />
      </div>
      );
      }