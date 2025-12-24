import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, CreditCard, Package, TrendingUp } from "lucide-react";

export default function SaleDetailsDialog({ isOpen, onClose, sale }) {
  if (!sale) return null;

  const items = JSON.parse(sale.items_json || "[]");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sale Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Date & Time
              </div>
              <div className="font-medium">
                {format(new Date(sale.date), 'MMM d, yyyy h:mm a')}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                Sales Rep
              </div>
              <div className="font-medium text-indigo-600">
                {sale.sales_rep_name || sale.created_by || "System"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                Customer
              </div>
              <div className="font-medium">
                {sale.customer_name || "Walk-in Customer"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CreditCard className="w-4 h-4" />
                Payment Method
              </div>
              <div>
                <Badge variant="outline" className="capitalize">
                  {sale.payment_method}
                </Badge>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2">
              <Package className="w-4 h-4" />
              Items Sold
            </div>
            
            <div className="space-y-2">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.quantity} × {sale.currency || '$'} {Number(item.price).toFixed(2)}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">
                    {sale.currency || '$'} {(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-700">Subtotal</span>
              <span className="font-bold text-gray-900">
                {sale.currency || '$'} {(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {sale.total_profit !== undefined && (
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 font-semibold text-green-700">
                  <TrendingUp className="w-5 h-5" />
                  Profit
                </div>
                <span className="font-bold text-green-700 text-lg">
                  {sale.currency || '$'} {sale.total_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-xl pt-3 border-t">
              <span className="font-bold text-gray-900">Total Amount</span>
              <span className="font-bold text-indigo-600">
                {sale.currency || '$'} {(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Transaction ID: {sale.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}