import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Patient, PatientStatus } from "@/lib/dummy-data";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  age: z.coerce.number().min(0).max(150, "Enter a valid age"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  address: z.string().trim().min(2, "Address is required").max(200),
  notes: z.string().max(500).optional(),
  status: z.enum(["Critical", "Stable", "Under Treatment"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (patient: Patient) => void;
}

export function AddPatientModal({ open, onClose, onAdd }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", address: "", notes: "", status: "Stable" },
  });

  const onSubmit = (data: FormData) => {
    const newPatient: Patient = {
      id: Date.now().toString(),
      name: data.name,
      age: data.age,
      phone: data.phone,
      address: data.address,
      notes: data.notes || "",
      status: data.status as PatientStatus,
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name.split(" ").map(n => n[0]).join("")}&backgroundColor=3b82f6&textColor=ffffff`,
    };
    onAdd(newPatient);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="Patient name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="age" render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl><Input type="number" placeholder="45" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Stable">Stable</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Under Treatment">Under Treatment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input placeholder="+1 555 123 4567" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Clinical Notes</FormLabel>
                <FormControl><Textarea placeholder="Notes..." rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Patient</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
