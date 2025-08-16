export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
  rating: number;
  location: string;
  availableSlots: string[];
  experience: number;
  languages: string[];
  acceptedInsurance: string[];
  education: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  hours: string;
  image: string;
  distance: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hasDelivery: boolean;
  isOpen: boolean;
  phoneNumber: string;
  services: string[];
}

export interface Reminder {
  id: string;
  medication: string;
  time: string;
  frequency: string;
  active: boolean;
  dosage: string;
  instructions: string;
  refillDate?: string;
  prescriptionImage?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  datetime: string;
  type: 'in-person';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  bloodType?: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  emergencyContacts: EmergencyContact[];
  familyMembers: FamilyMember[];
  preferredDoctors: string[];
  insuranceInfo: InsuranceInfo;
}

export interface Medication {
  id: string;
  name: string;
  generic_name?: string;
  description?: string;
  images: string[];
  side_effects: string[];
  interactions: string[];
  warnings: string[];
  dosage_forms: string[];
  manufacturer: string;
  authenticity_code?: string;
  batch_number?: string;
  expiration_date?: string;
  similar_drugs?: string[];
  verified?: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isICE: boolean; // In Case of Emergency
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  bloodType?: string;
  allergies: string[];
  conditions: string[];
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  expiryDate: string;
}