import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BarcodeScannerDialog({ isOpen, onClose, onScan }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    if (isOpen) {
      startCamera();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Use native getUserMedia for better compatibility
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Now use ZXing to scan from the video
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const scanFromVideo = async () => {
        if (!videoRef.current || !isOpen) return;
        
        try {
          const result = await reader.decodeFromVideoElement(videoRef.current);
          if (result) {
            const code = result.getText();
            console.log("Detected barcode:", code);
            toast.success("Barcode detected!");
            onScan(code);
            stopCamera();
            onClose();
          }
        } catch (err) {
          // Continue scanning
          if (isOpen) {
            setTimeout(scanFromVideo, 100);
          }
        }
      };

      scanFromVideo();
    } catch (err) {
      console.error("Camera error:", err);
      let errorMessage = "Failed to access camera. ";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += "Please allow camera access in your browser settings.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera found on this device.";
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Camera is already in use by another app.";
      } else {
        errorMessage += "Error: " + (err.message || "Unknown error");
      }
      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch (e) {
        console.log("Error resetting reader:", e);
      }
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            Camera Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <Button 
                onClick={startCamera} 
                className="mt-3"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-4 border-indigo-500 opacity-30"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-4 border-indigo-500 rounded-lg"></div>
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Position the barcode within the frame - scanning automatically
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">QR Code</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">CODE128</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">EAN13</span>
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