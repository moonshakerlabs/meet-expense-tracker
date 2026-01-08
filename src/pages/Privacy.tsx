import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Database, Download, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyProps {
  onBack: () => void;
}

const Privacy = ({ onBack }: PrivacyProps) => {
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
          <h1 className="font-display font-bold text-xl">Privacy</h1>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Main Privacy Card */}
          <Card className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Your Data is Private</h2>
                <p className="text-sm text-muted-foreground">100% on-device storage</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              MEET stores all your expense data <strong className="text-foreground">exclusively on your device</strong>. 
              Your financial information never leaves your phone and is never uploaded to any external servers.
            </p>
          </Card>

          {/* Data Storage */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              How Your Data is Stored
            </h3>
            <Card className="rounded-2xl divide-y divide-border">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <Database className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Local Storage Only</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All expenses, income, settings, and categories are stored in your device's 
                      local storage. No cloud sync, no external databases.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mt-0.5">
                    <Download className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Export Your Data Anytime</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can export your expense data as CSV or JSON files at any time 
                      from Settings → Data → Export.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* User Responsibility */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              Important Information
            </h3>
            <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400">Backup Responsibility</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Since data is stored only on your device, <strong className="text-foreground">you are responsible 
                      for making periodic backups</strong> of your expense data using the export feature.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Data may be lost due to:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-1">
                      <li>Device loss or damage</li>
                      <li>App uninstallation</li>
                      <li>Clearing app data/cache</li>
                      <li>Factory reset</li>
                    </ul>
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mt-3">
                      We recommend exporting your data regularly and storing backups in a safe location.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* No Data Collection */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              What We Don't Collect
            </h3>
            <Card className="p-4 rounded-2xl">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>No personal information</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>No expense or financial data</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>No usage analytics or tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>No cookies or advertising IDs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>No third-party data sharing</span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="text-center pt-4 pb-8">
            <p className="text-xs text-muted-foreground">
              MEET v1.0.0 · Built with ❤️ by MoonShaker Labs
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Privacy;
