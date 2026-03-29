import type { PatientStatus } from "@/services/api";
import { cn } from "@/lib/utils";

const statusConfig: Record<PatientStatus, string> = {
  Critical: "bg-critical/10 text-critical border-critical/20",
  Stable: "bg-success/10 text-success border-success/20",
  "Under Treatment": "bg-warning/10 text-warning border-warning/20",
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        statusConfig[status]
      )}
    >
      {status}
    </span>
  );
}
