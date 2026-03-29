import { useState, useEffect, useRef } from "react";
import { Search, Plus, Menu, X, Activity, LogOut } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { PatientCard } from "@/components/PatientCard";
import { ChatInterface } from "@/components/ChatInterface";
import { AddPatientModal } from "@/components/AddPatientModal";
import { DrugInteractionChecker } from "@/components/analysis/DrugInteractionChecker";
import { PatientDetails } from "@/components/patients/PatientDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Patient, type InteractionHistory } from "@/services/api";
import type { ChatMessage } from "@/lib/dummy-data";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Dashboard = () => {
  const { doctor, logout } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Record<number, ChatMessage[]>
  >({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [interactions, setInteractions] = useState<InteractionHistory[]>([]);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load patients on mount
  useEffect(() => {
    api.patients
      .list()
      .then((res) => {
        setPatients(res.patients);
        if (res.patients.length > 0) setSelectedId(res.patients[0].id);
      })
      .catch(() => toast.error("Failed to load patients"))
      .finally(() => setPatientsLoading(false));
  }, []);

  // Load interaction history when patient changes
  useEffect(() => {
    if (selectedId == null) return;
    api.patients
      .interactions(selectedId)
      .then(setInteractions)
      .catch(() => setInteractions([]));
  }, [selectedId]);

  // Debounced search
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await api.patients.search(search.trim());
        setSearchResults(res.patients);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [search]);

  const displayedPatients =
    searchResults !== null ? searchResults : patients;
  const selected = patients.find((p) => p.id === selectedId) ?? null;

  const handleSend = (text: string) => {
    if (!selectedId) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      content:
        "Based on the patient's clinical history and imaging results, I recommend correlating with laboratory values and considering the differential diagnosis. Would you like me to elaborate on specific findings?",
      timestamp: new Date(),
    };
    setChatMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), userMsg, aiMsg],
    }));
  };

  const handleAddPatient = (p: Patient) => {
    setPatients((prev) => [p, ...prev]);
    setSelectedId(p.id);
  };

  const handleUpdatePatient = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePatient = (id: number) => {
    setPatients((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setSelectedId(next.length > 0 ? next[0].id : null);
      return next;
    });
    setRightPanelOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const doctorInitials = doctor?.name
    ? doctor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlays */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {rightPanelOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 xl:hidden"
          onClick={() => setRightPanelOpen(false)}
        />
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
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {doctorInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {doctor?.name ?? "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {doctor?.specialty ?? ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search & Add */}
        <div className="space-y-2 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="pl-9"
            />
          </div>
          <Button className="w-full rounded-lg" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Patient
          </Button>
        </div>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-1">
            {patientsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-3"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : displayedPatients.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search
                  ? "No patients found"
                  : "No patients yet. Add your first patient."}
              </p>
            ) : (
              displayedPatients.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  selected={p.id === selectedId}
                  onClick={() => {
                    setSelectedId(p.id);
                    setSidebarOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* CENTER + RIGHT */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              MedAssist AI
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DarkModeToggle />
            {selected && (
              <Button
                variant="outline"
                size="sm"
                className="xl:hidden"
                onClick={() => setRightPanelOpen(true)}
              >
                Patient Info
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* CENTER — Drug Interaction Checker */}
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
                <span className="text-sm font-semibold text-foreground">
                  Patient Details
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPanelOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Patient details — top portion, scrollable */}
              <div className="border-b overflow-y-auto max-h-[60%]">
                <PatientDetails
                  patient={selected}
                  onUpdate={handleUpdatePatient}
                  onDelete={handleDeletePatient}
                  interactions={interactions}
                />
              </div>

              {/* Chat — bottom portion */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  messages={chatMessages[selected.id] || []}
                  onSend={handleSend}
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      <AddPatientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddPatient}
      />
    </div>
  );
};

export default Dashboard;
