
export type FacilityType = 'clinic' | 'hospital' | 'pharmacy';

// Doctor and Pharmacy types for compatibility with legacy imports
export type Doctor = Facility & { type: 'clinic' | 'hospital' };
export type Pharmacy = Facility & { type: 'pharmacy' };

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  specialty?: string;
  image: string;
  images?: string[];
  rating?: number;
  location: string;
  availableSlots?: string[];
  experience?: number;
  languages?: string[];
  acceptedInsurance?: string[];
  education?: string[];
  address?: string;
  hours?: string;
  distance?: string;
  hasDelivery?: boolean;
  isOpen?: boolean;
  phoneNumber?: string;
  services?: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Pharmacy is now part of Facility with type: 'pharmacy'

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
  createdAt?: Date | any;
  user_id?: string;
}


export interface Appointment {
  id: string;
  facilityId: string;
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
  preferredFacilities: string[];
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