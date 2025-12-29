import { useEffect, useState } from "react";
import splashVertical from "@/assets/splash-vertical.png";
import splashHorizontal from "@/assets/splash-horizontal.png";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Portrait/Vertical orientation */}
      <img
        src={splashVertical}
        alt="MET Moon - Monthly Expense Tracker"
        className="h-full w-full object-cover portrait:block landscape:hidden"
      />
      {/* Landscape/Horizontal orientation */}
      <img
        src={splashHorizontal}
        alt="MET Moon - Monthly Expense Tracker"
        className="h-full w-full object-cover portrait:hidden landscape:block"
      />
    </div>
  );
};

export default SplashScreen;
