
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from 'react';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import SuccessScreen from "./pages/SuccessScreen";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Dashboard from "./pages/Dashboard";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import Water from "./pages/Water";
import Electricity from "./pages/Electricity";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import HelpFAQ from "./pages/HelpFAQ";
import SendFeedback from "./pages/SendFeedback";
import TermsPrivacy from "./pages/TermsPrivacy";
import WaterMonitoring from "./pages/WaterMonitoring";
import ElectricityMonitoring from "./pages/ElectricityMonitoring";
import DashboardTabs from "./pages/DashboardTabs";
import PageTransition from "@/components/PageTransition";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10000, // Cache data for 10 seconds to prevent unnecessary refetches
    },
  },
});

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PageTransition><Index /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
            <Route path="/registration-success" element={<PageTransition><RegistrationSuccess /></PageTransition>} />
            <Route path="/success" element={<PageTransition><SuccessScreen /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
            <Route path="/edit-profile" element={<PageTransition><EditProfile /></PageTransition>} />
            <Route path="/dashboard" element={<PageTransition><DashboardTabs /></PageTransition>} />
            <Route path="/water" element={<PageTransition><DashboardTabs /></PageTransition>} />
            <Route path="/electricity" element={<PageTransition><DashboardTabs /></PageTransition>} />
            <Route path="/water-monitoring" element={<PageTransition><WaterMonitoring /></PageTransition>} />
            <Route path="/electricity-monitoring" element={<PageTransition><ElectricityMonitoring /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
            <Route path="/change-password" element={<PageTransition><ChangePassword /></PageTransition>} />
            <Route path="/help" element={<PageTransition><HelpFAQ /></PageTransition>} />
            <Route path="/send-feedback" element={<PageTransition><SendFeedback /></PageTransition>} />
            <Route path="/terms-privacy" element={<PageTransition><TermsPrivacy /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
