import { useState } from "react";
import { Edit2, Phone, MapPin, FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  api,
  type Patient,
  type PatientStatus,
  type InteractionHistory,
} from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SEVERITY_BADGE: Record<string, string> = {
  none: "bg-muted text-muted-foreground",
  mild: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  moderate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  severe:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  contraindicated:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

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

interface Props {
  patient: Patient;
  onUpdate: (updated: Patient) => void;
  onDelete: (id: number) => void;
  interactions: InteractionHistory[];
}

export function PatientDetails({
  patient,
  onUpdate,
  onDelete,
  interactions,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEdit = () => {
    setEditing(true);
    setEditData({ ...patient });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const changes: Record<string, unknown> = {};
      if (editData.full_name !== patient.full_name)
        changes.full_name = editData.full_name;
      if (editData.age !== patient.age) changes.age = editData.age;
      if (editData.status !== patient.status) changes.status = editData.status;
      if (editData.phone !== patient.phone) changes.phone = editData.phone;
      if (editData.address !== patient.address)
        changes.address = editData.address;
      if (editData.clinical_notes !== patient.clinical_notes)
        changes.clinical_notes = editData.clinical_notes;

      if (Object.keys(changes).length > 0) {
        const updated = await api.patients.update(
          patient.id,
          changes as Parameters<typeof api.patients.update>[1],
        );
        onUpdate(updated);
        toast.success("Patient updated");
      }
      setEditing(false);
      setEditData({});
    } catch {
      toast.error("Failed to update patient");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData({});
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.patients.delete(patient.id);
      onDelete(patient.id);
      toast.success(`${patient.full_name} removed`);
    } catch {
      toast.error("Failed to delete patient");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const initials = getInitials(patient.full_name);
  const color = getAvatarColor(patient.full_name);

  return (
    <>
      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white mb-3"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>

          {editing ? (
            <div className="w-full space-y-3">
              <Input
                value={editData.full_name || ""}
                onChange={(e) =>
                  setEditData({ ...editData, full_name: e.target.value })
                }
                placeholder="Name"
              />
              <Input
                type="number"
                value={editData.age || ""}
                onChange={(e) =>
                  setEditData({ ...editData, age: parseInt(e.target.value) })
                }
                placeholder="Age"
              />
              <Select
                value={editData.status}
                onValueChange={(v) =>
                  setEditData({ ...editData, status: v as PatientStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Under Treatment">Under Treatment</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={editData.phone || ""}
                onChange={(e) =>
                  setEditData({ ...editData, phone: e.target.value })
                }
                placeholder="Phone"
              />
              <Input
                value={editData.address || ""}
                onChange={(e) =>
                  setEditData({ ...editData, address: e.target.value })
                }
                placeholder="Address"
              />
              <Textarea
                value={editData.clinical_notes || ""}
                onChange={(e) =>
                  setEditData({ ...editData, clinical_notes: e.target.value })
                }
                placeholder="Clinical Notes"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveEdit}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <h3 className="text-base font-semibold text-foreground">
                  {patient.full_name}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={startEdit}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <StatusBadge status={patient.status} />

              <div className="mt-4 w-full space-y-3 text-left">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Age:</span>{" "}
                  {patient.age}
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {patient.phone}
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {patient.address}
                  </div>
                )}
                {patient.clinical_notes && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {patient.clinical_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {interactions.length > 0 && (
                <div className="mt-4 w-full">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Interaction History
                  </p>
                  <div className="space-y-1.5">
                    {interactions.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-2 rounded-md bg-muted/30 p-2 text-xs"
                      >
                        <span className="font-medium text-foreground">
                          {h.drug_1}
                        </span>
                        <span className="text-muted-foreground">↔</span>
                        <span className="font-medium text-foreground">
                          {h.drug_2}
                        </span>
                        <span
                          className={cn(
                            "ml-auto rounded-full px-1.5 py-0.5 text-xs font-medium",
                            SEVERITY_BADGE[h.result?.severity ?? "none"],
                          )}
                        >
                          {h.result?.severity ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{patient.full_name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
