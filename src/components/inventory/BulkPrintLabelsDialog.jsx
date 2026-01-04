import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from '@/utils';

export default function BulkPrintLabelsDialog({ isOpen, onClose, products, printerSettings, user }) {
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    products.forEach(p => initial[p.id] = 1);
    return initial;
  });

  const handleQuantityChange = (productId, value) => {
    const num = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [productId]: Math.max(0, num) }));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      toast.error("Please allow popups to print labels");
      return;
    }

    const logoUrl = user?.store_logo || '';
    const widthStyle = `${printerSettings.width}${printerSettings.unit}`;
    const heightStyle = `${printerSettings.height}${printerSettings.unit}`;

    // Generate label HTML for each product x quantity
    const allLabels = [];
    let barcodeIndex = 0;
    
    products.forEach(product => {
      const qty = quantities[product.id] || 0;
      for (let i = 0; i < qty; i++) {
        allLabels.push({ product, index: barcodeIndex++ });
      }
    });

    if (allLabels.length === 0) {
      toast.error("Please set quantities greater than 0");
      printWindow.close();
      return;
    }

    const labelsHtml = allLabels.map(({ product, index }) => {
      const safeName = product.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      return `
        <div class="label-item">
          <div class="label-content">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
            ${product.image_url ? `<img src="${product.image_url}" alt="${safeName}" class="product-image" />` : ''}
            <div class="product-name">${safeName}</div>
            <svg id="barcode-${index}"></svg>
            <div class="price">${product.currency || '$'} ${Number(product.price).toFixed(2)}</div>
            <div class="scan-info">Scan label to record sale</div>
          </div>
        </div>
      `;
    }).join('');

    const barcodeScripts = allLabels.map(({ product, index }) => {
      const safeSku = (product.sku || "NO SKU").replace(/"/g, '\\"');
      return `
        try {
          JsBarcode("#barcode-${index}", "${safeSku}", {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
            margin: 0,
            fontSize: 10
          });
        } catch(e) { console.error('Barcode error:', e); }
      `;
    }).join('\n');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10mm;
            }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, ${widthStyle});
              gap: 5mm;
              justify-content: start;
            }
            .label-item {
              width: ${widthStyle};
              height: ${heightStyle};
              border: 1px dashed #ccc;
              page-break-inside: avoid;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .label-content {
              text-align: center;
              width: 95%;
              height: 95%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              position: relative;
            }
            .logo {
              position: absolute;
              top: 2px;
              right: 2px;
              width: 20px;
              height: 20px;
              object-fit: contain;
            }
            .product-image {
              width: 50px;
              height: 50px;
              object-fit: cover;
              border-radius: 4px;
              margin-bottom: 4px;
            }
            svg {
              width: 100%;
              height: auto;
              max-height: 40%;
              display: block;
            }
            .product-name {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }
            .price {
              font-size: 12px;
              font-weight: bold;
            }
            .scan-info {
              font-size: 7px;
              color: #3b82f6;
              margin-top: 2px;
              font-style: italic;
            }
            @media print {
              .label-item {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="labels-grid">
            ${labelsHtml}
          </div>
          <script>
            window.onload = function() {
              ${barcodeScripts}
              
              const images = document.querySelectorAll('img');
              if (images.length > 0) {
                let loadedCount = 0;
                images.forEach(img => {
                  if (img.complete) {
                    loadedCount++;
                  } else {
                    img.onload = () => {
                      loadedCount++;
                      if (loadedCount === images.length) {
                        setTimeout(() => window.print(), 500);
                      }
                    };
                    img.onerror = () => {
                      loadedCount++;
                      if (loadedCount === images.length) {
                        setTimeout(() => window.print(), 500);
                      }
                    };
                  }
                });
                if (loadedCount === images.length) {
                  setTimeout(() => window.print(), 500);
                }
              } else {
                setTimeout(() => window.print(), 500);
              }
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success(`Preparing ${allLabels.length} labels...`);
    onClose();
  };

  const totalLabels = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            Print Multiple Labels
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Set how many labels to print for each product
          </p>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {products.map(product => (
            <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-400">
                    {product.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-500">{product.sku || 'No SKU'}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 0) - 1)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={quantities[product.id] || 0}
                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                  className="w-16 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 0) + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-center">
          <p className="text-sm text-indigo-900">
            <span className="font-bold">Total: {totalLabels}</span> labels will be printed
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={totalLabels === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print {totalLabels} Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}