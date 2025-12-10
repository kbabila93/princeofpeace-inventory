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
import { motion } from 'framer-motion';
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
  
  // Group value by currency
  const valueByCurrency = products.reduce((acc, p) => {
    const curr = p.currency || 'USD';
    const val = (p.quantity || 0) * (p.price || 0);
    acc[curr] = (acc[curr] || 0) + val;
    return acc;
  }, {});
  
  const totalValueDisplay = Object.entries(valueByCurrency)
    .map(([curr, val]) => `${curr} ${val.toLocaleString()}`)
    .join(' + ');

  const lowStockItems = products.filter(p => (p.quantity || 0) <= (p.low_stock_threshold || 10));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Total Products" 
            value={totalProducts} 
            icon={Package} 
            color="blue"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Total Inventory Value" 
            value={totalValueDisplay || "$0"} 
            icon={DollarSign} 
            color="green"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Low Stock Alerts" 
            value={lowStockItems.length} 
            description="Items need reordering"
            icon={AlertTriangle} 
            color={lowStockItems.length > 0 ? "red" : "orange"}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Total Units" 
            value={totalItems} 
            icon={TrendingUp} 
            color="purple"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Low Stock Alerts
              </CardTitle>
              <Button variant="outline" size="sm" asChild className="hover:bg-slate-50">
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
        <motion.div variants={itemVariants}>
          <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
              <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" asChild>
                <Link to={createPageUrl("Transactions")}>
                  View All History <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </motion.div>
  );
}