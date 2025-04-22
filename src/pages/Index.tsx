
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import MobileOnlyScreen from "../components/MobileOnlyScreen";
import { isMobileDevice, isStandalone } from "../utils/deviceDetection";
import InstallPrompt from "../components/InstallPrompt";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if it's a mobile device and if it's installed as PWA
    const mobile = isMobileDevice();
    const installed = isStandalone();
    
    setIsMobile(mobile);
    setIsInstalled(installed);
    
    // Only proceed to login if it's mobile AND installed as PWA
    const timer = setTimeout(() => {
      setLoading(false);
      if (mobile && installed) {
        navigate('/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Show loading screen initially
  if (loading) {
    return <LoadingScreen />;
  }

  // If not mobile, show mobile only screen
  if (!isMobile) {
    return <MobileOnlyScreen />;
  }

  // If mobile but not installed, show install prompt
  if (!isInstalled) {
    return <InstallPrompt />;
  }

  return null;
};

export default Index;
