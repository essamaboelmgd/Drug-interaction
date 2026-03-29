import { useState } from "react";
import { Edit2, Phone, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import type { Patient } from "@/lib/dummy-data";

interface Props {
  patient: Patient;
  onUpdate: (updated: Patient) => void;
}

export function PatientDetails({ patient, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Patient>>({});

  const startEdit = () => {
    setEditing(true);
    setEditData({ ...patient });
  };

  const saveEdit = () => {
    onUpdate({ ...patient, ...editData });
    setEditing(false);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData({});
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex flex-col items-center text-center">
        <img src={patient.image} alt={patient.name} className="h-16 w-16 rounded-full mb-3" />
        {editing ? (
          <div className="w-full space-y-3">
            <Input
              value={editData.name || ""}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="Name"
            />
            <Input
              type="number"
              value={editData.age || ""}
              onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) })}
              placeholder="Age"
            />
            <Input
              value={editData.phone || ""}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              placeholder="Phone"
            />
            <Input
              value={editData.address || ""}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              placeholder="Address"
            />
            <Textarea
              value={editData.notes || ""}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              placeholder="Notes"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} className="flex-1">Save</Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1">Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{patient.name}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <StatusBadge status={patient.status} />

            <div className="mt-4 w-full space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Age:</span> {patient.age}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {patient.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {patient.address}
              </div>
              {patient.notes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{patient.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
