import React from 'react';
import { format } from 'date-fns';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SalesList({ sales, isLoading }) {
    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading sales history...</div>;
    }

    if (sales.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                <p>No sales recorded yet.</p>
                <p className="text-sm mt-1">Click "New Sale" to record your first transaction.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sales.map((sale) => (
                    <TableRow key={sale.id}>
                        <TableCell className="font-medium text-gray-900">
                            {format(new Date(sale.date), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                            <span className="text-gray-600 line-clamp-1" title={sale.items_summary}>
                                {sale.items_summary || "No items details"}
                            </span>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="capitalize">
                                {sale.payment_method}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900">
                            ${(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}