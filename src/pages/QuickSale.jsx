import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Loader2, Plus, Minus, Check, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import BarcodeScannerDialog from '@/components/scanner/BarcodeScannerDialog';

export default function QuickSale() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sku, setSku] = useState("");
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Get SKU from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const skuParam = urlParams.get('sku');
    if (skuParam) {
      setSku(skuParam);
      lookupProduct(skuParam);
    }
  }, []);

  const lookupProduct = async (skuValue) => {
    try {
      const products = await base44.entities.Product.list();
      const found = products.find(p => p.sku === skuValue && p.status === 'active');
      
      if (found) {
        setProduct(found);
        toast.success(`Found: ${found.name}`);
      } else {
        toast.error("Product not found or inactive");
      }
    } catch (error) {
      toast.error("Failed to lookup product");
    }
  };

  const handleSearch = () => {
    if (sku.trim()) {
      lookupProduct(sku.trim());
    }
  };

  const handleScanResult = (scannedCode) => {
    setSku(scannedCode);
    lookupProduct(scannedCode);
  };

  const processSaleMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product selected");
      if (quantity <= 0) throw new Error("Invalid quantity");
      if (quantity > (product.quantity || 0)) {
        throw new Error(`Only ${product.quantity} units available`);
      }

      const saleAmount = product.price * quantity;
      const costAmount = (product.cost_price || 0) * quantity;
      const profit = saleAmount - costAmount;

      // Create sale record
      await base44.entities.Sale.create({
        date: new Date().toISOString(),
        total_amount: saleAmount,
        currency: product.currency || 'USD',
        total_profit: profit,
        payment_method: paymentMethod,
        customer_id: null,
        customer_name: "Walk-in Customer",
        sales_rep_name: user?.full_name || user?.email || "Quick Sale",
        items_summary: `${quantity}x ${product.name}`,
        items_json: JSON.stringify([{
          product_id: product.id,
          name: product.name,
          price: product.price,
          cost_price: product.cost_price || 0,
          quantity: quantity
        }])
      });

      // Create transaction
      await base44.entities.Transaction.create({
        product_id: product.id,
        product_name: product.name,
        type: "out",
        quantity: quantity,
        reason: "Quick Sale",
        date: new Date().toISOString()
      });

      // Update stock
      const newQty = Math.max(0, (product.quantity || 0) - quantity);
      await base44.entities.Product.update(product.id, { quantity: newQty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast.success("Sale completed successfully!");
      
      // Reset for next sale
      setProduct(null);
      setSku("");
      setQuantity(1);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to process sale");
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handleCompleteSale = () => {
    setIsProcessing(true);
    processSaleMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Quick Sale</h1>
          <p className="text-gray-600 mt-2">Scan or enter product SKU to start</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Lookup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter or scan SKU..."
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="text-lg"
                autoFocus
              />
              <Button onClick={handleSearch} disabled={!sku.trim()}>
                Search
              </Button>
              <Button onClick={() => setIsScannerOpen(true)} variant="outline">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {product && (
          <Card className="border-2 border-indigo-200 bg-indigo-50/50">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">
                      {product.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.sku}</p>
                  <p className="text-lg font-semibold text-indigo-600 mt-1">
                    {product.currency} {product.price}
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.quantity} units in stock
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={product.quantity || 0}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center text-xl font-bold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min((product.quantity || 0), quantity + 1))}
                    disabled={quantity >= (product.quantity || 0)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {product.currency} {(product.price * quantity).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Est. Profit:</span>
                  <span className="font-semibold text-green-600">
                    {product.currency} {(((product.price - (product.cost_price || 0)) * quantity)).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCompleteSale}
                disabled={isProcessing || quantity > (product.quantity || 0)}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Complete Sale
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Sales'))}
            className="text-indigo-600"
          >
            View All Sales
          </Button>
        </div>
      </div>

      <BarcodeScannerDialog 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
      />
    </div>
  );
}