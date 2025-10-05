import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
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
import WaterMeterCamera from "./pages/WaterMeterCamera";
import ElectricityMeterCamera from "./pages/ElectricityMeterCamera";
import UserPreferences from "./pages/UserPreferences";
import ConsumptionInput from "./pages/ConsumptionInput";
import ProviderSelection from "./pages/ProviderSelection";
import MeterReading from "./pages/help/MeterReading";
import Notifications from "./pages/help/Notifications";
import UsageStats from "./pages/help/UsageStats";
import GettingStarted from "./pages/help/GettingStarted";
import AccountSettings from "./pages/help/AccountSettings";
import Troubleshooting from "./pages/help/Troubleshooting";
import PageTransition from "@/components/layout/PageTransition";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/app/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 30 * 60 * 1000, // 30 minutes cache
    },
  },
});

// Component to handle query invalidation on user activity after inactivity
const QueryRefreshHandler = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let lastActivityTime = Date.now();
    const INACTIVITY_THRESHOLD = 10 * 60 * 1000; // 10 minutes

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const inactiveTime = now - lastActivityTime;

        // If user was inactive for more than threshold, invalidate all queries
        if (inactiveTime > INACTIVITY_THRESHOLD) {
          console.log('[App] User returned after inactivity, invalidating all queries...');
          queryClient.invalidateQueries();
        }

        lastActivityTime = now;
      }
    };

    const handleActivity = () => {
      lastActivityTime = Date.now();
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for user activity
    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [queryClient]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <QueryRefreshHandler />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<PageTransition enableSlide><Index /></PageTransition>} />
          <Route path="/login" element={<PageTransition enableSlide><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition enableSlide><Register /></PageTransition>} />
          <Route path="/registration-success" element={<PageTransition enableSlide><RegistrationSuccess /></PageTransition>} />
          <Route path="/success" element={<PageTransition enableSlide><SuccessScreen /></PageTransition>} />
          <Route path="/profile" element={<PageTransition enableSlide><ProtectedRoute><Profile /></ProtectedRoute></PageTransition>} />
          <Route path="/edit-profile" element={<PageTransition enableSlide><ProtectedRoute><EditProfile /></ProtectedRoute></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition enableSlide><ProtectedRoute><DashboardTabs /></ProtectedRoute></PageTransition>} />
          <Route path="/water" element={<PageTransition enableSlide><ProtectedRoute><DashboardTabs /></ProtectedRoute></PageTransition>} />
          <Route path="/electricity" element={<PageTransition enableSlide><ProtectedRoute><DashboardTabs /></ProtectedRoute></PageTransition>} />
          <Route path="/water-monitoring" element={<PageTransition enableSlide><ProtectedRoute><WaterMonitoring /></ProtectedRoute></PageTransition>} />
          <Route path="/electricity-monitoring" element={<PageTransition enableSlide><ProtectedRoute><ElectricityMonitoring /></ProtectedRoute></PageTransition>} />
          <Route path="/settings" element={<PageTransition enableSlide><ProtectedRoute><Settings /></ProtectedRoute></PageTransition>} />
          <Route path="/preferences" element={<PageTransition enableSlide><ProtectedRoute><UserPreferences /></ProtectedRoute></PageTransition>} />
          <Route path="/consumption-input" element={<PageTransition enableSlide><ProtectedRoute><ConsumptionInput /></ProtectedRoute></PageTransition>} />
          <Route path="/provider-selection" element={<PageTransition enableSlide><ProtectedRoute><ProviderSelection /></ProtectedRoute></PageTransition>} />
          <Route path="/change-password" element={<PageTransition enableSlide><ProtectedRoute><ChangePassword /></ProtectedRoute></PageTransition>} />
          <Route path="/help" element={<PageTransition enableSlide><ProtectedRoute><HelpFAQ /></ProtectedRoute></PageTransition>} />
          <Route path="/send-feedback" element={<PageTransition enableSlide><ProtectedRoute><SendFeedback /></ProtectedRoute></PageTransition>} />
          <Route path="/terms-privacy" element={<PageTransition enableSlide><TermsPrivacy /></PageTransition>} />
          <Route path="/water-meter-camera" element={<PageTransition enableSlide><ProtectedRoute><WaterMeterCamera /></ProtectedRoute></PageTransition>} />
          <Route path="/electricity-meter-camera" element={<PageTransition enableSlide><ProtectedRoute><ElectricityMeterCamera /></ProtectedRoute></PageTransition>} />
          <Route path="/help/meter-reading" element={<PageTransition enableSlide><MeterReading /></PageTransition>} />
          <Route path="/help/notifications" element={<PageTransition enableSlide><Notifications /></PageTransition>} />
          <Route path="/help/usage-stats" element={<PageTransition enableSlide><UsageStats /></PageTransition>} />
          <Route path="/help/getting-started" element={<PageTransition enableSlide><GettingStarted /></PageTransition>} />
          <Route path="/help/account-settings" element={<PageTransition enableSlide><AccountSettings /></PageTransition>} />
          <Route path="/help/troubleshooting" element={<PageTransition enableSlide><Troubleshooting /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
        <Toaster />
        <Sonner />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
