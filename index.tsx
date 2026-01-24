import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize Cordova for AppGyser support
if ((window as any).cordova) {
  document.addEventListener('deviceready', initializeApp, false);
} else {
  // Web version - initialize immediately
  initializeApp();
}

function initializeApp() {
  console.log('Initializing NutriScan application...');
  
  const root = ReactDOM.createRoot(rootElement!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Register service worker for PWA support
  if ('serviceWorker' in navigator && !(window as any).cordova) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // eslint-disable-next-line no-console
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('ServiceWorker registration failed: ', err);
        });
    });
  }
}
