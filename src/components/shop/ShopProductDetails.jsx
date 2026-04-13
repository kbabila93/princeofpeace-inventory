import React from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart } from 'lucide-react';

export default function ShopProductDetails({ product, onClose, onAddToCart }) {
  if (!product) return null;

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <div className="flex flex-col gap-4">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-24 h-24 text-gray-300" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="capitalize text-xs">{product.category}</Badge>
              {product.sku && <Badge variant="outline" className="text-xs">{product.sku}</Badge>}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-3xl font-bold text-indigo-600">
                {product.currency || '$'}{Number(product.price).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{product.quantity} units in stock</p>
            </div>
            <Badge className={product.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
              {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
            </Badge>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-row justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={product.quantity === 0}
            onClick={() => { onAddToCart(product); onClose(); }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}