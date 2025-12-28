import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BarcodeScannerDialog({ isOpen, onClose, onScan }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const html5QrCode = new Html5Qrcode("barcode-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.7777778,
          formatsToSupport: [
            0, // QR_CODE
            8, // CODE_128
            13, // EAN_13
            5, // EAN_8
            6, // CODE_39
            7, // CODE_93
            9, // ITF
            12, // UPC_A
            11  // UPC_E
          ]
        },
        (decodedText, decodedResult) => {
          console.log("Scanned:", decodedText);
          toast.success("Barcode detected!");
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Ignore scan errors (happens continuously when no barcode visible)
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Failed to start camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <Button 
                onClick={startScanner} 
                className="mt-3"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <div id="barcode-reader" className="w-full h-full"></div>
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Point your camera at a barcode or QR code
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">CODE128</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">EAN13</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">QR Code</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">UPC</span>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleClose} variant="outline" className="w-full">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}