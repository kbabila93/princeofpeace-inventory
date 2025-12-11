import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Upload, Image as ImageIcon, X, Camera } from "lucide-react";
import { toast } from "sonner";
import CameraCaptureDialog from './CameraCaptureDialog';

const generateSKU = () => {
  return "PRD-" + Math.floor(10000000 + Math.random() * 90000000).toString();
};

export default function ProductForm({ isOpen, onClose, product, initialSku }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(product || {
    name: "",
    sku: initialSku || generateSKU(),
    category: "other",
    section: "Main",
    price: "",
    currency: "USD",
    cost_price: "",
    quantity: "0",
    low_stock_threshold: "10",
    description: "",
    image_url: ""
  });

  React.useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData(product);
      } else {
        setFormData({
            name: "",
            sku: initialSku || generateSKU(),
            category: "other",
            section: "Main",
            price: "",
            currency: "USD",
            cost_price: "",
            quantity: "0",
            low_stock_threshold: "10",
            description: "",
            image_url: ""
        });
      }
    }
  }, [isOpen, product, initialSku]);

  const isEditing = !!product;
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file: file });
      if (response && response.file_url) {
        setFormData(prev => ({ ...prev, image_url: response.file_url }));
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    handleFileUpload(e.target.files[0]);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        price: Number(data.price),
        cost_price: Number(data.cost_price),
        quantity: Number(data.quantity),
        low_stock_threshold: Number(data.low_stock_threshold)
      };
      
      if (isEditing) {
        return base44.entities.Product.update(product.id, payload);
      } else {
        return base44.entities.Product.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Product ${isEditing ? 'updated' : 'created'} successfully`);
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} product`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('name')?.focus();
                    }
                  }}
                  placeholder="Auto-generated"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  title="Generate new SKU"
                  onClick={() => setFormData({...formData, sku: generateSKU()})}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {formData.sku && (
                <div className="mt-2 flex justify-center bg-white p-2 border rounded-md">
                  <img 
                    src={`https://bwipjs-api.metafloor.org/?bcid=code128&text=${encodeURIComponent(formData.sku)}&scale=2&height=10&incltext=true`} 
                    alt="Barcode Preview" 
                    className="max-h-12 object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({...formData, category: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
                  <Label htmlFor="section">Section / Location</Label>
                  <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                  placeholder="e.g. Aisle 1, Warehouse A"
                  />
                  </div>
                  <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(val) => setFormData({...formData, currency: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="NGN">NGN (₦)</SelectItem>
                  <SelectItem value="ZAR">ZAR (R)</SelectItem>
                  <SelectItem value="KES">KES (KSh)</SelectItem>
                  <SelectItem value="GHS">GHS (₵)</SelectItem>
                  <SelectItem value="EGP">EGP (E£)</SelectItem>
                  <SelectItem value="XOF">XOF (CFA)</SelectItem>
                  <SelectItem value="XAF">XAF (FCFA)</SelectItem>
                  <SelectItem value="TZS">TZS (TSh)</SelectItem>
                  <SelectItem value="UGX">UGX (USh)</SelectItem>
                  <SelectItem value="ETB">ETB (Br)</SelectItem>
                  <SelectItem value="MAD">MAD (DH)</SelectItem>
                  </SelectContent>
              </Select>
              </div>
              <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price ($)</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                disabled={isEditing} // Prevent direct edit of quantity, use adjustment instead
                className={isEditing ? "bg-gray-100" : ""}
              />
              {isEditing && <p className="text-xs text-gray-500">Use stock IN/OUT to change quantity</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Low Stock Alert Level</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-start gap-4">
              {formData.image_url ? (
                <div className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                  <img 
                    src={formData.image_url} 
                    alt="Product preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
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
                <div className="flex gap-2">
                  <Input
                    id="image_upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={isUploading}
                    onClick={() => document.getElementById('image_upload').click()}
                    className="flex-1 sm:flex-none"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={isUploading}
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 sm:flex-none"
                    title="Take Photo"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Or enter URL manually:
                </div>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <CameraCaptureDialog 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFileUpload}
      />
    </Dialog>
  );
}