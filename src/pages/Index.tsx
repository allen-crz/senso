
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/app/LoadingScreen";
import MobileOnlyScreen from "../components/app/MobileOnlyScreen";
import { isMobileDevice, isStandalone, isIOSDevice } from "../utils/deviceDetection";
import InstallPrompt from "../components/app/InstallPrompt";

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
    
    // Navigate to login after loading, bypassing iOS restrictions for dev
    const timer = setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Show loading screen initially
  if (loading) {
    return <LoadingScreen />;
  }

  // Mobile blocking commented out for development access
  // If not mobile device, show mobile only screen
  // if (!isMobile) {
  //   return <MobileOnlyScreen />;
  // }

  // If iOS but not installed, show install prompt
  // if (!isInstalled) {
  //   return <InstallPrompt />;
  // }

  return null;
};

export default Index;
