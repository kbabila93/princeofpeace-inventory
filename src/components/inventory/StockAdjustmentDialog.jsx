import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StockAdjustmentDialog({ isOpen, onClose, product, type }) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const queryClient = useQueryClient();

  const isStockIn = type === 'in';
  
  const adjustStockMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Create transaction record
      await base44.entities.Transaction.create({
        product_id: product.id,
        product_name: product.name,
        type: type,
        quantity: Number(data.quantity),
        reason: data.reason === 'other' ? data.customReason : data.reason,
        date: new Date().toISOString()
      });

      // 2. Update product quantity
      const newQuantity = isStockIn 
        ? (product.quantity || 0) + Number(data.quantity)
        : (product.quantity || 0) - Number(data.quantity);

      if (newQuantity < 0) {
        throw new Error("Insufficient stock");
      }

      await base44.entities.Product.update(product.id, {
        quantity: newQuantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Stock ${isStockIn ? 'added' : 'removed'} successfully`);
      onClose();
      setQuantity("");
      setReason("");
      setCustomReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update stock");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    adjustStockMutation.mutate({ quantity, reason, customReason });
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isStockIn ? 'Add Stock' : 'Remove Stock'} - {product.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Quantity</Label>
            <div className="text-2xl font-bold">{product.quantity || 0}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to {isStockIn ? 'Add' : 'Remove'}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {isStockIn ? (
                  <>
                    <SelectItem value="purchase">New Purchase</SelectItem>
                    <SelectItem value="return">Customer Return</SelectItem>
                    <SelectItem value="found">Inventory Found</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="damage">Damage / Expired</SelectItem>
                    <SelectItem value="theft">Loss / Theft</SelectItem>
                    <SelectItem value="internal">Internal Use</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Specify Reason</Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter details..."
                required
              />
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              className={isStockIn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              disabled={adjustStockMutation.isPending}
            >
              {adjustStockMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isStockIn ? 'Add to Inventory' : 'Remove from Inventory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}