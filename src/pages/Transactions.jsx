import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Trash2, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Transactions() {
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 100), // Get last 100 transactions
  });

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' || t.type === filterType
  );

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const promises = transactions.map(tx => base44.entities.Transaction.delete(tx.id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success("All recent transactions cleared");
      setIsDeleting(false);
    },
    onError: () => {
      toast.error("Failed to clear transactions");
      setIsDeleting(false);
    }
  });

  const handleDeleteAll = () => {
    if (transactions.length === 0) return;
    if (confirm("Are you sure you want to delete all recent transactions? This cannot be undone.")) {
      setIsDeleting(true);
      deleteAllMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-500">View recent stock movements</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="destructive" 
            onClick={handleDeleteAll}
            disabled={transactions.length === 0 || isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Clear History
          </Button>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="in">Stock In</SelectItem>
              <SelectItem value="out">Stock Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-gray-500 text-sm">
                    {format(new Date(tx.date), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={
                        tx.type === 'in' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-red-100 text-red-700 border-red-200'
                      }
                    >
                      {tx.type === 'in' ? (
                        <><ArrowDownRight className="w-3 h-3 mr-1" /> In</>
                      ) : (
                        <><ArrowUpRight className="w-3 h-3 mr-1" /> Out</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tx.product_name}</TableCell>
                  <TableCell className={tx.type === 'in' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                  </TableCell>
                  <TableCell className="text-gray-600 capitalize">
                    {tx.reason}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}