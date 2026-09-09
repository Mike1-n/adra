import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();

/**
 * Initializes native mobile settings (status bar, splash screen, back button)
 */
export async function initializeNativeApp({ onHardwareBack } = {}) {
  if (!isNative) return;

  try {
    // Configure native status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#020617' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('Status bar configuration error:', err);
  }

  try {
    // Hide splash screen smoothly
    await SplashScreen.hide();
  } catch (err) {
    console.warn('Splash screen error:', err);
  }

  // Handle hardware back button on Android
  App.addListener('backButton', ({ canGoBack }) => {
    if (onHardwareBack) {
      const handled = onHardwareBack();
      if (handled) return;
    }
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}
