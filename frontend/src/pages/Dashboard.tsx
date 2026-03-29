import { useState, useMemo } from "react";
import { Search, Plus, Menu, X, Activity } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { PatientCard } from "@/components/PatientCard";
import { ChatInterface } from "@/components/ChatInterface";
import { AddPatientModal } from "@/components/AddPatientModal";
import { DrugInteractionChecker } from "@/components/analysis/DrugInteractionChecker";
import { PatientDetails } from "@/components/patients/PatientDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  dummyPatients,
  dummyChatMessages,
  doctorProfile,
  type Patient,
  type ChatMessage,
} from "@/lib/dummy-data";

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>(dummyPatients);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(dummyChatMessages);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const filtered = useMemo(
    () => patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [patients, search]
  );

  const selected = patients.find((p) => p.id === selectedId) ?? null;

  const handleSend = (text: string) => {
    if (!selectedId) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      content: "Based on the patient's clinical history and imaging results, I recommend correlating with laboratory values and considering the differential diagnosis. Would you like me to elaborate on specific findings?",
      timestamp: new Date(),
    };
    setChatMessages((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), userMsg, aiMsg] }));
  };

  const handleAddPatient = (p: Patient) => setPatients((prev) => [p, ...prev]);

  const handleUpdatePatient = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlays */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {rightPanelOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 xl:hidden" onClick={() => setRightPanelOpen(false)} />
      )}

      {/* LEFT SIDEBAR — Patient List */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Doctor profile */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={doctorProfile.avatar} alt={doctorProfile.name} className="h-9 w-9 rounded-full" />
              <div>
                <p className="text-sm font-semibold text-foreground">{doctorProfile.name}</p>
                <p className="text-xs text-muted-foreground">{doctorProfile.specialty}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search & Add */}
        <div className="space-y-2 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients..." className="pl-9" />
          </div>
          <Button className="w-full rounded-lg" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Patient
          </Button>
        </div>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-1">
            {filtered.map((p) => (
              <PatientCard
                key={p.id}
                patient={p}
                selected={p.id === selectedId}
                onClick={() => { setSelectedId(p.id); setSidebarOpen(false); }}
              />
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No patients found</p>
            )}
          </div>
        </div>
      </aside>

      {/* CENTER + RIGHT */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">MedAssist AI</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DarkModeToggle />
            {selected && (
              <Button variant="outline" size="sm" className="xl:hidden" onClick={() => setRightPanelOpen(true)}>
                Patient Info
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* CENTER — Interaction Checker (primary) */}
          <div className="flex-1 overflow-hidden">
            <DrugInteractionChecker patient={selected} />
          </div>

          {/* RIGHT SIDEBAR — Patient Details + Chat */}
          {selected && (
            <aside
              className={`fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l bg-card transition-transform xl:static xl:translate-x-0 ${
                rightPanelOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* Close button on mobile */}
              <div className="flex items-center justify-between border-b p-3 xl:hidden">
                <span className="text-sm font-semibold text-foreground">Patient Details</span>
                <Button variant="ghost" size="icon" onClick={() => setRightPanelOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Patient details — top half */}
              <div className="border-b">
                <PatientDetails patient={selected} onUpdate={handleUpdatePatient} />
              </div>

              {/* Chat — bottom half */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface messages={chatMessages[selected.id] || []} onSend={handleSend} />
              </div>
            </aside>
          )}
        </div>
      </div>

      <AddPatientModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddPatient} />
    </div>
  );
};

export default Dashboard;
