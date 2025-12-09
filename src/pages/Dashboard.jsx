import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  ArrowRight,
  History
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => base44.entities.Transaction.list('-date', 5),
  });

  // Calculate stats
  const totalProducts = products.length;
  const totalItems = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
  const lowStockItems = products.filter(p => (p.quantity || 0) <= (p.low_stock_threshold || 10));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Products" 
          value={totalProducts} 
          icon={Package} 
          color="blue"
        />
        <StatsCard 
          title="Total Inventory Value" 
          value={`$${totalValue.toLocaleString()}`} 
          icon={DollarSign} 
          color="green"
        />
        <StatsCard 
          title="Low Stock Alerts" 
          value={lowStockItems.length} 
          description="Items need reordering"
          icon={AlertTriangle} 
          color={lowStockItems.length > 0 ? "red" : "orange"}
        />
        <StatsCard 
          title="Total Units" 
          value={totalItems} 
          icon={TrendingUp} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alerts</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl("Inventory")}>View All Inventory</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-green-50 rounded-full">
                    <Package className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <p>All stock levels are healthy!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockItems.slice(0, 5).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-white border flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-xs text-red-600 font-medium">
                          Only {product.quantity} left (Threshold: {product.low_stock_threshold})
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" asChild>
                      <Link to={createPageUrl("Inventory")}>Restock</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      tx.type === 'in' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.type === 'in' ? 'Restocked' : 'Removed'} {tx.quantity} {tx.product_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(tx.date), 'MMM d, h:mm a')} • {tx.reason}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="ghost" size="sm" className="w-full text-gray-500" asChild>
                <Link to={createPageUrl("Transactions")}>
                  View All History <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}