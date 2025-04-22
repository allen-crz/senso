
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import MobileOnlyScreen from "../components/MobileOnlyScreen";
import { isMobileDevice, isStandalone, isIOSDevice } from "../utils/deviceDetection";
import InstallPrompt from "../components/InstallPrompt";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check device type and installation status
    const mobile = isMobileDevice();
    const ios = isIOSDevice();
    const installed = isStandalone();
    
    setIsMobile(mobile);
    setIsIOS(ios);
    setIsInstalled(installed);
    
    // Only proceed to login if it's iOS AND installed as PWA
    const timer = setTimeout(() => {
      setLoading(false);
      if (mobile && ios && installed) {
        navigate('/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Show loading screen initially
  if (loading) {
    return <LoadingScreen />;
  }

  // If not mobile or not iOS, show mobile only screen
  if (!isMobile || !isIOS) {
    return <MobileOnlyScreen />;
  }

  // If mobile iOS but not installed, show install prompt
  if (!isInstalled) {
    return <InstallPrompt />;
  }

  return null;
};

export default Index;
