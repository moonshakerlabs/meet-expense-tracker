import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

const SplashScreen = ({ onComplete, duration = 3000 }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger content animation after mount
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 100);

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, hsl(220, 25%, 8%) 0%, hsl(220, 30%, 15%) 50%, hsl(158, 40%, 15%) 100%)",
      }}
    >
      {/* Finance-themed abstract background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating currency symbols */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["$", "€", "£", "¥", "₹", "₿"].map((symbol, i) => (
            <span
              key={i}
              className="absolute text-primary/5 font-display font-bold select-none"
              style={{
                fontSize: `${Math.random() * 60 + 40}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 30 - 15}deg)`,
              }}
            >
              {symbol}
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className={`relative z-10 flex flex-col items-center text-center px-8 transition-all duration-700 ${
        showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>
        {/* Main Title */}
        <h1 className="font-display font-bold text-7xl sm:text-8xl md:text-9xl tracking-tight text-white mb-4">
          MEET
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-white/80 font-medium mb-2">
          Monthly Expense Entry & Tracking
        </p>
        
        {/* Smaller MEET */}
        <p className="text-lg text-primary font-display font-semibold mb-1">
          MEET
        </p>
        
        {/* Tagline */}
        <p className="text-sm text-white/50 italic">
          meet your hard-earned money
        </p>

        {/* Loading indicator */}
        <div className="mt-12 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom credit */}
      <div className={`absolute bottom-8 left-0 right-0 text-center transition-all duration-700 delay-300 ${
        showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}>
        <p className="text-xs text-white/30 tracking-wider">
          Built with Love by <span className="text-primary/60">MoonShaker Labs</span>
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
