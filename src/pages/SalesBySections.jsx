import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, Grid3x3, Search, ShoppingCart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionSaleModal from '@/components/sales/SectionSaleModal';

export default function SalesBySections() {
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  // Group products by section
  const productsBySection = (products || []).reduce((acc, product) => {
    const section = product.section || "Main";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(product);
    return acc;
  }, {});

  // Filter sections based on search
  const filteredSections = Object.entries(productsBySection).filter(([sectionName, sectionProducts]) => {
    const matchesSearch = sectionName.toLowerCase().includes(search.toLowerCase()) ||
      sectionProducts.some(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const openSectionSale = (sectionName) => {
    setSelectedSection(sectionName);
    setIsSaleModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sales by Section</h2>
          <p className="text-gray-500">Make sales organized by warehouse sections.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input 
          placeholder="Search sections or products..." 
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No sections found.
          </div>
        ) : (
          filteredSections.map(([sectionName, sectionProducts]) => {
            const totalStock = sectionProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
            const lowStockCount = sectionProducts.filter(p => (p.quantity || 0) <= (p.low_stock_threshold || 10)).length;
            const totalValue = sectionProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);

            return (
              <Card key={sectionName} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3x3 className="w-5 h-5 text-indigo-600" />
                      <span>{sectionName}</span>
                    </div>
                    <Badge variant="secondary">{sectionProducts.length} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Stock:</span>
                      <span className="font-semibold">{totalStock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-semibold">${totalValue.toFixed(2)}</span>
                    </div>
                    {lowStockCount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Low Stock:</span>
                        <Badge variant="destructive" className="bg-orange-100 text-orange-700">
                          {lowStockCount} items
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 max-h-32 overflow-y-auto">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Products:</p>
                    <div className="space-y-1">
                      {sectionProducts.slice(0, 5).map(product => (
                        <div key={product.id} className="text-xs flex justify-between items-center">
                          <span className="text-gray-700 truncate flex-1">{product.name}</span>
                          <span className="text-gray-500 ml-2">({product.quantity || 0})</span>
                        </div>
                      ))}
                      {sectionProducts.length > 5 && (
                        <p className="text-xs text-gray-400 italic">
                          +{sectionProducts.length - 5} more...
                        </p>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => openSectionSale(sectionName)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Make Sale
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <SectionSaleModal 
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSelectedSection(null);
        }}
        section={selectedSection}
        products={productsBySection[selectedSection] || []}
      />
    </div>
  );
}