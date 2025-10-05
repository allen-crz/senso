
import React, { useEffect, useState } from "react";
import { isIOSDevice } from "@/utils/deviceDetection";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(isIOSDevice());

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show native install prompt
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User ${outcome} the install prompt`);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-gray-800 to-black text-white p-6">
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* App Logo */}
        <div className="mb-8 animate-ios-scale">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-bolt-lightning text-[#212529] text-4xl"></i>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6 text-center animate-ios-slide-up">Install Senso</h1>

        {/* Android/Desktop: Native Install Button */}
        {!isIOS && deferredPrompt && (
          <div className="w-full max-w-md mb-6 animate-ios-slide-up">
            <Button
              onClick={handleInstallClick}
              className="w-full py-6 text-lg bg-white text-[#212529] hover:bg-gray-100"
              size="lg"
            >
              <i className="fa-solid fa-download mr-2"></i>
              Install App
            </Button>
            <p className="text-white/60 text-sm text-center mt-4">
              Install Senso for a better experience with offline support
            </p>
          </div>
        )}

        {/* iOS: Manual Instructions */}
        {isIOS && (
          <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg mb-6 animate-ios-slide-up">
            <p className="text-white/80 mb-6">
              To install Senso on iOS, add it to your home screen:
            </p>

            <div className="space-y-4">
              <div className="rounded-lg bg-white/5 p-4">
                <ol className="list-decimal list-inside space-y-3 text-sm text-white/90">
                  <li className="flex items-center gap-2">
                    Tap <span className="px-2 py-1 bg-white/10 rounded inline-flex items-center gap-1">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Share
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    Scroll and select <span className="px-2 py-1 bg-white/10 rounded">Add to Home Screen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    Tap <span className="px-2 py-1 bg-white/10 rounded">Add</span> to finish
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Android without prompt / Desktop without support */}
        {!isIOS && !deferredPrompt && (
          <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg mb-6 animate-ios-slide-up">
            <p className="text-white/80 mb-4">
              To install Senso:
            </p>
            <div className="rounded-lg bg-white/5 p-4">
              <ol className="list-decimal list-inside space-y-3 text-sm text-white/90">
                <li>Tap the <strong>⋮</strong> menu (three dots)</li>
                <li>Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Install"</strong></li>
              </ol>
            </div>
          </div>
        )}

        {/* Help Text */}
        <p className="text-white/60 text-sm text-center animate-ios-slide-up">
          After installation, open Senso from your home screen for the best experience
        </p>
      </div>
    </div>
  );
};

export default InstallPrompt;
