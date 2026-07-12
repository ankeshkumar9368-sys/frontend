"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function CapacitorHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // We only want to run Capacitor logic in a native environment or browser
    // but we must ensure we don't break SSR.
    
    const initCapacitor = async () => {
      try {
        // Dynamic imports to prevent SSR issues
        const { App } = await import('@capacitor/app');
        const { StatusBar, Style } = await import('@capacitor/status-bar');

        // 1. Setup Status Bar Appearance
        try {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#6366f1' });
        } catch (e) {
          console.log('StatusBar not available');
        }

        // 2. Handle Hardware Back Button
        const backListener = await App.addListener('backButton', ({ canGoBack }) => {
          // Fire a custom event that components can listen to and cancel
          const event = new CustomEvent('hardwareBackPress', { cancelable: true });
          window.dispatchEvent(event);
          if (event.defaultPrevented) {
             return; // Handled by an overlay, don't navigate or exit
          }

          if (canGoBack) {
            window.history.back();
          } else {
            if (pathname === '/' || pathname === '/login' || pathname === '/onboarding') {
              App.exitApp();
            } else {
              window.history.back();
            }
          }
        });

        return backListener;
      } catch (err) {
        // Not in a capacitor environment
        return null;
      }
    };

    const listenerPromise = initCapacitor();

    return () => {
      listenerPromise.then(l => {
        if (l) l.remove();
      });
    };
  }, [pathname, router]);

  return null;
}
