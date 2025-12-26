import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  ArrowRight,
  History,
  Calendar,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => base44.entities.Transaction.list('-date', 5),
  });

  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['batches', 'expiring'],
    queryFn: () => base44.entities.Batch.list('expiration_date', 50), // Get 50 batches sorted by expiration date (ascending)
  });

  if (productsLoading || transactionsLoading || batchesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

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

  // Filter for batches expiring in the next 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  const expiringBatches = batches.filter(b => {
    if (!b.expiration_date) return false;
    const expDate = new Date(b.expiration_date);
    return expDate <= thirtyDaysFromNow && b.quantity > 0; // Only count active batches
  }).slice(0, 5); // Take top 5

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Low Stock Alerts */}
            <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Low Stock
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                  <Link to={createPageUrl("Inventory")}>View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-4 p-4">
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">Stock levels healthy</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.slice(0, 4).map(product => (
                      <div key={product.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${(product.quantity === 0) ? 'bg-red-500' : 'bg-orange-500'}`} />
                          <span className="truncate font-medium">{product.name}</span>
                        </div>
                        <span className="font-mono text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                          {product.quantity} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expiring Batches */}
            <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-red-500" />
                  Expiring Soon
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                  <Link to={createPageUrl("Inventory")}>View</Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-4 p-4">
                {expiringBatches.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No items expiring soon</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expiringBatches.map(batch => {
                       // Find product name if possible, assuming batches are fetched. 
                       // Since we only have product_id in batch, we might need to lookup product name from the products list we already have.
                       const product = products.find(p => p.id === batch.product_id);
                       const daysLeft = Math.ceil((new Date(batch.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
                       
                       return (
                        <div key={batch.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="truncate font-medium">{product?.name || 'Unknown Product'}</span>
                            <span className="text-xs text-gray-400">({batch.batch_number})</span>
                          </div>
                          <span className={`font-mono text-xs px-2 py-0.5 rounded ${daysLeft < 7 ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                            {daysLeft} days
                          </span>
                        </div>
                       );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>


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