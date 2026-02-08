import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-16 h-16 text-gray-300" />
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
          <Badge variant="secondary" className="text-xs capitalize shrink-0">
            {product.category}
          </Badge>
        </div>
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-indigo-600">
              {product.currency || '$'}{Number(product.price).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">{product.quantity} in stock</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => onAddToCart(product)} 
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={product.quantity === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}