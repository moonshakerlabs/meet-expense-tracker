import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CURRENCIES, COUNTRIES, LANGUAGES, UserSettings } from "@/types/expense";
import { Check, Sun, Moon, Smartphone, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OnboardingProps {
  onComplete: (settings: Partial<UserSettings>) => void;
}

type Step = "welcome" | "country" | "currency" | "theme";

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState<Step>("welcome");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">("system");
  const [countrySearch, setCountrySearch] = useState("");

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      // Pre-select currency based on country
      const currencyExists = CURRENCIES.find(c => c.code === country.currency);
      if (currencyExists) {
        setSelectedCurrency(country.currency);
      }
      // Set default language (first available, usually English)
      setSelectedLanguage(country.languages[0]);
    }
  };

  const handleCountryNext = () => {
    setStep("currency");
  };

  const handleCurrencyNext = () => {
    setStep("theme");
  };

  const handleComplete = () => {
    const currency = CURRENCIES.find((c) => c.code === selectedCurrency);
    onComplete({
      country: selectedCountry,
      language: selectedLanguage,
      currency: selectedCurrency,
      currencySymbol: currency?.symbol || "$",
      theme: selectedTheme,
      hasCompletedOnboarding: true,
    });
  };

  const filteredCountries = COUNTRIES.filter(country => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);
  const availableLanguages = selectedCountryData 
    ? LANGUAGES.filter(lang => selectedCountryData.languages.includes(lang.code))
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      {/* Progress indicators */}
      <div className="flex gap-2 mb-8">
        {["welcome", "country", "currency", "theme"].map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {step === "welcome" && (
        <div className="text-center animate-fade-in max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="font-display font-bold text-3xl mb-3">
            Welcome to <span className="gradient-text">MEET</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Track your daily expenses effortlessly and take control of your finances.
          </p>
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-semibold"
            onClick={() => setStep("country")}
          >
            Get Started
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {step === "country" && (
        <div className="animate-fade-in max-w-sm w-full">
          <h1 className="font-display font-bold text-2xl mb-2 text-center">
            Select Your Country
          </h1>
          <p className="text-muted-foreground mb-4 text-center">
            We'll set up your currency and language preferences.
          </p>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Country List */}
          <ScrollArea className="h-[280px] mb-4">
            <div className="space-y-2 pr-4">
              {filteredCountries.map((country) => (
                <Card
                  key={country.code}
                  className={`p-3 cursor-pointer transition-all duration-200 ${
                    selectedCountry === country.code
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => handleCountrySelect(country.code)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <p className="font-medium">{country.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {CURRENCIES.find(c => c.code === country.currency)?.name}
                        </p>
                      </div>
                    </div>
                    {selectedCountry === country.code && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Language Selection (show if country has multiple languages) */}
          {selectedCountry && availableLanguages.length > 1 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Preferred Language
              </p>
              <div className="flex gap-2 flex-wrap">
                {availableLanguages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={selectedLanguage === lang.code ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setSelectedLanguage(lang.code)}
                  >
                    {lang.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-semibold"
            onClick={handleCountryNext}
            disabled={!selectedCountry}
          >
            Continue
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {step === "currency" && (
        <div className="animate-fade-in max-w-sm w-full">
          <h1 className="font-display font-bold text-2xl mb-2 text-center">
            Confirm Currency
          </h1>
          <p className="text-muted-foreground mb-6 text-center">
            We've pre-selected based on your country. Change if needed.
          </p>
          <ScrollArea className="h-[320px] mb-6">
            <div className="grid grid-cols-2 gap-3 pr-4">
              {CURRENCIES.map((currency) => (
                <Card
                  key={currency.code}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedCurrency === currency.code
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => setSelectedCurrency(currency.code)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{currency.symbol}</p>
                      <p className="text-sm text-muted-foreground">{currency.code}</p>
                    </div>
                    {selectedCurrency === currency.code && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-semibold"
            onClick={handleCurrencyNext}
          >
            Continue
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {step === "theme" && (
        <div className="animate-fade-in max-w-sm w-full">
          <h1 className="font-display font-bold text-2xl mb-2 text-center">
            Choose Theme
          </h1>
          <p className="text-muted-foreground mb-6 text-center">
            Select your preferred appearance.
          </p>
          <div className="space-y-3 mb-8">
            {[
              { id: "light" as const, icon: Sun, label: "Light", desc: "Clean & bright" },
              { id: "dark" as const, icon: Moon, label: "Dark", desc: "Elegant night mode" },
              { id: "system" as const, icon: Smartphone, label: "System", desc: "Match device settings" },
            ].map((theme) => (
              <Card
                key={theme.id}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  selectedTheme === theme.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-secondary"
                }`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <theme.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{theme.label}</p>
                    <p className="text-sm text-muted-foreground">{theme.desc}</p>
                  </div>
                  {selectedTheme === theme.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-semibold"
            onClick={handleComplete}
          >
            Start Tracking
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
