import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function BulkEditDialog({ isOpen, onClose, selectedIds, onComplete }) {
    const queryClient = useQueryClient();
    const [updates, setUpdates] = useState({
        category: { enabled: false, value: "other" },
        section: { enabled: false, value: "" },
        low_stock_threshold: { enabled: false, value: "10" },
        currency: { enabled: false, value: "USD" },
    });

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setUpdates({
                category: { enabled: false, value: "other" },
                section: { enabled: false, value: "" },
                low_stock_threshold: { enabled: false, value: "10" },
                currency: { enabled: false, value: "USD" },
            });
        }
    }, [isOpen]);

    const mutation = useMutation({
        mutationFn: async () => {
            const updateData = {};
            if (updates.category.enabled) updateData.category = updates.category.value;
            if (updates.section.enabled) updateData.section = updates.section.value;
            if (updates.low_stock_threshold.enabled) updateData.low_stock_threshold = Number(updates.low_stock_threshold.value);
            if (updates.currency.enabled) updateData.currency = updates.currency.value;

            if (Object.keys(updateData).length === 0) return;

            const user = await base44.auth.me().catch(() => null);
            if (user?.email) {
                updateData.last_updated_by = user.email;
            }

            // Update in batches of 5 with a small delay between batches
            const batchSize = 5;
            for (let i = 0; i < selectedIds.length; i += batchSize) {
                const batch = selectedIds.slice(i, i + batchSize);
                await Promise.all(batch.map(id => base44.entities.Product.update(id, updateData)));
                if (i + batchSize < selectedIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['products'] });
             toast.success(`Updated ${selectedIds.length} products`);
             onComplete();
             onClose();
        },
        onError: (e) => {
            console.error(e);
            toast.error(`Failed to update products: ${e.message || 'Unknown error'}`);
        }
    });

    const handleUpdateChange = (field, key, value) => {
        setUpdates(prev => ({
            ...prev,
            [field]: { ...prev[field], [key]: value }
        }));
    };

    const handleToggle = (field) => {
        setUpdates(prev => ({
            ...prev,
            [field]: { ...prev[field], enabled: !prev[field].enabled }
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bulk Edit Products</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Editing {selectedIds.length} selected products. Select the fields you want to update.
                    </p>

                    <div className="space-y-4 border rounded-md p-4">
                        {/* Category */}
                        <div className="flex items-start gap-3">
                            <Checkbox 
                                id="check-category" 
                                checked={updates.category.enabled}
                                onCheckedChange={() => handleToggle('category')}
                                className="mt-3"
                            />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="check-category" className="font-medium">Category</Label>
                                <Select 
                                    disabled={!updates.category.enabled}
                                    value={updates.category.value}
                                    onValueChange={(val) => handleUpdateChange('category', 'value', val)}
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
                        </div>

                        {/* Section */}
                        <div className="flex items-start gap-3">
                            <Checkbox 
                                id="check-section" 
                                checked={updates.section.enabled}
                                onCheckedChange={() => handleToggle('section')}
                                className="mt-3"
                            />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="check-section" className="font-medium">Section / Location</Label>
                                <Input 
                                    disabled={!updates.section.enabled}
                                    value={updates.section.value}
                                    onChange={(e) => handleUpdateChange('section', 'value', e.target.value)}
                                    placeholder="e.g. Aisle 5"
                                />
                            </div>
                        </div>

                        {/* Low Stock Threshold */}
                        <div className="flex items-start gap-3">
                            <Checkbox 
                                id="check-threshold" 
                                checked={updates.low_stock_threshold.enabled}
                                onCheckedChange={() => handleToggle('low_stock_threshold')}
                                className="mt-3"
                            />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="check-threshold" className="font-medium">Low Stock Threshold</Label>
                                <Input 
                                    type="number"
                                    disabled={!updates.low_stock_threshold.enabled}
                                    value={updates.low_stock_threshold.value}
                                    onChange={(e) => handleUpdateChange('low_stock_threshold', 'value', e.target.value)}
                                />
                            </div>
                        </div>

                         {/* Currency */}
                         <div className="flex items-start gap-3">
                            <Checkbox 
                                id="check-currency" 
                                checked={updates.currency.enabled}
                                onCheckedChange={() => handleToggle('currency')}
                                className="mt-3"
                            />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="check-currency" className="font-medium">Currency</Label>
                                <Select 
                                    disabled={!updates.currency.enabled}
                                    value={updates.currency.value}
                                    onValueChange={(val) => handleUpdateChange('currency', 'value', val)}
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
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={() => mutation.mutate()} 
                        disabled={mutation.isPending || !Object.values(updates).some(u => u.enabled)}
                    >
                        {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update Products
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}