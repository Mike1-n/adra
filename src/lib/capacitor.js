import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();

// Automatically probe and configure safe areas immediately on module load
if (isNative) {
  try {
    updateSafeAreaInsets();
  } catch (e) {}
}

/**
 * Dynamically synchronizes native status bar height to CSS custom property
 */
export async function updateSafeAreaInsets() {
  if (!isNative) return;
  try {
    const info = await StatusBar.getInfo();
    if (info && info.overlays && typeof info.height === 'number' && info.height > 0) {
      document.documentElement.style.setProperty('--safe-area-top', `${info.height}px`);
    } else if (info && !info.overlays) {
      document.documentElement.style.setProperty('--safe-area-top', '0px');
    }
  } catch (err) {
    console.warn('Status bar insets query error:', err);
  }
}

/**
 * Initializes native mobile settings (status bar, splash screen, back button)
 */
export async function initializeNativeApp({ onHardwareBack } = {}) {
  if (!isNative) return;

  try {
    // Configure native status bar with ADRA brand colors
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#004D3F' });
    await StatusBar.setOverlaysWebView({ overlay: false });
    await updateSafeAreaInsets();
  } catch (err) {
    console.warn('Status bar configuration error:', err);
  }

  // Listen to status bar overlay and visibility changes dynamically
  try {
    StatusBar.addListener('statusBarOverlayChanged', (info) => {
      if (info && info.overlays && typeof info.height === 'number' && info.height > 0) {
        document.documentElement.style.setProperty('--safe-area-top', `${info.height}px`);
      } else if (info && !info.overlays) {
        document.documentElement.style.setProperty('--safe-area-top', '0px');
      }
    });
  } catch (err) {
    // Unsupported on web platforms
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
