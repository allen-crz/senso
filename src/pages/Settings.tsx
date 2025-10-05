import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Home, Droplet, Bolt, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { useDemoForecastReset, useAdminDailyBillingCheck } from '@/hooks/useCostForecasting';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { firstName, email, phone, address, avatarUrl, isLoading } = useUserData();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showDemoSection, setShowDemoSection] = useState(false);

  const demoForecastReset = useDemoForecastReset();
  const adminBillingCheck = useAdminDailyBillingCheck();

  const capitalizedFirstName = firstName 
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1) 
    : 'User';

  const handleLogout = async () => {
    try {
      await signOut();
      // Small delay to ensure state is cleared
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate anyway on error
      navigate('/login', { replace: true });
    }
  };

  const handleDemoWaterReset = async () => {
    try {
      await demoForecastReset.mutateAsync('water');
      toast({
        title: "Water Forecast Reset Complete",
        description: "Billing cycle transition simulated. Check dashboard for updated comparison.",
      });
    } catch (error: any) {
      toast({
        title: "Demo Failed",
        description: error.message || "Failed to trigger demo reset",
        variant: "destructive",
      });
    }
  };

  const handleDemoElectricityReset = async () => {
    try {
      await demoForecastReset.mutateAsync('electricity');
      toast({
        title: "Electricity Forecast Reset Complete",
        description: "Billing cycle transition simulated. Check dashboard for updated comparison.",
      });
    } catch (error: any) {
      toast({
        title: "Demo Failed",
        description: error.message || "Failed to trigger demo reset",
        variant: "destructive",
      });
    }
  };

  const handleAdminBillingCheck = async () => {
    try {
      await adminBillingCheck.mutateAsync();
      toast({
        title: "Daily Billing Check Complete",
        description: "Checked all users for billing cycle transitions.",
      });
    } catch (error: any) {
      toast({
        title: "Admin Check Failed",
        description: error.message || "Failed to trigger billing check",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] pb-20">
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#212529]">Settings</h1>
          <i className="fa-solid fa-cog text-[#212529] text-xl"></i>
        </div>
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarUrl || ''} alt="Profile" />
              <AvatarFallback>{capitalizedFirstName[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#212529] text-lg">{capitalizedFirstName}</h3>
              <p className="text-sm text-gray-500 truncate">{email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/edit-profile', { state: { fromSettings: true } })}
              className="w-full mt-4 py-2.5 px-4 bg-gray-50 text-[#212529] rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Edit Profile</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
            <button 
              onClick={() => navigate('/change-password')}
              className="w-full py-2.5 px-4 bg-gray-50 text-[#212529] rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Change Password</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
            <button 
              onClick={() => navigate('/preferences')}
              className="w-full py-2.5 px-4 bg-gray-50 text-[#212529] rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Preferences</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </Card>

        <div className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden">
          <h3 className="px-6 pt-6 pb-2 text-sm font-medium text-gray-500">Support</h3>
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => navigate('/help')}
              className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 group focus:outline-none focus:ring-2 focus:ring-gray-100"
              type="button"
              tabIndex={0}
            >
              <span className="font-medium group-hover:text-[#212529] transition-colors">Help & FAQs</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
            <button 
              onClick={() => navigate('/send-feedback')}
              className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 group focus:outline-none focus:ring-2 focus:ring-gray-100"
              type="button"
              tabIndex={0}
            >
              <span className="font-medium group-hover:text-[#212529] transition-colors">Send Feedback</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden">
          <div className="divide-y divide-gray-100">
            <button
              onClick={() => navigate('/terms-privacy')}
              className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 group focus:outline-none focus:ring-2 focus:ring-gray-100"
              type="button"
            >
              <span className="font-medium group-hover:text-[#212529] transition-colors">Terms &amp; Privacy Policy</span>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* Demo Controls - Collapsible Section */}
        <div className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => setShowDemoSection(!showDemoSection)}
            className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 group focus:outline-none focus:ring-2 focus:ring-gray-100"
            type="button"
          >
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-flask text-purple-500"></i>
              <span className="font-medium group-hover:text-[#212529] transition-colors">Demo Controls</span>
            </div>
            <i className={`fa-solid fa-chevron-${showDemoSection ? 'up' : 'down'} text-gray-400 transition-transform`}></i>
          </button>

          {showDemoSection && (
            <div className="px-6 pb-4 space-y-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mt-4 mb-3">
                Simulate billing cycle transitions without waiting for actual billing date
              </p>

              {/* Water Demo Reset */}
              <button
                onClick={handleDemoWaterReset}
                disabled={demoForecastReset.isPending}
                className="w-full py-3 px-4 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-between hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4" />
                  <span className="font-medium">Reset Water Forecast</span>
                </div>
                {demoForecastReset.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>

              {/* Electricity Demo Reset */}
              <button
                onClick={handleDemoElectricityReset}
                disabled={demoForecastReset.isPending}
                className="w-full py-3 px-4 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-between hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Bolt className="w-4 h-4" />
                  <span className="font-medium">Reset Electricity Forecast</span>
                </div>
                {demoForecastReset.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>

              {/* Admin Daily Check */}
              <button
                onClick={handleAdminBillingCheck}
                disabled={adminBillingCheck.isPending}
                className="w-full py-3 px-4 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-between hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-users"></i>
                  <span className="font-medium">Run Daily Billing Check (All Users)</span>
                </div>
                {adminBillingCheck.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  This simulates the automatic midnight scheduler. After triggering, go to Dashboard to see the "Last Month Accuracy" section appear.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mb-6">Version 1.0.0</p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full py-4 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg mb-8 focus:outline-none focus:ring-2 focus:ring-red-300"
              type="button"
              tabIndex={0}
            >
              Log Out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[90%] max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">Log Out</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Are you sure you want to log out of your account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 focus:ring-red-300"
                onClick={handleLogout}
              >
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="fixed bottom-6 left-6 right-6 z-30">
        <div className="bg-[#212529] rounded-full px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <Home className="text-gray-400 group-hover:text-white" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Home</span>
            </button>
            <button
              onClick={() => navigate('/water-monitoring')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Droplet className="text-gray-400 group-hover:text-blue-500" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">Water</span>
            </button>
            <button
              onClick={() => navigate('/electricity-monitoring')}
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 group-hover:bg-amber-50 rounded-full flex items-center justify-center transition-colors duration-150">
                <Bolt className="text-gray-400 group-hover:text-amber-500" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors">Electric</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 active:scale-95"
              type="button"
              tabIndex={0}
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center transition-colors duration-150">
                <SettingsIcon className="text-white" />
              </div>
              <span className="text-xs font-medium text-white group-hover:text-white/80 transition-colors">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
