import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Printer, Loader2 } from "lucide-react";

export default function PrintLabelsDialog({ isOpen, onClose, products }) {
    const [labelSize, setLabelSize] = useState({ width: 50, height: 30 }); // mm
    const [fontSize, setFontSize] = useState(12);

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        
        const labelHTML = products.map(product => `
            <div style="
                width: ${labelSize.width}mm;
                height: ${labelSize.height}mm;
                border: 1px dashed #ccc;
                padding: 4mm;
                margin: 2mm;
                display: inline-block;
                page-break-inside: avoid;
                font-family: Arial, sans-serif;
                box-sizing: border-box;
            ">
                <div style="font-size: ${fontSize}px; font-weight: bold; margin-bottom: 2mm;">
                    ${product.name}
                </div>
                <div style="font-size: ${fontSize - 2}px; color: #666; margin-bottom: 2mm;">
                    SKU: ${product.sku || 'N/A'}
                </div>
                <div style="font-size: ${fontSize + 2}px; font-weight: bold;">
                    ${product.currency || '$'} ${Number(product.price).toFixed(2)}
                </div>
                ${product.category ? `<div style="font-size: ${fontSize - 3}px; color: #888; text-transform: uppercase; margin-top: 1mm;">${product.category}</div>` : ''}
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Print Labels</title>
                <style>
                    @media print {
                        @page { margin: 5mm; }
                        body { margin: 0; }
                    }
                    body {
                        margin: 10mm;
                        font-family: Arial, sans-serif;
                    }
                </style>
            </head>
            <body>
                ${labelHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="w-5 h-5" />
                        Print Product Labels
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Printing labels for {products.length} product{products.length > 1 ? 's' : ''}
                    </p>

                    <div className="space-y-4 border rounded-md p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Label Width (mm)</Label>
                                <Input
                                    type="number"
                                    value={labelSize.width}
                                    onChange={(e) => setLabelSize(prev => ({ ...prev, width: Number(e.target.value) }))}
                                    min="20"
                                    max="100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Label Height (mm)</Label>
                                <Input
                                    type="number"
                                    value={labelSize.height}
                                    onChange={(e) => setLabelSize(prev => ({ ...prev, height: Number(e.target.value) }))}
                                    min="15"
                                    max="80"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Font Size</Label>
                            <Input
                                type="number"
                                value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                                min="8"
                                max="24"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Preview Info</p>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>• Each label shows: Name, SKU, Price, Category</p>
                            <p>• Labels will be formatted for your printer</p>
                            <p>• Adjust size to match your label sheets</p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print Labels
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}