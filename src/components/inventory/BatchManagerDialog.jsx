import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar as CalendarIcon, Loader2, AlertTriangle, Pencil } from "lucide-react";
import { format, isPast, addDays, isBefore } from 'date-fns';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function BatchManagerDialog({ isOpen, onClose, product }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  
  // New batch form state
  const [formData, setFormData] = useState({
    batch_number: "",
    quantity: "",
    expiration_date: "",
    received_date: new Date().toISOString().split('T')[0],
    cost_price: "",
    supplier: "",
    notes: ""
  });

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches', product?.id],
    queryFn: () => base44.entities.Batch.filter({ product_id: product.id }, '-expiration_date', 100),
    enabled: !!product?.id && isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Batch.create({
      ...data,
      product_id: product.id,
      quantity: Number(data.quantity),
      initial_quantity: Number(data.quantity),
      cost_price: data.cost_price ? Number(data.cost_price) : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setIsAdding(false);
      resetForm();
      toast.success("Batch created successfully");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Batch.update(editingBatch.id, {
      ...data,
      quantity: Number(data.quantity),
      cost_price: data.cost_price ? Number(data.cost_price) : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setEditingBatch(null);
      setIsAdding(false);
      resetForm();
      toast.success("Batch updated successfully");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Batch.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success("Batch deleted");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBatch) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      batch_number: "",
      quantity: "",
      expiration_date: "",
      received_date: new Date().toISOString().split('T')[0],
      cost_price: "",
      supplier: "",
      notes: ""
    });
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batch_number: batch.batch_number,
      quantity: batch.quantity,
      expiration_date: batch.expiration_date || "",
      received_date: batch.received_date || "",
      cost_price: batch.cost_price || "",
      supplier: batch.supplier || "",
      notes: batch.notes || ""
    });
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Batch Management - {product.name}</span>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> Add Batch
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-1 border rounded-lg bg-slate-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">{editingBatch ? 'Edit Batch' : 'New Batch Details'}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setIsAdding(false); setEditingBatch(null); resetForm(); }}>
                Cancel
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number / Lot Code</Label>
                <Input 
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                  required
                  placeholder="e.g. LOT-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input 
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="received_date">Received Date</Label>
                <Input 
                  id="received_date"
                  type="date"
                  value={formData.received_date}
                  onChange={(e) => setFormData({...formData, received_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost per Unit</Label>
                <Input 
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input 
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Quality notes, storage location, etc."
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingBatch ? 'Update Batch' : 'Create Batch'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No batches tracked for this product.</p>
                <Button variant="link" onClick={() => setIsAdding(true)}>Add your first batch</Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch #</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const isExpired = batch.expiration_date && isPast(new Date(batch.expiration_date));
                      const isExpiringSoon = batch.expiration_date && isBefore(new Date(batch.expiration_date), addDays(new Date(), 30));
                      
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">
                            {batch.batch_number}
                            {batch.supplier && <div className="text-xs text-gray-500">{batch.supplier}</div>}
                          </TableCell>
                          <TableCell>
                            {batch.expiration_date ? (
                              <div className={`flex items-center gap-1 ${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
                                {isExpired || isExpiringSoon ? <AlertTriangle className="w-3 h-3" /> : null}
                                {format(new Date(batch.expiration_date), 'MMM d, yyyy')}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {batch.quantity}
                            <span className="text-xs text-gray-400 ml-1">/ {batch.initial_quantity}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              batch.quantity === 0 ? "bg-gray-100 text-gray-500" :
                              isExpired ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-green-50 text-green-700 border-green-200"
                            }>
                              {batch.quantity === 0 ? 'Depleted' : isExpired ? 'Expired' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(batch)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(batch.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}