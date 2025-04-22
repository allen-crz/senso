import { useEffect, useState } from "react";
import LoadingScreen from "../components/LoadingScreen";
import MobileOnlyScreen from "../components/MobileOnlyScreen";
import HomeContent from "../components/HomeContent";
import { isMobileDevice } from "../utils/deviceDetection";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if it's a mobile device
    setIsMobile(isMobileDevice());
    
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
      setIsReady(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // If still loading, show loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  // If not a mobile device, show mobile only screen
  if (!isMobile) {
    return <MobileOnlyScreen />;
  }

  // Main app content (shown only on mobile after loading)
  return (
    <HomeContent />
  );
};

export default Index;
