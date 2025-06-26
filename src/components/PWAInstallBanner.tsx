
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check if dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = new Date(dismissed);
        const now = new Date();
        const daysDiff = (now.getTime() - dismissedTime.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff < 7) { // Don't show for 7 days after dismissal
          return;
        }
      }

      // Show banner after 10 seconds if conditions are met
      setTimeout(() => {
        if (!isInstalled && !deferredPrompt) {
          setShowBanner(true);
        }
      }, 10000);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      checkInstallation();
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    checkInstallation();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <Card className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install SkillZone App</h3>
            <p className="text-xs text-gray-600 mb-3">
              Get the full experience with offline access, push notifications, and faster loading!
            </p>
            <div className="flex items-center gap-2">
              {deferredPrompt ? (
                <Button onClick={handleInstall} size="sm" className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  Install App
                </Button>
              ) : (
                <div className="text-xs text-gray-500">
                  Add to Home Screen from your browser menu
                </div>
              )}
              <Button onClick={handleDismiss} variant="ghost" size="sm" className="px-2">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallBanner;
