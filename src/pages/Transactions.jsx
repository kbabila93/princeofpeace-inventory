import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, ArrowDownCircle, ArrowUpCircle, Settings } from "lucide-react";

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date'),
  });

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = (txn.product_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || txn.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in">Stock In</SelectItem>
            <SelectItem value="out">Stock Out</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">Loading...</Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">No transactions found</Card>
        ) : (
          filteredTransactions.map((txn) => (
            <Card key={txn.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    txn.type === 'in' ? 'bg-green-100' : txn.type === 'out' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {txn.type === 'in' ? (
                      <ArrowDownCircle className="w-5 h-5 text-green-600" />
                    ) : txn.type === 'out' ? (
                      <ArrowUpCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Settings className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{txn.product_name}</p>
                    <p className="text-sm text-gray-500">{txn.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    txn.type === 'in' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.type === 'in' ? '+' : '-'}{txn.quantity}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(txn.date || txn.created_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}