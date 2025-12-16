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
  Share2,
  Settings,
  QrCode
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
import BatchManagerDialog from '@/components/inventory/BatchManagerDialog';
import ShareProductDialog from '@/components/inventory/ShareProductDialog';
import ScanLookupDialog from '@/components/inventory/ScanLookupDialog';
import PrinterSettingsDialog from '@/components/inventory/PrinterSettingsDialog';
import { useBarcodeScanner } from '../components/hooks/useBarcodeScanner';
import { toast } from 'sonner';
import { ScanBarcode } from 'lucide-react';

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [initialSku, setInitialSku] = useState(null);
  const [shareDialog, setShareDialog] = useState({ isOpen: false, product: null });
  const [scanDialog, setScanDialog] = useState(false);
  const [printerSettingsOpen, setPrinterSettingsOpen] = useState(false);
  const [printerSettings, setPrinterSettings] = useState({ preset: 'standard', width: 50, height: 30, unit: 'mm' });

  const [stockAdjustment, setStockAdjustment] = useState({ isOpen: false, product: null, type: 'in' });
  const [batchDialog, setBatchDialog] = useState({ isOpen: false, product: null });

  const queryClient = useQueryClient();

  // Global scanner listener
  useBarcodeScanner({
    onScan: (code) => {
      // Check if product exists
      const product = products.find(p => p.sku === code);
      if (product) {
        setSearch(code);
        toast.success(`Found: ${product.name}`);
      } else {
        // If not found, open form to create
        setInitialSku(code);
        setEditingProduct(null);
        setIsProductFormOpen(true);
        toast.info("Product not found. Create it?");
      }
    }
  });

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
    setInitialSku(null);
    setIsProductFormOpen(true);
  };

  const handleScanResult = ({ sku, product }) => {
    if (product) {
      setSearch(sku); // Filter to show the product
      toast.success("Product found");
    } else {
      toast.info("Product not found. Create it now.");
      setEditingProduct(null);
      setInitialSku(sku);
      setIsProductFormOpen(true);
    }
  };

  const openStockAdjustment = (product, type) => {
    setStockAdjustment({ isOpen: true, product, type });
  };

  const handlePrintLabel = (product) => {
    const sku = product.sku || "NO SKU";
    const printWindow = window.open('', '_blank', `width=${printerSettings.width * 10},height=${printerSettings.height * 10}`);
    
    if (!printWindow) {
      toast.error("Please allow popups to print labels");
      return;
    }

    const safeName = product.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeSku = sku.replace(/"/g, '\\"');
    
    // CSS to match selected dimensions
    const widthStyle = `${printerSettings.width}${printerSettings.unit}`;
    const heightStyle = `${printerSettings.height}${printerSettings.unit}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label - ${safeName}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page {
              size: ${widthStyle} ${heightStyle};
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              width: ${widthStyle};
              height: ${heightStyle};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .label-content {
              text-align: center;
              width: 95%;
              height: 95%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            #barcode { 
              width: 100%; 
              height: auto; 
              max-height: 60%;
              display: block; 
            }
            .product-name { 
              font-size: 10px; 
              font-weight: bold; 
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }
            .price { 
              font-size: 12px; 
              font-weight: bold; 
            }
          </style>
        </head>
        <body>
          <div class="label-content">
            <div class="product-name">${safeName}</div>
            <svg id="barcode"></svg>
            <div class="price">${product.currency || '$'} ${Number(product.price).toFixed(2)}</div>
          </div>
          <script>
            try {
              JsBarcode("#barcode", "${safeSku}", {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: true,
                margin: 0,
                fontSize: 10
              });
              
              setTimeout(() => {
                window.print();
              }, 500);
            } catch (e) {
              document.body.innerHTML = '<p style="color:red; text-align:center;">Error</p>';
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
        <div className="flex gap-2">
          <Button onClick={() => setScanDialog(true)} variant="outline" title="Manual Scan / Lookup">
            <ScanBarcode className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Scan</span>
          </Button>
          <Button onClick={() => setPrinterSettingsOpen(true)} variant="outline" size="icon" title="Printer Settings">
            <Settings className="w-4 h-4" />
          </Button>
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
              <TableHead>Last Updated</TableHead>
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
                      <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-gray-700">
                          {product.last_updated_by || product.created_by || "System"}
                        </span>
                        <span className="text-gray-400">
                          {new Date(product.updated_date || product.created_date).toLocaleDateString()}
                        </span>
                      </div>
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
                            <DropdownMenuItem onClick={() => setBatchDialog({ isOpen: true, product })}>
                              <div className="flex items-center">
                                <span className="w-4 h-4 mr-2 flex items-center justify-center font-bold text-[10px] border border-current rounded bg-transparent">B</span>
                                Manage Batches
                              </div>
                            </DropdownMenuItem>
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
        initialSku={initialSku}
        user={user}
      />

      <ScanLookupDialog
        isOpen={scanDialog}
        onClose={() => setScanDialog(false)}
        onScan={handleScanResult}
      />

      <PrinterSettingsDialog 
        isOpen={printerSettingsOpen}
        onClose={() => setPrinterSettingsOpen(false)}
        settings={printerSettings}
        onSave={setPrinterSettings}
      />

      <StockAdjustmentDialog
        isOpen={stockAdjustment.isOpen}
        onClose={() => setStockAdjustment({ ...stockAdjustment, isOpen: false })}
        product={stockAdjustment.product}
        type={stockAdjustment.type}
        user={user}
      />

      <ShareProductDialog 
        isOpen={shareDialog.isOpen} 
        onClose={() => setShareDialog({ ...shareDialog, isOpen: false })} 
        product={shareDialog.product} 
      />

      <BatchManagerDialog 
        isOpen={batchDialog.isOpen} 
        onClose={() => setBatchDialog({ ...batchDialog, isOpen: false })} 
        product={batchDialog.product} 
      />
      </div>
      );
      }