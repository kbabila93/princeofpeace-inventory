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
import { Button } from "@/components/ui/button";
import { Printer, User } from "lucide-react";
import { toast } from "sonner";

export default function SalesList({ sales, isLoading }) {
    const handlePrintReceipt = (sale) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        
        if (!printWindow) {
            toast.error("Please allow popups to print receipts");
            return;
        }

        const items = JSON.parse(sale.items_json || "[]");
        const dateStr = format(new Date(sale.date), 'MMM d, yyyy h:mm a');
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Receipt - ${sale.id}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <style>
                  body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; margin: 0 auto; }
                  .header { text-align: center; margin-bottom: 20px; }
                  .store-name { font-size: 24px; font-weight: bold; }
                  .meta { font-size: 12px; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                  .items { width: 100%; font-size: 14px; margin-bottom: 20px; }
                  .items td { padding: 2px 0; }
                  .items .price { text-align: right; }
                  .total { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; text-align: right; margin-bottom: 20px; }
                  .footer { text-align: center; font-size: 12px; margin-top: 30px; }
                  #barcode { width: 100%; height: 50px; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="store-name">StockFlow</div>
                  <div>Sales Receipt</div>
                </div>
                
                <div class="meta">
                  Date: ${dateStr}<br/>
                  Customer: ${sale.customer_name || 'Walk-in Customer'}<br/>
                  Sale ID: ${sale.id.substring(0, 8)}...
                </div>
                
                <table class="items">
                  ${items.map(item => `
                    <tr>
                      <td>${item.quantity}x ${item.name}</td>
                      <td class="price">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </table>
                
                <div class="total">
                  Total: ${sale.currency || '$'} ${Number(sale.total_amount).toFixed(2)}
                </div>
                
                <div class="footer">
                  <svg id="barcode"></svg>
                  <p>Thank you for your business!</p>
                </div>

                <script>
                  try {
                    JsBarcode("#barcode", "${sale.id}", {
                      format: "CODE128",
                      width: 2,
                      height: 40,
                      displayValue: false
                    });
                    setTimeout(() => window.print(), 500);
                  } catch(e) { console.error(e); }
                </script>
              </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };
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
                    <TableHead>Sales Rep</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sales.map((sale) => (
                    <TableRow key={sale.id}>
                        <TableCell className="font-medium text-gray-900">
                            {format(new Date(sale.date), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                            <span className="text-sm font-medium text-indigo-600">
                                {sale.sales_rep_name || sale.created_by || "System"}
                            </span>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 text-gray-700">
                                <User className="w-3 h-3 text-gray-400" />
                                {sale.customer_name || "Walk-in"}
                            </div>
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
                        <TableCell className="text-right text-green-600 font-medium">
                            {sale.total_profit !== undefined ? `${sale.currency || '$'} ${sale.total_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900">
                            {sale.currency || '$'} {(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handlePrintReceipt(sale)}
                                title="Print Receipt"
                            >
                                <Printer className="w-4 h-4 text-gray-500" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}