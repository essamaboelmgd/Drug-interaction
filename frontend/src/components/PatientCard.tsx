import type { Patient } from "@/services/api";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface PatientCardProps {
  patient: Patient;
  selected: boolean;
  onClick: () => void;
}

export function PatientCard({ patient, selected, onClick }: PatientCardProps) {
  const initials = getInitials(patient.full_name);
  const color = getAvatarColor(patient.full_name);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted/60",
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {patient.full_name}
        </p>
        <p className="text-xs text-muted-foreground">
          Age {patient.age} · {patient.phone}
        </p>
      </div>
      <StatusBadge status={patient.status} />
    </button>
  );
}
