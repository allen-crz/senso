
import React from "react";
import { useNavigate } from "react-router-dom";
import { PaperPlane, ChevronLeft } from "lucide-react";

const navItems = [
  {
    to: "/dashboard",
    icon: <i className="fa-solid fa-house text-gray-400 text-2xl group-hover:text-purple-400 transition" />,
    label: "Home",
    labelClass: "text-gray-400 group-hover:text-purple-400",
  },
  {
    to: "/water",
    icon: <i className="fa-solid fa-droplet text-gray-400 text-2xl group-hover:text-blue-500 transition" />,
    label: "Water",
    labelClass: "text-gray-400 group-hover:text-blue-500",
  },
  {
    to: "/electricity",
    icon: <i className="fa-solid fa-bolt text-gray-400 text-2xl group-hover:text-yellow-500 transition" />,
    label: "Electric",
    labelClass: "text-gray-400 group-hover:text-yellow-600",
  },
  {
    to: "/settings",
    icon: <i className="fa-solid fa-gear text-white text-2xl transition" />,
    label: "Settings",
    active: true,
    labelClass: "font-medium text-purple-500 group-hover:text-purple-700",
    bgClass: "bg-purple-500 group-hover:bg-purple-600",
  },
];

const SendFeedback = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 mb-8">
        <div className="flex items-center gap-2">
          <button
            aria-label="Back to Settings"
            onClick={() => navigate("/settings")}
            className="p-2 -ml-2 rounded-lg transition duration-150 hover:bg-gray-200 hover:scale-110 active:scale-95 focus:ring-2 focus:ring-purple-200 outline-none"
            tabIndex={0}
          >
            <ChevronLeft className="text-[#212529] w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#212529]">Send Feedback</h1>
        </div>
        <PaperPlane className="text-purple-500 w-6 h-6" />
      </div>
      {/* Main Content */}
      <div className="px-6 pb-32">
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
          <p className="text-center text-[#212529] mb-4">
            Send us your feedback at:
          </p>
          <a
            href="mailto:support@senso.com"
            className="block w-full text-center text-purple-500 text-lg font-medium hover:text-purple-600 active:text-purple-700 transition-colors duration-150 focus:underline focus:outline-none"
            tabIndex={0}
          >
            support@senso.com
          </a>
        </div>
      </div>
      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            {navItems.map((item, idx) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={[
                  "flex flex-col items-center gap-1 group transition hover:scale-105 active:scale-95",
                  item.active ? "cursor-default" : "cursor-pointer"
                ].join(" ")}
                type="button"
                tabIndex={0}
              >
                <div className={
                  [
                    "w-10 h-10 rounded-full flex items-center justify-center transition",
                    item.bgClass ? item.bgClass : "group-hover:bg-gray-800"
                  ].join(" ")
                }>
                  {item.icon}
                </div>
                <span className={`text-xs transition underline decoration-transparent group-hover:underline group-hover:underline-offset-2 ${item.labelClass}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendFeedback;
