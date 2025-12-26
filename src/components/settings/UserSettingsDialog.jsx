import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function UserSettingsDialog({ isOpen, onClose, user }) {
    const queryClient = useQueryClient();
    const [baseCurrency, setBaseCurrency] = useState(user?.base_currency || "USD");

    React.useEffect(() => {
        if (user?.base_currency) {
            setBaseCurrency(user.base_currency);
        }
    }, [user]);

    const mutation = useMutation({
        mutationFn: async () => {
            await base44.auth.updateMe({ base_currency: baseCurrency });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success("Settings updated successfully");
            onClose();
        },
        onError: () => {
            toast.error("Failed to update settings");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>User Settings</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="base-currency">Base Currency</Label>
                        <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                            <SelectTrigger id="base-currency">
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
                        <p className="text-xs text-gray-500">This will be used as the default currency for new products</p>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}