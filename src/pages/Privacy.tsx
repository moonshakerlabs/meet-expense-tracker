import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Database, Download, AlertTriangle, Mail, User } from "lucide-react";
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
          <h1 className="font-display font-bold text-xl">Privacy Policy</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-72px)]">
        <div className="p-5 space-y-6">
          {/* Header Card */}
          <Card className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">MEET - Monthly Expense Entry and Tracking</h2>
                <p className="text-sm text-muted-foreground">Last Updated: 12-January-2026</p>
              </div>
            </div>
          </Card>

          {/* Section 1: Introduction */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">1. Introduction</h3>
            <Card className="p-4 rounded-2xl">
              <p className="text-sm text-muted-foreground leading-relaxed">
                MEET - Monthly Expense Entry and Tracking ("we", "our", "us") is an expense tracking 
                application designed to help users manage their personal spending. We respect your 
                privacy and are committed to protecting your personal data. This Privacy Policy 
                explains what data we collect, how it is used, and your rights.
              </p>
              <p className="text-sm text-muted-foreground mt-3 font-medium">
                By using this app, you agree to this Privacy Policy.
              </p>
            </Card>
          </div>

          {/* Section 2: Information We Collect */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">2. Information We Collect</h3>
            <Card className="rounded-2xl divide-y divide-border">
              <div className="p-4">
                <h4 className="font-medium mb-2">2.1 User-Provided Information</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Currently, our app does not require account creation and does not collect personal 
                  data on our servers. You may enter the following information, which is stored only 
                  on your device:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
                  <li>Expense details (amount, category, date, notes, etc.)</li>
                </ul>
                <p className="text-sm text-primary mt-3 font-medium">
                  We do not collect bank account details, credit/debit card numbers, UPI IDs, or 
                  financial login credentials.
                </p>
              </div>
              <div className="p-4">
                <h4 className="font-medium mb-2">2.2 Automatically Collected Information</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We currently do not collect analytics data, crash logs, or device identifiers on 
                  our servers.
                </p>
              </div>
            </Card>
          </div>

          {/* Section 3: Storage & Processing */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">3. Storage & Processing of Data</h3>
            <Card className="p-4 rounded-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mt-0.5">
                  <Database className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Local Storage Only</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All expense data is stored locally on your device only. Data is fully controlled by you.
                  </p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  If you choose to export, back up, upload, or share your data, it is handled entirely by you.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  There is no cloud storage, and we do not have access to your data.
                </li>
              </ul>
            </Card>
          </div>

          {/* Section 4: Google Sign-In */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">4. Google Sign-In</h3>
            <Card className="p-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The app currently displays a Google Sign-In option, but this feature is 
                <strong className="text-foreground"> not active and not functional</strong> at this time. 
                No Google account data is collected, stored, or processed.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                If Google Sign-In is activated in future, this Privacy Policy will be updated.
              </p>
            </Card>
          </div>

          {/* Section 5: Data Sharing */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">5. Data Sharing</h3>
            <Card className="p-4 rounded-2xl">
              <p className="text-sm font-medium mb-3">We:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Do not sell data
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Do not share data with third parties
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Do not transfer data to servers
                </li>
              </ul>
              <p className="text-sm text-primary mt-3 font-medium">
                Your data never leaves your device unless you choose to export it.
              </p>
            </Card>
          </div>

          {/* Section 6: Legal Compliance */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">6. Legal Compliance</h3>
            <Card className="rounded-2xl divide-y divide-border">
              <div className="p-4">
                <h4 className="font-medium mb-2">GDPR (EU / EEA Users)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Although we do not collect personal data on our servers, we follow principles of 
                  transparency, data minimization, and user control. Since we do not process user 
                  data on our servers, GDPR data subject processing obligations are minimal. However, 
                  users may contact us for any privacy concerns.
                </p>
              </div>
              <div className="p-4">
                <h4 className="font-medium mb-2">India Digital Personal Data Protection (DPDP) Act, 2023</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We do not process or store personal data on our servers. Users retain full control 
                  of their data stored locally on their devices.
                </p>
              </div>
            </Card>
          </div>

          {/* Section 7: Children's Privacy */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">7. Children's Privacy</h3>
            <Card className="p-4 rounded-2xl">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This app is not intended for children under 13. We do not knowingly collect data from 
                children. If you believe a child has provided data, please contact us.
              </p>
            </Card>
          </div>

          {/* Section 8: Data Retention */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">8. Data Retention</h3>
            <Card className="p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mt-0.5">
                  <Download className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All data remains on your device until you delete it or uninstall the app. 
                    <strong className="text-foreground"> We retain no data.</strong>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 9: Security */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">9. Security</h3>
            <Card className="p-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Since data is stored locally on your device, please ensure your device is protected. 
                    We are not responsible for device-level security incidents.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 10: Changes to Policy */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">10. Changes to This Policy</h3>
            <Card className="p-4 rounded-2xl">
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. Updates will be published here 
                with a revised "Last Updated" date.
              </p>
            </Card>
          </div>

          {/* Section 11: Contact Us */}
          <div>
            <h3 className="text-lg font-semibold mb-3 px-1">11. Contact Us</h3>
            <Card className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions or privacy concerns, contact us at:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <a 
                    href="mailto:connect@moonshakerlabs.com" 
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    connect@moonshakerlabs.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground font-medium">Sujatha</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 pb-8">
            <p className="text-xs text-muted-foreground">
              MEET v1.0.0 · Developer: MoonShaker Labs
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Privacy;
