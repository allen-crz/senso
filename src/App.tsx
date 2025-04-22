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
    },
  },
});

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/registration-success" element={<RegistrationSuccess />} />
              <Route path="/success" element={<SuccessScreen />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/dashboard" element={<DashboardTabs />} />
              <Route path="/water" element={<DashboardTabs />} />
              <Route path="/electricity" element={<DashboardTabs />} />
              <Route path="/water-monitoring" element={<WaterMonitoring />} />
              <Route path="/electricity-monitoring" element={<ElectricityMonitoring />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/help" element={<HelpFAQ />} />
              <Route path="/send-feedback" element={<SendFeedback />} />
              <Route path="/terms-privacy" element={<TermsPrivacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
