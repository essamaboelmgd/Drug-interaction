import { Link } from "react-router-dom";
import { DarkModeToggle } from "./DarkModeToggle";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">MedAssist AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <Button asChild variant="ghost" size="sm" className="rounded-lg">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="rounded-lg">
            <Link to="/register">Create Account</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
