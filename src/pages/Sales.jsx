import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, DollarSign, Calendar, History, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { toast } from "sonner";
import NewSaleModal from '@/components/sales/NewSaleModal.jsx';
import SalesList from '@/components/sales/SalesList.jsx';

export default function SalesPage() {
    const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();

    // Fetch current user for permissions
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    const canDelete = user?.role === 'admin' || (user?.permissions || []).includes('delete_sales');

    // Fetch sales for stats
    const { data: sales = [], isLoading } = useQuery({
        queryKey: ['sales'],
        queryFn: () => base44.entities.Sale.list('-date', 50),
    });

    const deleteSalesMutation = useMutation({
        mutationFn: async () => {
            // Delete sales one by one or utilize a hypothetical bulk delete if available.
            // Since we only have 'list' and 'delete' by ID usually exposed effectively in these examples,
            // we will map over the currently fetched sales (or fetch all ids if we want to be thorough, but let's stick to visible/fetched ones for safety or just assume the user wants to clear the list).
            // NOTE: A true "Clear All" for a large DB should be a backend function, but here we'll iterate.
            // Let's rely on the sales we have or fetch a larger list if needed.
            // For now, let's delete the loaded sales.
            const promises = sales.map(s => base44.entities.Sale.delete(s.id));
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            toast.success("Sales history cleared");
            setIsDeleting(false);
        },
        onError: () => {
            toast.error("Failed to clear sales history");
            setIsDeleting(false);
        }
    });

    const handleClearHistory = () => {
        if (sales.length === 0) return;
        if (confirm("Are you sure you want to delete all visible sales records? This cannot be undone.")) {
            setIsDeleting(true);
            deleteSalesMutation.mutate();
        }
    };

    // Calculate daily stats
    const todayStr = new Date().toDateString();
    const salesToday = sales.filter(s => new Date(s.date).toDateString() === todayStr);
    const totalToday = salesToday.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const countToday = salesToday.length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sales</h2>
                    <p className="text-gray-500">Record and track your daily sales.</p>
                </div>
                <div className="flex gap-2">
                    {canDelete && (
                        <Button 
                            variant="destructive" 
                            onClick={handleClearHistory}
                            disabled={sales.length === 0 || isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Clear History
                        </Button>
                    )}
                    <Button onClick={() => setIsNewSaleOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-5 h-5 mr-2" />
                        New Sale
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Sales Today</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalToday.toLocaleString()}</div>
                        <p className="text-xs text-gray-500">{countToday} transactions today</p>
                    </CardContent>
                </Card>
                {/* We could add more stats here later like 'This Week' or 'Average Sale' */}
            </div>

            {/* Sales History List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-500" />
                        Recent Sales
                    </h3>
                </div>
                <SalesList sales={sales} isLoading={isLoading} />
            </div>

            {/* New Sale Modal */}
            <NewSaleModal 
                isOpen={isNewSaleOpen} 
                onClose={() => setIsNewSaleOpen(false)} 
            />
        </div>
    );
}