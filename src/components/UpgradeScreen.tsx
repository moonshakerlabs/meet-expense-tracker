import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Crown, Award, Clock } from "lucide-react";
import { FREE_FEATURES, FREEMIUM_FEATURES } from "@/types/subscription";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UpgradeScreenProps {
  onBack: () => void;
  onStartTrial: () => void;
  trialUsed: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
}

const UpgradeScreen = ({
  onBack,
  onStartTrial,
  trialUsed,
  isTrialActive,
  trialDaysRemaining,
}: UpgradeScreenProps) => {
  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">Upgrade to Freemium</h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-5 space-y-6 pb-32">
          {/* Hero Section */}
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2">
              Unlock Full Potential
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              One-time upgrade. Lifetime access. No login. No cloud.
            </p>
          </div>

          {/* Trial Status */}
          {isTrialActive && (
            <Card className="p-4 rounded-2xl bg-emerald-500/10 border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Trial Active
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* FREE Features */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Check className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Everything in Free</h3>
            </div>
            <Card className="rounded-2xl p-4">
              <div className="space-y-3">
                {FREE_FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{feature}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* FREEMIUM Features */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Plus with Freemium</h3>
            </div>
            <Card className="rounded-2xl p-4 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
              <div className="space-y-3">
                {FREEMIUM_FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Award className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm">{feature}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Data Privacy Note */}
          <Card className="rounded-2xl p-4 bg-secondary/50">
            <p className="text-sm text-center text-muted-foreground">
              <strong>Your data stays on your device.</strong>
              <br />
              No login. No cloud sync. No tracking.
            </p>
          </Card>

          {/* Future Pro Note */}
          <p className="text-xs text-center text-muted-foreground px-4">
            More advanced features like AI-powered insights may be introduced later under Pro.
          </p>
        </div>
      </ScrollArea>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-lg border-t border-border safe-bottom">
        {!trialUsed ? (
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            onClick={onStartTrial}
          >
            <Award className="w-5 h-5 mr-2" />
            Start 7-day Free Trial
          </Button>
        ) : isTrialActive ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              You're enjoying Freemium features
            </p>
            <p className="text-xs text-muted-foreground">
              Payment integration coming soon
            </p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Your trial has ended. Upgrade anytime to unlock Freemium features.
            </p>
            <p className="text-xs text-muted-foreground">
              Payment integration coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeScreen;
