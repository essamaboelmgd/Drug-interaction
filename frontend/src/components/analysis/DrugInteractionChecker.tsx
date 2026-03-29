import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertTriangle, Pill, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api, type Patient, type InteractionResult } from "@/services/api";
import { toast } from "sonner";

const SEVERITY_CONFIG: Record<
  string,
  { label: string; cardClass: string; iconClass: string; badgeClass: string }
> = {
  none: {
    label: "No Interaction",
    cardClass: "border-green-500/30 bg-green-500/5",
    iconClass: "bg-green-500/20",
    badgeClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  mild: {
    label: "Mild",
    cardClass: "border-green-400/30 bg-green-400/5",
    iconClass: "bg-green-400/20",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  moderate: {
    label: "Moderate",
    cardClass: "border-yellow-500/30 bg-yellow-500/5",
    iconClass: "bg-yellow-500/20",
    badgeClass:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  severe: {
    label: "Severe",
    cardClass: "border-orange-500/30 bg-orange-500/5",
    iconClass: "bg-orange-500/20",
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  contraindicated: {
    label: "Contraindicated",
    cardClass: "border-destructive/30 bg-destructive/5",
    iconClass: "bg-destructive/20",
    badgeClass:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface Props {
  patient?: Patient | null;
}

export function DrugInteractionChecker({ patient }: Props) {
  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);

  const handleCheck = async () => {
    if (!drug1.trim() || !drug2.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await api.interactions.check(
        drug1.trim(),
        drug2.trim(),
        patient?.id,
      );
      setResult(res.data);
    } catch (err: any) {
      if (err.status === 429) {
        toast.error(
          "Rate limit exceeded. Please wait a moment before checking again.",
        );
      } else if (err.status === 502) {
        toast.error("AI service temporarily unavailable. Please try again.");
      } else if (err.status === 422) {
        toast.error(
          err.data?.detail?.[0]?.msg ||
            "Invalid input. Please check the drug names.",
        );
      } else {
        toast.error("Failed to check interaction. Please try again.");
      }
    } finally {
      setChecking(false);
    }
  };

  const cfg = result
    ? (SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.none)
    : null;

  const patientInitials = patient?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-5">
      {/* Patient header */}
      {patient && (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {patientInitials}
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {patient.full_name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Age {patient.age} · Clinical AI Interaction Checker
            </p>
          </div>
        </div>
      )}

      {/* Input area */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Drug Interaction Checker
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter two medications to check for potential conflicts
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Medication 1</label>
                <Input
                  placeholder="e.g. Aspirin"
                  value={drug1}
                  onChange={(e) => setDrug1(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Medication 2</label>
                <Input
                  placeholder="e.g. Warfarin"
                  value={drug2}
                  onChange={(e) => setDrug2(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                />
              </div>
            </div>

            <Button
              onClick={handleCheck}
              disabled={!drug1.trim() || !drug2.trim() || checking}
              className="w-full mt-2"
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Check Interactions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && cfg && (
        <Card className={cn("border", cfg.cardClass)}>
          <CardContent className="p-5 space-y-5">
            {/* Severity + summary */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  cfg.iconClass,
                )}
              >
                {result.interaction_found ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Severity
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      cfg.badgeClass,
                    )}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground">{result.summary}</p>
              </div>
            </div>

            {/* Mechanism */}
            {result.mechanism && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Mechanism
                </p>
                <p className="text-sm text-foreground">{result.mechanism}</p>
              </div>
            )}

            {/* Side Effects */}
            {result.side_effects?.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Side Effects
                </p>
                <ul className="space-y-1 pl-5">
                  {result.side_effects.map((s, i) => (
                    <li key={i} className="text-sm text-foreground list-disc">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {result.risks?.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Risks
                </p>
                <ul className="space-y-1 pl-5">
                  {result.risks.map((r, i) => (
                    <li key={i} className="text-sm text-foreground list-disc">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Poisoning Risk */}
            {result.poisoning_risk?.exists && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-1">
                  Poisoning Risk
                </p>
                <p className="text-sm text-foreground">
                  {result.poisoning_risk.description}
                </p>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Recommendations
                </p>
                <ul className="space-y-1 pl-5">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-foreground list-disc">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            {result.disclaimer && (
              <div className="flex items-start gap-2 pt-2 border-t">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {result.disclaimer}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
