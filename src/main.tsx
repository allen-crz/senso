import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Initialize PWA elements for Capacitor Camera
defineCustomElements(window);

createRoot(document.getElementById("root")!).render(<App />);
