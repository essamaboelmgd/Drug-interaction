import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Eye,
  ScanLine,
  UserPlus,
  ImageIcon,
  FileCheck,
  Shield,
  Lock,
  Server,
} from "lucide-react";

const specialties = [
  {
    icon: Activity,
    title: "Oncology AI Image Analysis",
    description:
      "AI-powered tumor detection and staging from CT, MRI, and PET scans with evidence-based diagnostic support.",
  },
  {
    icon: Eye,
    title: "Ophthalmology AI Vision Diagnostics",
    description:
      "Automated analysis of retinal scans, OCT imaging, and fundus photography for early disease detection.",
  },
  {
    icon: ScanLine,
    title: "Radiology AI X-Ray Interpretation",
    description:
      "Intelligent interpretation of X-ray, CT, and MRI images with structured findings and anomaly detection.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Register with your medical credentials and select your specialty.",
  },
  {
    icon: ImageIcon,
    title: "Add Patient & Upload Image",
    description: "Add your patient and upload their medical images — CT, MRI, X-Ray, or retinal scans.",
  },
  {
    icon: FileCheck,
    title: "Get AI Analysis Results",
    description: "Receive AI-powered diagnosis, confidence scores, key findings, and actionable recommendations.",
  },
];

const securityFeatures = [
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "Full compliance with healthcare data protection regulations.",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data encrypted in transit and at rest using AES-256.",
  },
  {
    icon: Server,
    title: "SOC 2 Certified",
    description: "Enterprise-grade security with continuous monitoring and auditing.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            AI Clinical Assistant for Modern Doctors
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            AI-powered medical image analysis for Oncology, Ophthalmology, and Radiology.
            Upload scans, get instant diagnostic insights, and streamline clinical decision-making.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-lg px-8 text-base">
              <Link to="/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-lg px-8 text-base">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            AI-Powered Medical Image Analysis
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {specialties.map((s) => (
              <Card key={s.title} className="border bg-card transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Security & Data Privacy
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {securityFeatures.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
