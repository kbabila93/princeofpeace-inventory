import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function RecordDamageDialog({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  // Only show active products
  const activeProducts = products.filter(p => p.status === 'active');
  
  const filteredProducts = activeProducts.filter(p => 
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId);

  const recordDamageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Please select a product");
      if (!quantity || Number(quantity) <= 0) throw new Error("Please enter a valid quantity");
      if (!reason) throw new Error("Please select a reason");

      const damageQty = Number(quantity);
      const currentQty = selectedProduct.quantity || 0;

      if (damageQty > currentQty) {
        throw new Error(`Cannot damage ${damageQty} items. Only ${currentQty} available.`);
      }

      const newQuantity = currentQty - damageQty;

      // Update product quantity (remove from active stock)
      await base44.entities.Product.update(selectedProduct.id, {
        quantity: newQuantity,
        last_updated_by: user?.email
      });

      // Create transaction record
      await base44.entities.Transaction.create({
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        type: 'out',
        quantity: damageQty,
        reason: `Damaged: ${reason}${notes ? ' - ' + notes : ''}`,
        authorized_by: user?.full_name || user?.email || 'System',
        date: new Date().toISOString()
      });

      // Check if damaged product already exists
      const damagedProducts = products.filter(p => 
        p.status === 'damaged' && 
        p.sku === selectedProduct.sku &&
        p.name === selectedProduct.name
      );

      if (damagedProducts.length > 0) {
        // Update existing damaged product record
        const existing = damagedProducts[0];
        await base44.entities.Product.update(existing.id, {
          quantity: (existing.quantity || 0) + damageQty,
          description: `${existing.description || ''}\n[${new Date().toLocaleDateString()}] +${damageQty} - ${reason}${notes ? ': ' + notes : ''}`.trim(),
          image_url: imageUrl || existing.image_url,
          last_updated_by: user?.email
        });
      } else {
        // Create new damaged product record
        await base44.entities.Product.create({
          name: selectedProduct.name,
          sku: selectedProduct.sku + '-DMG',
          description: `Damaged items from: ${selectedProduct.name}\n[${new Date().toLocaleDateString()}] ${reason}${notes ? ': ' + notes : ''}`,
          category: selectedProduct.category,
          section: selectedProduct.section,
          status: 'damaged',
          cost_price: selectedProduct.cost_price,
          price: selectedProduct.price,
          currency: selectedProduct.currency,
          quantity: damageQty,
          low_stock_threshold: 0,
          image_url: imageUrl || selectedProduct.image_url,
          last_updated_by: user?.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success("Damage recorded successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record damage");
    }
  });

  const handleClose = () => {
    setSelectedProductId("");
    setQuantity("");
    setReason("");
    setNotes("");
    setSearchTerm("");
    setImageUrl("");
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      if (response?.file_url) {
        setImageUrl(response.file_url);
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    recordDamageMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Record Damaged Inventory
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Product</Label>
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product..." />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500 text-center">No products found</div>
                ) : (
                  filteredProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - Stock: {p.quantity}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-900">Current Stock: {selectedProduct.quantity}</p>
              <p className="text-blue-700 text-xs mt-1">SKU: {selectedProduct.sku}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantity Damaged</Label>
            <Input
              type="number"
              min="1"
              max={selectedProduct?.quantity || 0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manufacturing Defect">Manufacturing Defect</SelectItem>
                <SelectItem value="Shipping Damage">Shipping Damage</SelectItem>
                <SelectItem value="Customer Return">Customer Return</SelectItem>
                <SelectItem value="Storage Damage">Storage Damage</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Water Damage">Water Damage</SelectItem>
                <SelectItem value="Physical Damage">Physical Damage</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Damage Photo (Optional)</Label>
            <div className="flex items-start gap-4">
              {imageUrl ? (
                <div className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                  <img 
                    src={imageUrl} 
                    alt="Damage preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 bg-gray-50">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                </div>
              )}
              
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Photo
                </Button>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or enter image URL..."
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={recordDamageMutation.isPending || !selectedProductId}
              className="bg-red-600 hover:bg-red-700"
            >
              {recordDamageMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Damage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}