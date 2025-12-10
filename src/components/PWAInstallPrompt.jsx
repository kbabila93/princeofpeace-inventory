import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const openHandler = () => {
        if (ios) {
            setShowIOSHelp(true);
        } else {
            setIsVisible(true);
        }
    };
    window.addEventListener('open-install-prompt', openHandler);

    if (ios && !isStandalone && !sessionStorage.getItem('pwa_prompt_dismissed')) {
      setIsVisible(true);
    }

    return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('open-install-prompt', openHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSHelp(true);
      }
      return;
    }

    setIsVisible(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible && !showIOSHelp) return null;

  return (
    <>
      {isVisible && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-200 flex items-start gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Install App</h3>
              <p className="text-indigo-100 text-sm mb-3">
                {isIOS 
                  ? "Install on your iPhone for the best experience." 
                  : "Install for quick access and better performance."}
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="bg-white text-indigo-600 hover:bg-indigo-50 border-none"
                  onClick={handleInstallClick}
                >
                  {isIOS ? "How to Install" : "Install Now"}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                  onClick={handleDismiss}
                >
                  Later
                </Button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <Dialog open={showIOSHelp} onOpenChange={setShowIOSHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install on iOS</DialogTitle>
            <DialogDescription>
              Follow these steps to add this app to your home screen:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Share className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm">1. Tap the <span className="font-bold">Share</span> button in your browser menu bar.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <PlusSquare className="w-5 h-5 text-gray-700" />
              </div>
              <p className="text-sm">2. Scroll down and tap <span className="font-bold">Add to Home Screen</span>.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="font-bold text-lg text-indigo-600">3</span>
              </div>
              <p className="text-sm">3. Tap <span className="font-bold">Add</span> in the top right corner.</p>
            </div>
          </div>
          <Button onClick={() => setShowIOSHelp(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}