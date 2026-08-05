import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, Printer, XCircle, Package, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';

const CURRENCY_SYMBOLS = {
    USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', JPY: '¥',
    INR: '₹', NGN: '₦', ZAR: 'R', KES: 'KSh', GHS: '₵', EGP: 'E£',
    XOF: 'CFA', XAF: 'FCFA', TZS: 'TSh', UGX: 'USh', ETB: 'Br', MAD: 'DH',
};
const currencySymbol = (c) => CURRENCY_SYMBOLS[c] || '$';
const formatPrice = (amount, currency) => `${currencySymbol(currency)}${Number(amount || 0).toFixed(2)}`;

export default function OutOfStockReport() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const outOfStockProducts = useMemo(() => {
    return products.filter(p => (p.quantity || 0) === 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return outOfStockProducts.filter(p => {
      const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
                          (p.sku || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchSection = sectionFilter === "all" || (p.section || "Main") === sectionFilter;
      return matchSearch && matchCategory && matchSection;
    });
  }, [outOfStockProducts, search, categoryFilter, sectionFilter]);

  const sections = useMemo(() => {
    const set = new Set(products.map(p => p.section || "Main"));
    return Array.from(set).sort();
  }, [products]);

  const totalValue = filteredProducts.reduce((s, p) => s + (p.price || 0), 0);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(220, 38, 38);
    doc.text("Out of Stock Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    doc.text(`Total out-of-stock items: ${filteredProducts.length}`, 14, 33);

    // Headers
    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.setFillColor(220, 38, 38);
    doc.rect(14, 38, 182, 8, 'F');
    doc.text("#", 16, 43);
    doc.text("Product", 24, 43);
    doc.text("SKU", 80, 43);
    doc.text("Category", 110, 43);
    doc.text("Section", 140, 43);
    doc.text("Price", 175, 43);

    // Rows
    let y = 52;
    doc.setTextColor(60);
    filteredProducts.forEach((p, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 5, 182, 7, 'F');
      }
      doc.text(String(i + 1), 16, y);
      doc.text((p.name || '').substring(0, 30), 24, y);
      doc.text((p.sku || '-').substring(0, 15), 80, y);
      doc.text((p.category || '-'), 110, y);
      doc.text((p.section || 'Main'), 140, y);
      doc.text(formatPrice(p.price, p.currency), 175, y);
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("out-of-stock-report.pdf");
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Out of Stock Report</title><style>
      body{font-family:sans-serif;padding:20px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#fee2e2;color:#991b1b}
      h2{color:#dc2626}
    </style></head><body>
    <h2>Out of Stock Products Report</h2>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Total items: ${filteredProducts.length}</p>
    <table><thead><tr><th>#</th><th>Product</th><th>SKU</th><th>Category</th><th>Section</th><th>Price</th></tr></thead>
    <tbody>${filteredProducts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.sku || '-'}</td><td>${p.category || '-'}</td><td>${p.section || 'Main'}</td><td>${formatPrice(p.price, p.currency)}</td></tr>`).join('')}</tbody></table>
    </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <XCircle className="w-8 h-8 text-red-600" />
            Out of Stock Report
          </h1>
          <p className="text-gray-500 mt-1">Products with zero stock that need replenishment</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">
                {products.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= (p.low_stock_threshold || 10)).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name or SKU..."
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
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Low Stock Threshold</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">Loading...</TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  {outOfStockProducts.length === 0 ? "No out-of-stock products 🎉" : "No products match your filters"}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell className="text-gray-400">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">
                            {product.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">{product.sku || '-'}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{product.category || 'other'}</Badge></TableCell>
                  <TableCell className="text-gray-600">{product.section || 'Main'}</TableCell>
                  <TableCell className="text-gray-600">{product.low_stock_threshold || 10}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(product.price, product.currency)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {filteredProducts.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-red-200 bg-red-50 font-semibold text-sm">
                <td className="p-2" />
                <td className="p-2 text-red-700">Totals ({filteredProducts.length} products)</td>
                <td className="p-2" />
                <td className="p-2" />
                <td className="p-2" />
                <td className="p-2" />
                <td className="p-2 text-right text-gray-700">{formatPrice(totalValue, 'USD')}</td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  );
}