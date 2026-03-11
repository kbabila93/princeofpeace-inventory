import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, TrendingDown, AlertTriangle, DollarSign, MapPin, XCircle } from "lucide-react";

export default function Dashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
  });

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const lowStockItems = products.filter(p => (p.quantity || 0) <= (p.low_stock_threshold || 10)).length;
  const totalValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
  const outOfStockProducts = products.filter(p => (p.quantity || 0) === 0);

  const recentTransactions = transactions.slice(0, 10);

  const productsBySection = products.reduce((acc, p) => {
    const section = p.section || 'Main';
    if (!acc[section]) acc[section] = { count: 0, quantity: 0, value: 0 };
    acc[section].count += 1;
    acc[section].quantity += (p.quantity || 0);
    acc[section].value += (p.quantity || 0) * (p.price || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Stock</CardTitle>
            <TrendingDown className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            Stock by Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(productsBySection).sort((a, b) => b[1].quantity - a[1].quantity).map(([section, data]) => (
              <div key={section} className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-indigo-800 truncate">{section}</span>
                  <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">{data.count} SKUs</span>
                </div>
                <p className="text-2xl font-bold text-indigo-900">{data.quantity.toLocaleString()}</p>
                <p className="text-xs text-indigo-500 mt-1">units · ${data.value.toFixed(2)} value</p>
              </div>
            ))}
            {Object.keys(productsBySection).length === 0 && (
              <p className="text-sm text-gray-500 col-span-3">No location data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {outOfStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Out of Stock ({outOfStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outOfStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-gray-500">{product.sku || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">{product.section || 'Main'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {product.currency} {product.price?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet</p>
            ) : (
              recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{txn.product_name}</p>
                    <p className="text-sm text-gray-500">{txn.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${txn.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'in' ? '+' : '-'}{txn.quantity}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(txn.date || txn.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}