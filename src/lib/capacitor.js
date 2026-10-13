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
    const platform = Capacitor.getPlatform();

    // Determine status bar height (with robust Android/iOS fallbacks)
    let height = (info && typeof info.height === 'number' && info.height > 0) ? info.height : 0;
    if (height === 0) {
      height = platform === 'android' ? 28 : (platform === 'ios' ? 44 : 0);
    }

    if (info && info.visible === false) {
      document.documentElement.style.setProperty('--safe-area-top', '0px');
    } else {
      document.documentElement.style.setProperty('--safe-area-top', `${height}px`);
    }
  } catch (err) {
    console.warn('Status bar insets query error:', err);
    if (Capacitor.getPlatform() === 'android') {
      document.documentElement.style.setProperty('--safe-area-top', '28px');
    } else if (Capacitor.getPlatform() === 'ios') {
      document.documentElement.style.setProperty('--safe-area-top', '44px');
    }
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
    StatusBar.addListener('statusBarOverlayChanged', () => {
      updateSafeAreaInsets();
    });
    StatusBar.addListener('statusBarVisibilityChanged', () => {
      updateSafeAreaInsets();
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
