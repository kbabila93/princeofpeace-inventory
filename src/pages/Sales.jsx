import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, DollarSign, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import NewSaleModal from '@/components/sales/NewSaleModal';
import SalesList from '@/components/sales/SalesList';

export default function SalesPage() {
    const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

    // Fetch sales for stats
    const { data: sales = [], isLoading } = useQuery({
        queryKey: ['sales'],
        queryFn: () => base44.entities.Sale.list('-date', 50),
    });

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
                <Button onClick={() => setIsNewSaleOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-5 h-5 mr-2" />
                    New Sale
                </Button>
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
                        <HistoryIcon className="w-5 h-5 text-gray-500" />
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

function HistoryIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
            <path d="M3 3v9h9" />
        </svg>
    )
}