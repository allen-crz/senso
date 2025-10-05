import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Wait for DOM to be ready before initializing
const init = async () => {
  // Initialize PWA elements for Capacitor Camera
  await defineCustomElements(window);

  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  }
};

init();
