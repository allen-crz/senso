
import React from "react";
import { Apple } from "lucide-react";

const InstallPrompt: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-gray-800 to-black text-white p-6">
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* App Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg">
            <Apple className="h-12 w-12 text-[#212529]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6 text-center">Install Senso</h1>
        
        {/* Installation Card */}
        <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg mb-6">
          <p className="text-white/80 mb-6">
            To use Senso, add it to your home screen:
          </p>
          
          <div className="space-y-4">
            <div className="rounded-lg bg-white/5 p-4">
              <ol className="list-decimal list-inside space-y-3 text-sm text-white/90">
                <li className="flex items-center gap-2">
                  Tap <span className="px-2 py-1 bg-white/10 rounded">
                    <svg className="w-5 h-5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  Select <span className="px-2 py-1 bg-white/10 rounded">Add to Home Screen</span>
                </li>
                <li className="flex items-center gap-2">
                  Tap <span className="px-2 py-1 bg-white/10 rounded">Add</span> to finish
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-white/60 text-sm text-center">
          After installation, please open Senso from your home screen
        </p>
      </div>
    </div>
  );
};

export default InstallPrompt;

