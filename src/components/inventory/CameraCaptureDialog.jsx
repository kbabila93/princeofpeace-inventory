import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X, Check } from "lucide-react";
import { toast } from "sonner";

export default function CameraCaptureDialog({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // default to rear camera on mobile

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stopCamera();
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please check permissions.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL for preview
      setCapturedImage(canvas.toDataURL('image/jpeg'));
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
          onCapture(file);
          onClose();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-black text-white border-gray-800">
        <DialogHeader className="p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
          <DialogTitle className="text-white flex items-center justify-between">
            <span>Take Photo</span>
            <Button variant="ghost" size="icon" onClick={switchCamera} className="text-white hover:bg-white/20">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-[3/4] sm:aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
          {!capturedImage ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover" 
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="p-4 bg-black/90 flex justify-center sm:justify-center gap-8">
          {!capturedImage ? (
            <>
              <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-12 w-12 p-0">
                <X className="w-6 h-6" />
              </Button>
              <Button 
                onClick={capturePhoto} 
                className="rounded-full h-16 w-16 p-1 border-4 border-white bg-transparent hover:bg-white/20"
              >
                <div className="w-full h-full bg-white rounded-full" />
              </Button>
              <div className="w-12" /> {/* Spacer for balance */}
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={retakePhoto} className="rounded-full">
                <RefreshCw className="w-4 h-4 mr-2" /> Retake
              </Button>
              <Button onClick={confirmPhoto} className="bg-green-600 hover:bg-green-700 rounded-full px-8">
                <Check className="w-4 h-4 mr-2" /> Use Photo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}