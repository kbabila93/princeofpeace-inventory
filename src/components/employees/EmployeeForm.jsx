import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeForm({ isOpen, onClose, employee }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    salary: "",
    currency: "USD",
    date_joined: new Date().toISOString().split('T')[0],
    status: "active",
    image_url: ""
  });

  React.useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          ...employee,
          salary: employee.salary || "",
          date_joined: employee.date_joined ? new Date(employee.date_joined).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
      } else {
        setFormData({
          name: "",
          role: "",
          email: "",
          phone: "",
          salary: "",
          currency: "USD",
          date_joined: new Date().toISOString().split('T')[0],
          status: "active",
          image_url: ""
        });
      }
    }
  }, [isOpen, employee]);

  const isEditing = !!employee;

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        salary: Number(data.salary)
      };
      
      if (isEditing) {
        return base44.entities.Employee.update(employee.id, payload);
      } else {
        return base44.entities.Employee.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Employee ${isEditing ? 'updated' : 'added'} successfully`);
      onClose();
    },
    onError: () => {
      toast.error(`Failed to ${isEditing ? 'update' : 'add'} employee`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role / Job Title</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                placeholder="e.g. Sales Associate"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Salary (Monthly)</Label>
              <Input
                id="salary"
                type="number"
                min="0"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(val) => setFormData({...formData, currency: val})}
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
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val) => setFormData({...formData, status: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_joined">Date Joined</Label>
              <Input
                id="date_joined"
                type="date"
                value={formData.date_joined}
                onChange={(e) => setFormData({...formData, date_joined: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Photo URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}