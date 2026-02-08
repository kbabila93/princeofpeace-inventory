import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'sonner';
import { Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export default function StockAdjustmentDialog({ isOpen, onClose, product, type }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!product || !quantity) return;

      const qty = parseInt(quantity);
      const newQuantity = type === 'in' 
        ? (product.quantity || 0) + qty
        : Math.max(0, (product.quantity || 0) - qty);

      // Create transaction
      await base44.entities.Transaction.create({
        product_id: product.id,
        product_name: product.name,
        type: type,
        quantity: qty,
        reason: reason || (type === 'in' ? 'Stock added' : 'Stock removed'),
        date: new Date().toISOString()
      });

      // Update product quantity
      await base44.entities.Product.update(product.id, {
        quantity: newQuantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Stock updated');
      onClose();
      setQuantity('');
      setReason('');
    },
    onError: () => {
      toast.error('Failed to update stock');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'in' ? (
              <>
                <ArrowDownCircle className="w-5 h-5 text-green-600" />
                Add Stock
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-5 h-5 text-red-600" />
                Remove Stock
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Product</p>
            <p className="font-semibold">{product.name}</p>
            <p className="text-sm text-gray-600 mt-2">Current Stock: <span className="font-medium">{product.quantity || 0}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={type === 'in' ? 'e.g., New delivery, Restock' : 'e.g., Sale, Damage, Loss'}
                rows={3}
              />
            </div>

            {quantity && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">New stock level will be:</p>
                <p className="text-xl font-bold text-blue-600">
                  {type === 'in' 
                    ? (product.quantity || 0) + parseInt(quantity)
                    : Math.max(0, (product.quantity || 0) - parseInt(quantity))
                  }
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className={type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {type === 'in' ? 'Add' : 'Remove'} Stock
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}