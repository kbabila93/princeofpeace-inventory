import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Loader2, SwitchCamera } from 'lucide-react';
import { toast } from 'sonner';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function BarcodeScannerDialog({ isOpen, onClose, onScan }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const readerRef = useRef(null);

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
      setIsScanning(true);

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const videoInputDevices = await reader.listVideoInputDevices();
      
      // Try to find back camera
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0]?.deviceId;

      if (videoRef.current) {
        await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const code = result.getText();
              console.log("Detected barcode:", code);
              toast.success("Barcode detected!");
              onScan(code);
              stopCamera();
              onClose();
            }
          }
        );
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Failed to access camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
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