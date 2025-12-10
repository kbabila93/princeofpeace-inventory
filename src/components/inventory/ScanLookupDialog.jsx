import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ScanBarcode } from "lucide-react";

export default function ScanLookupDialog({ isOpen, onClose, onScan }) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setBarcode("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setIsScanning(true);
    try {
      // Search for product by SKU
      const products = await base44.entities.Product.list();
      const foundProduct = products.find(p => p.sku === barcode.trim());
      
      onScan({ 
        sku: barcode.trim(), 
        product: foundProduct || null 
      });
      onClose();
    } catch (error) {
      console.error("Scan lookup failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleScan} className="space-y-4 py-4">
          <p className="text-sm text-gray-500">
            Use your barcode scanner or type the SKU manually.
          </p>
          
          <Input
            ref={inputRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan or enter SKU..."
            className="text-lg font-mono"
            autoComplete="off"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isScanning || !barcode.trim()}>
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Process Scan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}