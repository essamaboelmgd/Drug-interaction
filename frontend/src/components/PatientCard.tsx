import type { Patient } from "@/lib/dummy-data";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

interface PatientCardProps {
  patient: Patient;
  selected: boolean;
  onClick: () => void;
}

export function PatientCard({ patient, selected, onClick }: PatientCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted/60"
      )}
    >
      <img
        src={patient.image}
        alt={patient.name}
        className="h-10 w-10 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {patient.name}
        </p>
        <p className="text-xs text-muted-foreground">
          Age {patient.age} · {patient.phone}
        </p>
      </div>
      <StatusBadge status={patient.status} />
    </button>
  );
}
