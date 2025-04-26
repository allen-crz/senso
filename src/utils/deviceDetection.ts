
/**
 * Check if the device is a mobile device
 * @returns {boolean} true if the device is mobile, false otherwise
 */
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Regular expression for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
};

/**
 * Check if the device is an iOS device
 * @returns {boolean} true if the device is iOS, false otherwise
 */
export const isIOSDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // iOS devices include iPhone, iPad, and iPod
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  // Additional check for iOS within a PWA context
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  console.log("iOS detection:", { isIOS, isPWA, userAgent: userAgent.substring(0, 50) + "..." });
  
  return isIOS && !(window as any).MSStream;
};

/**
 * Checks if the app is running in standalone mode (PWA installed)
 * @returns {boolean} true if the app is in standalone mode
 */
export const isStandalone = (): boolean => {
  return (window.matchMedia('(display-mode: standalone)').matches) || 
    (window.navigator as any).standalone || 
    document.referrer.includes('android-app://');
};
