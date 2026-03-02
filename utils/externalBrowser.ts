/**
 * Utility to detect AppGyser/Cordova environment and open URLs
 * in the device's external browser instead of the WebView.
 */

declare global {
  interface Window {
    cordova?: any;
  }
}

/**
 * Returns true if the app is running inside a Cordova/AppGyser WebView.
 */
export function isAppGyser(): boolean {
  return !!(window.cordova || (window as any).Cordova || document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1);
}

/**
 * Opens a URL in the device's external/system browser when running
 * inside AppGyser/Cordova. Falls back to window.open for web.
 */
export function openInExternalBrowser(url: string): void {
  if (isAppGyser()) {
    // Try cordova.InAppBrowser first (if plugin installed)
    if (window.cordova?.InAppBrowser) {
      window.cordova.InAppBrowser.open(url, '_system');
    } else {
      // Fallback: '_system' target opens in external browser on Cordova
      window.open(url, '_system');
    }
  } else {
    // Normal web: open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Global click interceptor: hijacks clicks on <a> tags with
 * target="_blank" or external href when running in AppGyser,
 * and redirects them to the system browser.
 */
export function setupExternalLinkInterceptor(): void {
  if (!isAppGyser()) return;

  document.addEventListener('click', (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement)?.closest?.('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // Only intercept external links (http/https) or target=_blank
    const isExternal = /^https?:\/\//i.test(href);
    const isBlank = anchor.getAttribute('target') === '_blank';

    if (isExternal || isBlank) {
      e.preventDefault();
      e.stopPropagation();
      openInExternalBrowser(href);
    }
  }, true); // Use capture phase to intercept before React handlers
}
