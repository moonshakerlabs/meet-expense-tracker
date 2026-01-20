import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Smartphone, PieChart, Globe, TrendingUp } from "lucide-react";

interface AppOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const slides = [
  {
    id: 1,
    title: "Track Daily Expenses Easily",
    highlight: "Log your everyday spending in seconds.",
    subtext: "Simple, fast, and flexible expense entry.",
    icon: Smartphone,
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    id: 2,
    title: "View Category & Monthly Summaries",
    highlight: "Understand where your money goes.",
    subtext: "View expenses by category, month, week, and year.",
    icon: PieChart,
    gradient: "from-teal-500/20 to-green-500/20",
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-400",
  },
  {
    id: 3,
    title: "Multi-Currency Support",
    highlight: "Add expenses in different currencies.",
    subtext: "View totals and breakdowns for each supported currency.",
    icon: Globe,
    gradient: "from-green-500/20 to-lime-500/20",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
  },
  {
    id: 4,
    title: "Smart Insights & Better Control",
    highlight: "See trends and manage your spending smarter.",
    subtext: "Make informed decisions with charts and insights.",
    icon: TrendingUp,
    gradient: "from-lime-500/20 to-emerald-500/20",
    iconBg: "bg-lime-500/20",
    iconColor: "text-lime-400",
  },
];

const AppOnboarding = ({ onComplete, onSkip }: AppOnboardingProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const isLastSlide = currentSlide === slides.length - 1;
  const currentSlideData = slides[currentSlide];
  const IconComponent = currentSlideData.icon;

  return (
    <div 
      className="min-h-screen bg-background flex flex-col safe-top safe-bottom overflow-hidden"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Skip Button */}
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onSkip}
        >
          Skip
        </Button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Illustration Placeholder */}
        <div 
          className={`w-64 h-64 rounded-3xl bg-gradient-to-br ${currentSlideData.gradient} flex items-center justify-center mb-8 transition-all duration-500`}
        >
          <div className={`w-24 h-24 rounded-2xl ${currentSlideData.iconBg} flex items-center justify-center`}>
            <IconComponent className={`w-12 h-12 ${currentSlideData.iconColor}`} />
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center max-w-sm animate-fade-in" key={currentSlide}>
          <h1 className="font-display font-bold text-2xl mb-3 text-foreground">
            {currentSlideData.title}
          </h1>
          <p className="text-lg font-medium text-primary mb-2">
            {currentSlideData.highlight}
          </p>
          <p className="text-muted-foreground">
            {currentSlideData.subtext}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-6 pb-8">
        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted hover:bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl h-14 px-6"
              onClick={handleBack}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            size="lg"
            className={`${currentSlide > 0 ? 'flex-1' : 'w-full'} rounded-2xl h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0`}
            onClick={handleNext}
          >
            {isLastSlide ? "Get Started" : "Next"}
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppOnboarding;
