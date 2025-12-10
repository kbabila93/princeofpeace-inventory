import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, we might want to show it once per session if not installed
    if (ios && !isStandalone && !sessionStorage.getItem('pwa_prompt_dismissed')) {
      setIsVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        toast.info("To install on iOS: Tap the Share button and select 'Add to Home Screen'", {
          duration: 5000,
        });
      }
      return;
    }

    // Hide the app provided install promotion
    setIsVisible(false);
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-200 flex items-start gap-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Install App</h3>
          <p className="text-indigo-100 text-sm mb-3">
            {isIOS 
              ? "Install this app on your iPhone for a better experience." 
              : "Install this app on your device for quick access and offline capabilities."}
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
              Maybe Later
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}