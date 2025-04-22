
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsPrivacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      {/* Fake status bar for visual alignment */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="text-[0.95rem] text-[#212529] font-medium">9:41</div>
        <div className="flex items-center gap-2 text-[#212529]">
          <i className="fa-solid fa-signal" />
          <i className="fa-solid fa-wifi" />
          <i className="fa-solid fa-battery-full" />
        </div>
      </div>
      {/* Main Content */}
      <div className="px-6 pb-32 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            className="text-[#212529] p-1 -ml-1 flex items-center"
            aria-label="Back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-[#212529]">
            Terms &amp; Privacy Policy
          </h1>
        </div>
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <div className="space-y-6">
            {/* Last Updated */}
            <div className="text-sm text-gray-500 mb-4">
              Last updated: January 15, 2025
            </div>

            {/* Terms Section */}
            <section>
              <h2 className="text-lg font-bold text-[#212529] mb-4">
                Terms of Service
              </h2>
              <div className="space-y-4 text-sm text-gray-600">
                <p>Welcome to Senso. By using our app, you agree to these terms:</p>
                <ul className="pl-5 list-disc space-y-1">
                  <li>The app is provided &quot;as is&quot; without warranties</li>
                  <li>We may update these terms at any time</li>
                  <li>You must be 18 or older to use this service</li>
                  <li>Misuse may result in account termination</li>
                </ul>
              </div>
            </section>

            {/* Privacy Policy Section */}
            <section>
              <h2 className="text-lg font-bold text-[#212529] mb-4">
                Privacy Policy
              </h2>
              <div className="space-y-4 text-sm text-gray-600">
                <p>We collect and process the following data:</p>
                <ul className="pl-5 list-disc space-y-1">
                  <li>Account information</li>
                  <li>Usage metrics</li>
                  <li>Device information</li>
                  <li>Utility meter readings</li>
                </ul>
              </div>
            </section>

            {/* Data Usage Section */}
            <section>
              <h2 className="text-lg font-bold text-[#212529] mb-4">
                How We Use Your Data
              </h2>
              <div className="space-y-4 text-sm text-gray-600">
                <ul className="pl-5 list-disc space-y-1">
                  <li>Provide utility monitoring services</li>
                  <li>Improve app performance</li>
                  <li>Send important notifications</li>
                  <li>Generate usage analytics</li>
                </ul>
              </div>
            </section>

            {/* Contact Section */}
            <section>
              <h2 className="text-lg font-bold text-[#212529] mb-4">
                Contact Us
              </h2>
              <p className="text-sm text-gray-600">
                For questions about these terms, contact us at:{" "}
                <a
                  href="mailto:support@senso.com"
                  className="text-purple-500 underline"
                >
                  support@senso.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Bottom Navigation (copied from Settings for consistency) */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              className="flex flex-col items-center gap-1 group transition hover:scale-105 active:scale-95"
              onClick={() => navigate("/dashboard")}
              type="button"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-gray-800">
                <i className="fa-solid fa-house text-gray-400 text-2xl group-hover:text-purple-400 transition" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-purple-400 transition">
                Home
              </span>
            </button>
            <button
              className="flex flex-col items-center gap-1 group transition hover:scale-105 active:scale-95"
              onClick={() => navigate("/water")}
              type="button"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-blue-50">
                <i className="fa-solid fa-droplet text-gray-400 text-2xl group-hover:text-blue-500 transition" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 transition">
                Water
              </span>
            </button>
            <button
              className="flex flex-col items-center gap-1 group transition hover:scale-105 active:scale-95"
              onClick={() => navigate("/electricity")}
              type="button"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-yellow-100">
                <i className="fa-solid fa-bolt text-gray-400 text-2xl group-hover:text-yellow-500 transition" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-yellow-600 transition">
                Electric
              </span>
            </button>
            <button
              className="flex flex-col items-center gap-1 cursor-default"
              type="button"
              tabIndex={-1}
            >
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition">
                <i className="fa-solid fa-gear text-white text-2xl transition" />
              </div>
              <span className="text-xs font-medium text-purple-500 group-hover:text-purple-700 transition">
                Settings
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPrivacy;
