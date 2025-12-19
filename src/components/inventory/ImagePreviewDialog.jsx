import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

export default function ImagePreviewDialog({ isOpen, onClose, image }) {
  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] p-0 bg-transparent border-none shadow-none overflow-hidden flex flex-col items-center justify-center outline-none">
        <VisuallyHidden.Root>
          <DialogTitle>Image Preview - {image.name}</DialogTitle>
        </VisuallyHidden.Root>
        
        <div className="relative w-full flex flex-col items-center">
            <div className="relative inline-block">
                <button 
                    onClick={onClose}
                    className="absolute -top-12 right-0 md:-right-12 z-50 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
                <img 
                    src={image.url} 
                    alt={image.name || "Preview"} 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
            </div>
            {image.name && (
                <p className="mt-4 text-white text-lg font-medium drop-shadow-md bg-black/50 px-4 py-1 rounded-full backdrop-blur-sm">
                    {image.name}
                </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}