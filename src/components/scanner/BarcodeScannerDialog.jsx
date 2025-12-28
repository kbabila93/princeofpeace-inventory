import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Loader2, SwitchCamera } from 'lucide-react';
import { toast } from 'sonner';

export default function BarcodeScannerDialog({ isOpen, onClose, onScan }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [detectionSupported, setDetectionSupported] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      checkBarcodeSupport();
      startCamera();
    }

    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isOpen]);

  const checkBarcodeSupport = async () => {
    if ('BarcodeDetector' in window) {
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code']
        });
        setDetectionSupported(true);
      } catch (e) {
        console.log("BarcodeDetector not fully supported");
      }
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start continuous scanning if supported
        if (detectorRef.current) {
          startContinuousScanning();
        }
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Failed to access camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const startContinuousScanning = () => {
    scanIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && detectorRef.current) {
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            console.log("Detected barcode:", code);
            toast.success("Barcode detected!");
            clearInterval(scanIntervalRef.current);
            onScan(code);
            stopCamera();
            onClose();
          }
        } catch (err) {
          // Ignore detection errors
        }
      }
    }, 300);
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      toast.info("Image captured. Enter the barcode manually.");
    }
  };

  const handleSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      stopCamera();
      onClose();
      setManualInput("");
      setCapturedImage(null);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setManualInput("");
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
              {capturedImage ? (
                <div className="space-y-4">
                  <img src={capturedImage} alt="Captured" className="w-full rounded-lg border" />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Enter Barcode/SKU</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type the barcode..."
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        autoFocus
                      />
                      <Button onClick={handleSubmit} disabled={!manualInput.trim()}>
                        Submit
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCapturedImage(null);
                      setManualInput("");
                      startCamera();
                    }}
                    className="w-full"
                  >
                    <SwitchCamera className="w-4 h-4 mr-2" />
                    Retake
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
                    <canvas ref={canvasRef} className="hidden" />
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
                      {detectionSupported 
                        ? "Position the barcode within the frame - it will scan automatically"
                        : "Position the barcode and capture to enter manually"}
                    </p>
                    {!detectionSupported && (
                      <Button onClick={captureImage} className="w-full bg-indigo-600 hover:bg-indigo-700">
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Image
                      </Button>
                    )}
                    <p className="text-xs text-gray-500">
                      {detectionSupported ? "✓ Automatic scanning enabled" : "Manual entry mode"}
                    </p>
                  </div>
                </>
              )}
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