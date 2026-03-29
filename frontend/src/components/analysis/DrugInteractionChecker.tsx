import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertTriangle, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/dummy-data";

interface InteractionResult {
  hasConflict: boolean;
  severity: "none" | "moderate" | "severe";
  description: string;
  recommendations: string[];
}

const mockCheck = (drug1: string, drug2: string): InteractionResult => {
  const d1 = drug1.toLowerCase();
  const d2 = drug2.toLowerCase();
  
  if ((d1 === "aspirin" && d2 === "warfarin") || (d2 === "aspirin" && d1 === "warfarin")) {
    return {
      hasConflict: true,
      severity: "severe",
      description: "Major interaction detected between Aspirin and Warfarin.",
      recommendations: [
        "Concurrent use significantly increases the risk of bleeding.",
        "Consider alternative analgesic/anti-inflammatory therapy.",
        "If combination is necessary, close clinical and laboratory monitoring is required."
      ]
    };
  }
  
  if ((d1 === "lisinopril" && d2 === "ibuprofen") || (d2 === "lisinopril" && d1 === "ibuprofen")) {
    return {
      hasConflict: true,
      severity: "moderate",
      description: "Moderate interaction detected.",
      recommendations: [
        "NSAIDs like Ibuprofen may reduce the antihypertensive effect of ACE inhibitors like Lisinopril.",
        "Monitor blood pressure closely.",
        "Consider acetaminophen if appropriate."
      ]
    };
  }

  return {
    hasConflict: false,
    severity: "none",
    description: "No known significant interactions between these medications.",
    recommendations: [
      "Proceed with prescribed dosages.",
      "Monitor patient for any general side effects."
    ]
  };
};

interface Props {
  patient?: Patient | null;
}

export function DrugInteractionChecker({ patient }: Props) {
  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);

  const handleCheck = () => {
    if (!drug1.trim() || !drug2.trim()) return;
    
    setChecking(true);
    setResult(null);
    
    setTimeout(() => {
      setResult(mockCheck(drug1.trim(), drug2.trim()));
      setChecking(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-5">
      {/* Patient header */}
      {patient && (
        <div className="flex items-center gap-3">
          <img src={patient.image} alt={patient.name} className="h-10 w-10 rounded-full" />
          <div>
            <h2 className="text-base font-semibold text-foreground">{patient.name}</h2>
            <p className="text-xs text-muted-foreground">Age {patient.age} · Clinical AI Interaction Checker</p>
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
              <h3 className="text-lg font-semibold text-foreground">Drug Interaction Checker</h3>
              <p className="text-sm text-muted-foreground">Enter two medications to check for potential conflicts</p>
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
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Medication 2</label>
                <Input 
                  placeholder="e.g. Warfarin" 
                  value={drug2} 
                  onChange={(e) => setDrug2(e.target.value)} 
                />
              </div>
            </div>
            
            <Button 
              onClick={handleCheck} 
              disabled={!drug1.trim() || !drug2.trim() || checking}
              className="w-full mt-2"
            >
              {checking ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> Check Interactions</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={cn(
          "border",
          result.severity === "severe" ? "border-destructive/50 bg-destructive/5" :
          result.severity === "moderate" ? "border-warning/50 bg-warning/5" :
          "border-success/50 bg-success/5"
        )}>
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                result.severity === "severe" ? "bg-destructive/20" :
                result.severity === "moderate" ? "bg-warning/20" :
                "bg-success/20"
              )}>
                {result.hasConflict ? (
                  <AlertTriangle className={cn(
                    "h-4 w-4", 
                    result.severity === "severe" ? "text-destructive" : "text-warning"
                  )} />
                ) : (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Interaction Result
                </p>
                <p className={cn(
                  "mt-1 text-sm font-semibold",
                  result.severity === "severe" ? "text-destructive" :
                  result.severity === "moderate" ? "text-warning" :
                  "text-success"
                )}>
                  {result.description}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Recommendations
              </p>
              <ul className="space-y-1.5 pl-6">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-foreground list-disc">{r}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
