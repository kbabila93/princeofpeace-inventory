import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

const generateSKU = () => {
  return 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

export default function ProductForm({ isOpen, onClose, product, initialSku }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: 'other',
    price: '',
    cost_price: '',
    quantity: 0,
    low_stock_threshold: 10,
    image_url: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen) return;
    // Only re-initialize when dialog opens, not on external product updates (e.g. React Query refetches)
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        sku: initialSku || generateSKU(),
        description: '',
        category: 'other',
        price: '',
        cost_price: '',
        quantity: 0,
        low_stock_threshold: 10,
        image_url: ''
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (product) {
        return base44.entities.Product.update(product.id, data);
      } else {
        return base44.entities.Product.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(product ? 'Product updated' : 'Product created');
      onClose();
      setFormData({
        name: '',
        sku: '',
        description: '',
        category: 'other',
        price: '',
        cost_price: '',
        quantity: 0,
        low_stock_threshold: 10,
        image_url: ''
      });
    },
    onError: (error) => {
      toast.error('Failed to save product');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>SKU / Barcode</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cost Price</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Low Stock Alert</Label>
              <Input
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              {formData.image_url && (
                <img src={formData.image_url} alt="Product" className="w-20 h-20 object-cover rounded border" />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {product ? 'Update' : 'Create'} Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}