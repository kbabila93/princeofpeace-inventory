import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ShoppingCart, ScanBarcode, Grid3x3 } from 'lucide-react';
import ScanLookupDialog from '@/components/inventory/ScanLookupDialog';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

export default function SectionSaleModal({ isOpen, onClose, section, products }) {
    const queryClient = useQueryClient();
    const [cart, setCart] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [qty, setQty] = useState(1);
    const [unitPrice, setUnitPrice] = useState("");
    const [saleDate, setSaleDate] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [selectedCustomerId, setSelectedCustomerId] = useState("walk-in");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanOpen, setIsScanOpen] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => base44.entities.Customer.list(),
        enabled: isOpen
    });

    useEffect(() => {
        if (isOpen) {
            setCart([]);
            setPaymentMethod("cash");
            setSelectedCustomerId("walk-in");
            setCurrency("USD");
            setSaleDate(new Date().toISOString().split('T')[0]);
            setIsSubmitting(false);
            setQty(1);
            setUnitPrice("");
            setSelectedProductId("");
        }
    }, [isOpen]);

    useEffect(() => {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
            setUnitPrice(product.price || 0);
        } else {
            setUnitPrice("");
        }
    }, [selectedProductId, products]);

    const selectedProduct = products.find(p => p.id === selectedProductId);

    const addItemToCart = (product, quantity, price) => {
        if (!product) return;
        
        const amountToAdd = Number(quantity);
        const pricePerUnit = Number(price);

        if (amountToAdd <= 0) return;
        if (pricePerUnit < 0) return;

        const availableStock = product.quantity || 0;
        const existingItemIndex = cart.findIndex(item => item.product_id === product.id);
        const currentInCart = existingItemIndex >= 0 ? cart[existingItemIndex].quantity : 0;
        
        if (currentInCart + amountToAdd > availableStock) {
            toast.error(`Cannot add ${amountToAdd} items. Only ${availableStock - currentInCart} more available in stock.`);
            return;
        }
        
        if (existingItemIndex >= 0) {
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += amountToAdd;
            newCart[existingItemIndex].price = pricePerUnit;
            setCart(newCart);
        } else {
            setCart([...cart, {
                product_id: product.id,
                name: product.name,
                price: pricePerUnit,
                cost_price: product.cost_price || 0,
                quantity: amountToAdd
            }]);
        }
    };

    const addToCart = () => {
        addItemToCart(selectedProduct, qty, unitPrice);
        setSelectedProductId("");
        setQty(1);
        setUnitPrice("");
    };

    const handleScanResult = ({ sku, product }) => {
        if (product) {
            // Check if product is from this section
            if ((product.section || "Main") === section) {
                addItemToCart(product, 1, product.price || 0);
                toast.success(`Added ${product.name} to cart`);
            } else {
                toast.error(`Product is from section "${product.section || "Main"}", not "${section}"`);
            }
        } else {
            toast.error(`Product not found for SKU: ${sku}`);
        }
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartTotalCost = cart.reduce((sum, item) => sum + ((item.cost_price || 0) * item.quantity), 0);
    const cartProfit = cartTotal - cartTotalCost;

    const handleCompleteSale = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);

        try {
            const itemsSummary = cart.map(i => `${i.quantity}x ${i.name}`).join(", ");
            const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
            
            const saleData = {
                date: new Date(saleDate).toISOString(),
                total_amount: cartTotal,
                currency: currency,
                total_profit: cartProfit,
                payment_method: paymentMethod,
                customer_id: selectedCustomerId === "walk-in" ? null : selectedCustomerId,
                customer_name: selectedCustomerId === "walk-in" ? "Walk-in Customer" : selectedCustomer?.name,
                sales_rep_name: user?.full_name || user?.email || "Unknown",
                items_summary: itemsSummary,
                items_json: JSON.stringify(cart)
            };

            await base44.entities.Sale.create(saleData);

            const inventoryPromises = cart.map(async (item) => {
                await base44.entities.Transaction.create({
                    product_id: item.product_id,
                    product_name: item.name,
                    type: "out",
                    quantity: item.quantity,
                    reason: `Sale (${section})`,
                    date: new Date(saleDate).toISOString()
                });

                const currentProduct = products.find(p => p.id === item.product_id);
                if (currentProduct) {
                    const newQty = Math.max(0, (currentProduct.quantity || 0) - item.quantity);
                    await base44.entities.Product.update(item.product_id, { quantity: newQty });
                }
            });

            await Promise.all(inventoryPromises);

            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success(`Sale completed for ${section}`);
            onClose();

        } catch (error) {
            console.error("Failed to process sale:", error);
            toast.error("Failed to process sale. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Grid3x3 className="w-6 h-6 text-indigo-600" />
                        New Sale - {section}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-100">
                        <div className="space-y-2">
                            <Label>Customer</Label>
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                                    {customers.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                            <div className="sm:col-span-5 space-y-2">
                                <Label>Product</Label>
                                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(product => {
                                            const isOutOfStock = (product.quantity || 0) <= 0;
                                            return (
                                                <SelectItem 
                                                    key={product.id} 
                                                    value={product.id}
                                                    disabled={isOutOfStock}
                                                >
                                                    {product.name} ({product.quantity || 0} in stock)
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <Label>Qty</Label>
                                <Input 
                                    type="number" 
                                    min="1" 
                                    max={selectedProduct ? (selectedProduct.quantity || 0) : 999}
                                    value={qty} 
                                    onChange={(e) => setQty(e.target.value)} 
                                />
                            </div>
                            <div className="sm:col-span-3 space-y-2">
                                <Label>Price</Label>
                                <Input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    value={unitPrice} 
                                    onChange={(e) => setUnitPrice(e.target.value)} 
                                    placeholder="Price"
                                />
                            </div>
                            <div className="sm:col-span-2 flex gap-2">
                                <Button onClick={addToCart} disabled={!selectedProductId} className="flex-1 bg-indigo-600">
                                    <Plus className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => setIsScanOpen(true)} variant="outline" className="flex-1" title="Scan Barcode">
                                    <ScanBarcode className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <h4 className="font-semibold text-gray-900">Current Items</h4>
                            <span className="text-sm text-gray-500">{cart.length} items</span>
                        </div>
                        
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 italic">
                                No items added yet
                            </div>
                        ) : (
                            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 border rounded-md shadow-sm">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.quantity} x ${item.price}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-900">
                                                ${(item.quantity * item.price).toFixed(2)}
                                            </span>
                                            <button 
                                                onClick={() => removeFromCart(idx)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total Amount</span>
                                <span className="text-indigo-600">${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Est. Profit</span>
                                <span className={cartProfit >= 0 ? "text-green-600" : "text-red-500"}>
                                    ${cartProfit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Sale Date</Label>
                                <Input
                                    type="date"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="NGN">NGN</SelectItem>
                                    </SelectContent>
                                </Select>
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
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCompleteSale} 
                        disabled={cart.length === 0 || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isSubmitting ? "Processing..." : "Complete Sale"}
                    </Button>
                </DialogFooter>
                <ScanLookupDialog 
                    isOpen={isScanOpen} 
                    onClose={() => setIsScanOpen(false)} 
                    onScan={handleScanResult} 
                />
            </DialogContent>
        </Dialog>
    );
}