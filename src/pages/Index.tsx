
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import MobileOnlyScreen from "../components/MobileOnlyScreen";
import { isMobileDevice } from "../utils/deviceDetection";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if it's a mobile device
    const mobile = isMobileDevice();
    setIsMobile(mobile);
    
    // Simulate loading and redirect to login
    const timer = setTimeout(() => {
      setLoading(false);
      if (mobile) {
        navigate('/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  // If still loading, show loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  // If not a mobile device, show mobile only screen
  if (!isMobile) {
    return <MobileOnlyScreen />;
  }

  return null;
};

export default Index;
