import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  MapPin, 
  DollarSign, 
  BarChart3, 
  AlertCircle, 
  Calendar, 
  User,
  Tag
} from "lucide-react";
import { format } from "date-fns";

export default function ProductDetailsDialog({ isOpen, onClose, product, onEdit }) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {product.sku || 'No SKU'}
                </Badge>
                {(product.quantity || 0) <= (product.low_stock_threshold || 10) && (
                  <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Low Stock
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                {product.name}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="secondary" className="capitalize">
                    {product.category || 'Uncategorized'}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {product.section || 'Main Section'}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {product.description && (
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
                <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Selling Price
                </h4>
                <p className="text-lg font-semibold text-gray-900">
                    {product.currency} {Number(product.price).toFixed(2)}
                </p>
            </div>
            
            <div className="space-y-1">
                <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Cost Price
                </h4>
                <p className="text-lg font-semibold text-gray-700">
                    {product.cost_price ? `${product.currency} ${Number(product.cost_price).toFixed(2)}` : '-'}
                </p>
            </div>

            <div className="space-y-1">
                <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Stock Level
                </h4>
                <p className="text-lg font-semibold text-gray-900">
                    {product.quantity || 0}
                    <span className="text-xs font-normal text-gray-400 ml-1">
                        (Min: {product.low_stock_threshold || 10})
                    </span>
                </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
                <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="font-medium text-gray-900">Last Updated By</p>
                        <p className="text-gray-500">{product.last_updated_by || product.created_by || 'System'}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="font-medium text-gray-900">Last Updated</p>
                        <p className="text-gray-500">
                            {product.updated_date ? format(new Date(product.updated_date), 'PPP p') : 'Never'}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="font-medium text-gray-900">Created By</p>
                        <p className="text-gray-500">{product.created_by || 'System'}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="font-medium text-gray-900">Created On</p>
                        <p className="text-gray-500">
                            {product.created_date ? format(new Date(product.created_date), 'PPP p') : '-'}
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {onEdit && (
            <Button onClick={() => { onClose(); onEdit(product); }}>
              Edit Product
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}