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
  const scanningRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      scanningRef.current = true;

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }

      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const scanLoop = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        
        try {
          const result = await reader.decodeFromVideoElement(videoRef.current);
          if (result && scanningRef.current) {
            const code = result.getText();
            console.log("Detected:", code);
            toast.success("Barcode scanned!");
            onScan(code);
            stopCamera();
            onClose();
            return;
          }
        } catch (err) {
          // No barcode found, continue
        }
        
        if (scanningRef.current) {
          requestAnimationFrame(scanLoop);
        }
      };

      scanLoop();
    } catch (err) {
      console.error("Camera error:", err);
      let errorMessage = "Camera access failed. ";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += "Please enable camera permissions.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera detected.";
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Camera in use by another app.";
      } else {
        errorMessage += err.message || "Unknown error.";
      }
      setError(errorMessage);
      setIsScanning(false);
      scanningRef.current = false;
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
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
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Position the barcode within the frame
                </p>
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