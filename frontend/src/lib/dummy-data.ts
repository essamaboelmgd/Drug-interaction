export type PatientStatus = "Critical" | "Stable" | "Under Treatment";

export interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  address: string;
  notes: string;
  status: PatientStatus;
  image: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export const dummyPatients: Patient[] = [
  {
    id: "1",
    name: "Ahmed Al-Rashid",
    age: 54,
    phone: "+966 55 123 4567",
    address: "12 King Fahd Road, Riyadh",
    notes: "Stage II lung carcinoma. Undergoing chemotherapy cycle 3. Responding well to treatment.",
    status: "Under Treatment",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=AR&backgroundColor=3b82f6&textColor=ffffff",
  },
  {
    id: "2",
    name: "Sara Johnson",
    age: 38,
    phone: "+1 555 234 5678",
    address: "45 Oak Avenue, Boston, MA",
    notes: "Diabetic retinopathy screening. Mild NPDR detected in right eye. Follow-up in 3 months.",
    status: "Stable",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=SJ&backgroundColor=10b981&textColor=ffffff",
  },
  {
    id: "3",
    name: "Mohammed Hassan",
    age: 67,
    phone: "+966 50 345 6789",
    address: "8 Olaya Street, Jeddah",
    notes: "Suspicious mass found on chest CT. Biopsy scheduled. Urgent oncology referral.",
    status: "Critical",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=MH&backgroundColor=ef4444&textColor=ffffff",
  },
  {
    id: "4",
    name: "Emily Chen",
    age: 42,
    phone: "+1 555 456 7890",
    address: "78 Maple Drive, San Francisco, CA",
    notes: "Post-cataract surgery follow-up. Vision improving. IOP within normal range.",
    status: "Stable",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=EC&backgroundColor=10b981&textColor=ffffff",
  },
  {
    id: "5",
    name: "Fatima Al-Saud",
    age: 29,
    phone: "+966 54 567 8901",
    address: "23 Prince Sultan Street, Riyadh",
    notes: "Breast lump detected on mammography. BIRADS 4. MRI and core biopsy recommended.",
    status: "Critical",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=FS&backgroundColor=ef4444&textColor=ffffff",
  },
  {
    id: "6",
    name: "James Williams",
    age: 51,
    phone: "+1 555 678 9012",
    address: "156 Elm Street, Chicago, IL",
    notes: "Glaucoma management. IOP controlled with timolol. Visual field stable.",
    status: "Under Treatment",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=JW&backgroundColor=3b82f6&textColor=ffffff",
  },
];

export const dummyChatMessages: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "c1",
      role: "user",
      content: "What are the latest tumor markers for this patient?",
      timestamp: new Date("2024-01-15T10:30:00"),
    },
    {
      id: "c2",
      role: "ai",
      content: "Based on the latest lab results, CEA levels are at 4.2 ng/mL (slightly elevated), and CYFRA 21-1 is at 2.8 ng/mL. The CEA trend shows a decrease from 6.1 ng/mL at the start of chemotherapy, which is a positive indicator of treatment response. I recommend continuing the current regimen and repeating markers after cycle 4.",
      timestamp: new Date("2024-01-15T10:30:05"),
    },
    {
      id: "c3",
      role: "user",
      content: "Should we adjust the dosage based on these results?",
      timestamp: new Date("2024-01-15T10:32:00"),
    },
    {
      id: "c4",
      role: "ai",
      content: "Given the favorable response indicated by declining CEA levels, I would recommend maintaining the current dosage. The patient's tolerability has been good with manageable side effects. However, if neutrophil counts drop below 1.5 x 10⁹/L before the next cycle, consider a 20% dose reduction or adding G-CSF support.",
      timestamp: new Date("2024-01-15T10:32:10"),
    },
  ],
  "3": [
    {
      id: "c5",
      role: "user",
      content: "Analyze the CT findings for this patient.",
      timestamp: new Date("2024-01-14T14:00:00"),
    },
    {
      id: "c6",
      role: "ai",
      content: "The chest CT reveals a 3.2 cm spiculated mass in the right upper lobe with mediastinal lymphadenopathy. The mass shows irregular borders and appears to invade the pleural surface. There are no distant metastases visible on this scan. Based on imaging characteristics, this is highly suspicious for primary lung malignancy (BIRADS equivalent: highly suspicious). Urgent tissue sampling via CT-guided biopsy is recommended.",
      timestamp: new Date("2024-01-14T14:00:08"),
    },
  ],
};

export const doctorProfile = {
  name: "Dr. Sarah Mitchell",
  specialty: "Oncology",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SM&backgroundColor=1e40af&textColor=ffffff",
};
