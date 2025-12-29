import { useState } from "react";
import SplashScreen from "@/components/SplashScreen";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <div
        className={`flex min-h-screen items-center justify-center bg-background transition-opacity duration-300 ${
          showSplash ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">MET Moon</h1>
          <p className="text-xl text-muted-foreground">
            Monthly Expense Tracker
          </p>
        </div>
      </div>
    </>
  );
};

export default Index;
