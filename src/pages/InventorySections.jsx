import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  Search, 
  MapPin,
  ArrowDownCircle, 
  ArrowUpCircle,
  Eye,
  Grid3x3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StockAdjustmentDialog from '@/components/inventory/StockAdjustmentDialog';
import ProductDetailsDialog from '@/components/inventory/ProductDetailsDialog';
import ProductForm from '@/components/inventory/ProductForm';

export default function InventorySections() {
  const [search, setSearch] = useState("");
  const [stockAdjustment, setStockAdjustment] = useState({ isOpen: false, product: null, type: 'in' });
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Group products by section
  const productsBySection = products.reduce((acc, product) => {
    const section = product.section || "Main";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(product);
    return acc;
  }, {});

  // Filter by search
  const filteredSections = Object.entries(productsBySection).reduce((acc, [section, items]) => {
    const filtered = items.filter(p => 
      (p.name || "").toLowerCase().includes(search.toLowerCase()) || 
      (p.sku || "").toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[section] = filtered;
    }
    return acc;
  }, {});

  const sections = Object.keys(filteredSections).sort();

  const openStockAdjustment = (product, type) => {
    setStockAdjustment({ isOpen: true, product, type });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const getSectionStats = (items) => {
    const totalItems = items.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lowStock = items.filter(p => (p.quantity || 0) <= (p.low_stock_threshold || 10)).length;
    const outOfStock = items.filter(p => (p.quantity || 0) === 0).length;
    return { totalItems, lowStock, outOfStock, productCount: items.length };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Grid3x3 className="w-8 h-8 text-indigo-600" />
            Inventory by Sections
          </h1>
          <p className="text-gray-500 mt-1">View and manage products organized by warehouse sections</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search products..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No products found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sections.map(section => {
            const items = filteredSections[section];
            const stats = getSectionStats(items);
            
            return (
              <Card key={section} className="overflow-hidden border-2 hover:border-indigo-200 transition-colors">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{section}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {stats.productCount} products • {stats.totalItems} items in stock
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {stats.outOfStock > 0 && (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                          {stats.outOfStock} Out of Stock
                        </Badge>
                      )}
                      {stats.lowStock > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                          {stats.lowStock} Low Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(product => {
                      const isLowStock = (product.quantity || 0) <= (product.low_stock_threshold || 10);
                      const isOutOfStock = (product.quantity || 0) === 0;

                      return (
                        <Card 
                          key={product.id}
                          className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                          onClick={() => setViewingProduct(product)}
                        >
                          <div className="aspect-square bg-gray-100 relative overflow-hidden">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-gray-300" />
                              </div>
                            )}
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">OUT OF STOCK</span>
                              </div>
                            )}
                            {!isOutOfStock && isLowStock && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-orange-500 text-white">Low Stock</Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-900 truncate mb-1">{product.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">{product.sku || 'No SKU'}</p>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-lg font-bold text-indigo-600">
                                {product.currency || '$'} {Number(product.price).toFixed(2)}
                              </span>
                              <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                                {product.quantity} in stock
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openStockAdjustment(product, 'in');
                                }}
                              >
                                <ArrowDownCircle className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openStockAdjustment(product, 'out');
                                }}
                              >
                                <ArrowUpCircle className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingProduct(product);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <StockAdjustmentDialog
        isOpen={stockAdjustment.isOpen}
        onClose={() => setStockAdjustment({ ...stockAdjustment, isOpen: false })}
        product={stockAdjustment.product}
        type={stockAdjustment.type}
        user={user}
      />

      <ProductDetailsDialog 
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
        onEdit={handleEdit}
      />

      <ProductForm 
        isOpen={isProductFormOpen} 
        onClose={() => setIsProductFormOpen(false)} 
        product={editingProduct}
        user={user}
      />
    </div>
  );
}