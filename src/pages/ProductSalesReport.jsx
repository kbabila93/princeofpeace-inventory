import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, TrendingUp, Package, DollarSign, Search } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import ProductDetailsDialog from '@/components/inventory/ProductDetailsDialog';

export default function ProductSalesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [viewingProduct, setViewingProduct] = useState(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-date', 1000),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const productSalesData = useMemo(() => {
    let filteredSales = sales;

    // Filter by date range
    if (startDate) {
      filteredSales = filteredSales.filter(s => new Date(s.date) >= new Date(startDate));
    }
    if (endDate) {
      filteredSales = filteredSales.filter(s => new Date(s.date) <= new Date(endDate));
    }

    const productMap = {};

    filteredSales.forEach(sale => {
      const items = JSON.parse(sale.items_json || "[]");
      
      items.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        const costPrice = product?.cost_price || 0;
        const itemProfit = (item.price - costPrice) * item.quantity;
        const section = product?.section || "Main";

        if (!productMap[item.product_id]) {
          productMap[item.product_id] = {
            productId: item.product_id,
            name: item.name,
            section: section,
            totalQuantity: 0,
            totalRevenue: 0,
            totalProfit: 0,
            salesCount: 0,
            image_url: product?.image_url || null,
            currency: sale.currency || 'USD',
            stockLeft: product?.quantity || 0,
            averagePrice: 0
          };
        }

        productMap[item.product_id].totalQuantity += item.quantity;
        productMap[item.product_id].totalRevenue += item.price * item.quantity;
        productMap[item.product_id].totalProfit += itemProfit;
        productMap[item.product_id].salesCount += 1;
        productMap[item.product_id].averagePrice = productMap[item.product_id].totalRevenue / productMap[item.product_id].totalQuantity;
      });
    });

    return Object.values(productMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [sales, products, startDate, endDate]);

  const filteredProducts = useMemo(() => {
    if (!searchProduct.trim()) return productSalesData;
    const search = searchProduct.toLowerCase();
    return productSalesData.filter(p => p.name.toLowerCase().includes(search));
  }, [productSalesData, searchProduct]);

  const groupedBySection = useMemo(() => {
    const groups = {};
    filteredProducts.forEach(product => {
      const section = product.section || "Main";
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(product);
    });
    return groups;
  }, [filteredProducts]);

  const totalRevenue = filteredProducts.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
  const totalProfit = filteredProducts.reduce((sum, p) => sum + (p.totalProfit || 0), 0);
  const totalQuantity = filteredProducts.reduce((sum, p) => sum + (p.totalQuantity || 0), 0);
  const currency = filteredProducts[0]?.currency || productSalesData[0]?.currency || 'USD';

  // Market Performance Metrics
  const topPerformers = [...filteredProducts].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  const worstPerformers = [...filteredProducts].sort((a, b) => a.totalRevenue - b.totalRevenue).slice(0, 5);
  const highestProfitMargin = [...filteredProducts].sort((a, b) => {
    const marginA = a.totalRevenue > 0 ? (a.totalProfit / a.totalRevenue) * 100 : 0;
    const marginB = b.totalRevenue > 0 ? (b.totalProfit / b.totalRevenue) * 100 : 0;
    return marginB - marginA;
  }).slice(0, 5);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Product Sales Report", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    if (startDate || endDate) {
      doc.text(`Period: ${startDate || 'Start'} to ${endDate || 'Now'}`, 14, 36);
    }

    let yPos = 46;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Product", 14, yPos);
    doc.text("Qty Sold", 100, yPos);
    doc.text("Revenue", 130, yPos);
    doc.text("Profit", 165, yPos);
    
    doc.line(14, yPos + 2, 196, yPos + 2);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    
    filteredProducts.forEach((product) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(product.name.substring(0, 40), 14, yPos);
      doc.text(String(product.totalQuantity), 100, yPos);
      doc.text(`${product.currency} ${product.totalRevenue.toFixed(2)}`, 130, yPos);
      doc.text(`${product.currency} ${product.totalProfit.toFixed(2)}`, 165, yPos);
      
      yPos += 7;
    });

    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.line(14, yPos - 5, 196, yPos - 5);
    doc.text("TOTALS:", 14, yPos);
    doc.text(String(totalQuantity), 100, yPos);
    doc.text(`${currency} ${totalRevenue.toFixed(2)}`, 130, yPos);
    doc.text(`${currency} ${totalProfit.toFixed(2)}`, 165, yPos);
    
    doc.save("product-sales-report.pdf");
    toast.success("Report downloaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Sales Report</h1>
        <p className="text-gray-500 mt-1">Analyze sales performance by product</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Products Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold">{totalQuantity}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {currency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {currency} {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
        </div>

        <Card className="mb-6">
        <CardHeader>
          <CardTitle>Market Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Top 5 Best Sellers (Revenue)
              </h3>
              <div className="space-y-2">
                {topPerformers.map((product, idx) => (
                  <div key={product.productId} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-700 bg-green-200 w-5 h-5 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-green-700">
                      {product.currency} {product.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-red-600" />
                Bottom 5 Performers
              </h3>
              <div className="space-y-2">
                {worstPerformers.map((product, idx) => (
                  <div key={product.productId} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-700 bg-red-200 w-5 h-5 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-red-700">
                      {product.currency} {product.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                Top 5 Profit Margins
              </h3>
              <div className="space-y-2">
                {highestProfitMargin.map((product, idx) => {
                  const margin = product.totalRevenue > 0 ? (product.totalProfit / product.totalRevenue) * 100 : 0;
                  return (
                    <div key={product.productId} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-700 bg-purple-200 w-5 h-5 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-purple-700">
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
        </Card>

        <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle>Sales by Product</CardTitle>
            <Button onClick={handleExportPDF} disabled={filteredProducts.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Search Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock Left</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Sales Count</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      Loading report...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      No sales data found
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedBySection).sort().map(([section, sectionProducts]) => {
                    const sectionTotalQty = sectionProducts.reduce((sum, p) => sum + p.totalQuantity, 0);
                    const sectionTotalRevenue = sectionProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
                    const sectionTotalProfit = sectionProducts.reduce((sum, p) => sum + p.totalProfit, 0);
                    
                    return (
                      <React.Fragment key={section}>
                        <TableRow className="bg-indigo-50 hover:bg-indigo-50">
                          <TableCell colSpan={5} className="font-bold text-indigo-900 text-base py-3">
                            {section}
                            <span className="ml-3 text-sm font-normal text-indigo-600">
                              ({sectionProducts.length} product{sectionProducts.length !== 1 ? 's' : ''})
                            </span>
                          </TableCell>
                        </TableRow>
                        {sectionProducts.map((product) => {
                          const profitMargin = product.totalRevenue > 0 ? (product.totalProfit / product.totalRevenue) * 100 : 0;
                          const isLowStock = product.stockLeft <= 10;
                          const isOutOfStock = product.stockLeft === 0;

                          return (
                            <TableRow 
                              key={product.productId}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => {
                                const fullProduct = products.find(p => p.id === product.productId);
                                if (fullProduct) setViewingProduct(fullProduct);
                              }}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {product.image_url ? (
                                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-bold text-gray-400">
                                        {product.name.substring(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-medium text-gray-900">{product.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                                  {product.stockLeft}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-medium">{product.totalQuantity}</TableCell>
                              <TableCell className="text-right text-gray-600">{product.salesCount}</TableCell>
                              <TableCell className="text-right text-gray-700">
                                {product.currency} {product.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-600">
                                {product.currency} {product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right font-bold text-purple-600">
                                {product.currency} {product.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${profitMargin >= 50 ? 'text-green-600' : profitMargin >= 30 ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {profitMargin.toFixed(1)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell className="text-indigo-700">Section Total</TableCell>
                          <TableCell className="text-right text-indigo-700">{sectionProducts.reduce((sum, p) => sum + p.stockLeft, 0)}</TableCell>
                          <TableCell className="text-right text-indigo-700">{sectionTotalQty}</TableCell>
                          <TableCell className="text-right text-indigo-700">{sectionProducts.reduce((sum, p) => sum + p.salesCount, 0)}</TableCell>
                          <TableCell className="text-right text-indigo-700">-</TableCell>
                          <TableCell className="text-right text-indigo-700">
                            {currency} {sectionTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-indigo-700">
                            {currency} {sectionTotalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-indigo-700">
                            {sectionTotalRevenue > 0 ? ((sectionTotalProfit / sectionTotalRevenue) * 100).toFixed(1) : '0.0'}%
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProductDetailsDialog 
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
      />
    </div>
  );
}