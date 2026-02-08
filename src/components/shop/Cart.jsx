import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'sonner';

export default function Cart({ isOpen, onClose, cart, setCart }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, Math.min(item.quantity + delta, item.quantity));
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const itemsJson = JSON.stringify(cart.map(item => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })));

      await base44.entities.Order.create({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        delivery_address: customerInfo.address,
        notes: customerInfo.notes,
        items_json: itemsJson,
        total_amount: cartTotal,
        currency: cart[0]?.currency || 'USD',
        status: 'pending'
      });

      // Update product quantities
      for (const item of cart) {
        const newQty = Math.max(0, item.quantity - item.quantity);
        await base44.entities.Product.update(item.id, {
          quantity: item.quantity - item.quantity
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Order placed successfully!");
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({ name: '', email: '', phone: '', address: '', notes: '' });
      onClose();
    },
    onError: () => {
      toast.error("Failed to place order");
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    placeOrderMutation.mutate();
  };

  if (showCheckout) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          setShowCheckout(false);
          onClose();
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery Address *</Label>
              <Textarea
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={customerInfo.notes}
                onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCheckout(false)}>
                Back
              </Button>
              <Button type="submit" disabled={placeOrderMutation.isPending} className="bg-green-600 hover:bg-green-700">
                {placeOrderMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Place Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shopping Cart</DialogTitle>
        </DialogHeader>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-white rounded flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">
                      {item.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.currency || '$'}{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className="text-indigo-600">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Continue Shopping
          </Button>
          <Button 
            onClick={handleCheckout} 
            disabled={cart.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Proceed to Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}