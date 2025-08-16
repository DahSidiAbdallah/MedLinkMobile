// data.js - A JavaScript version of data.ts for use with our initialization script
export const doctors = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    specialty: 'Cardiologist',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.8,
    location: 'Downtown Medical Center',
    availableSlots: ['9:00', '10:30', '14:30', '16:00'],
    experience: 15,
    languages: ['English', 'Mandarin'],
    acceptedInsurance: ['Blue Cross', 'Aetna', 'UnitedHealth'],
    education: ['Stanford Medical School', 'Johns Hopkins Residency'],
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    }
  },
  {
    id: '2',
    name: 'Dr. Ahmed Mohamed',
    specialty: 'Pediatrician',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.9,
    location: 'Children\'s Wellness Center',
    availableSlots: ['8:30', '11:00', '13:30', '15:00'],
    experience: 12,
    languages: ['English', 'Arabic'],
    acceptedInsurance: ['CNAM', 'CNSS'],
    education: ['UCLA Medical School', 'UCSF Residency'],
    coordinates: {
      lat: 37.7739,
      lng: -122.4312
    }
  },
  {
    id: '3',
    name: 'Dr. Emira Said',
    specialty: 'Dermatologist',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.7,
    location: 'Skin & Beauty Clinic',
    availableSlots: ['9:30', '11:30', '14:00', '16:30'],
    experience: 8,
    languages: ['English', 'French'],
    acceptedInsurance: ['CNAM'],
    education: ['Harvard Medical School', 'NYU Residency'],
    coordinates: {
      lat: 37.7831,
      lng: -122.4159
    }
  }
];

export const pharmacies = [
  {
    id: '1',
    name: 'City Care Pharmacy',
    address: '123 Market Street, San Francisco',
    hours: '8:00 AM - 10:00 PM',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=300&h=300',
    distance: '0.3 miles',
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    },
    hasDelivery: true,
    isOpen: true,
    phoneNumber: '(415) 555-0123',
    services: ['Prescription Filling', 'Vaccinations', 'Health Screenings']
  },
  {
    id: '2',
    name: 'Bay Area Pharmacy',
    address: '456 Union Street, San Francisco',
    hours: '24/7',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=300&h=300',
    distance: '0.7 miles',
    coordinates: {
      lat: 37.7816,
      lng: -122.4267
    },
    hasDelivery: true,
    isOpen: true,
    phoneNumber: '(415) 555-0456',
    services: ['24/7 Service', 'Home Delivery', 'Medical Equipment']
  }
];

export const medications = [
  {
    id: '1',
    name: 'Lisinopril',
    generic_name: 'Lisinopril',
    description: 'Used to treat high blood pressure and heart failure',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400'
    ],
    side_effects: [
      'Dizziness',
      'Headache',
      'Dry cough',
      'Fatigue',
      'Nausea'
    ],
    interactions: [
      'NSAIDs may decrease effectiveness',
      'Potassium supplements may increase potassium levels',
      'Avoid alcohol'
    ],
    warnings: [
      'May cause birth defects if taken during pregnancy',
      'Monitor kidney function',
      'Stop taking if experiencing swelling of face, lips, or tongue'
    ],
    dosage_forms: [
      'Tablet 5mg',
      'Tablet 10mg',
      'Tablet 20mg',
      'Tablet 40mg'
    ],
    similar_drugs: ['Enalapril', 'Ramipril', 'Captopril']
  },
  {
    id: '2',
    name: 'Metformin',
    generic_name: 'Metformin Hydrochloride',
    description: 'Used to treat type 2 diabetes and insulin resistance',
    images: [
      'https://images.unsplash.com/photo-1585435557481-c0e88cad5c4b?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=400'
    ],
    side_effects: [
      'Nausea',
      'Diarrhea',
      'Loss of appetite',
      'Metallic taste',
      'Stomach pain'
    ],
    interactions: [
      'Alcohol may increase risk of lactic acidosis',
      'Certain contrast dyes used in medical imaging',
      'Some heart and blood pressure medications'
    ],
    warnings: [
      'May cause lactic acidosis',
      'Not recommended for patients with kidney problems',
      'Stop taking before surgery or medical procedures'
    ],
    dosage_forms: [
      'Tablet 500mg',
      'Tablet 850mg',
      'Tablet 1000mg',
      'Extended-release tablet'
    ],
    similar_drugs: ['Glipizide', 'Glyburide', 'Pioglitazone']
  }
];

export const reminders = [
  {
    id: '1',
    medication: 'Vitamin D',
    time: '8:00',
    frequency: 'Daily',
    active: true,
    dosage: '1000 IU',
    instructions: 'Take with food',
    refillDate: '2024-04-01'
  },
  {
    id: '2',
    medication: 'Blood Pressure Medicine',
    time: '9:00',
    frequency: 'Daily',
    active: true,
    dosage: '10mg',
    instructions: 'Take on empty stomach',
    refillDate: '2024-03-15'
  }
];

export const mockUserProfile = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '(415) 555-0123',
  dateOfBirth: '1985-06-15',
  bloodType: 'O+',
  allergies: ['Penicillin', 'Dust'],
  medications: ['Vitamin D', 'Lisinopril'],
  conditions: ['Hypertension'],
  emergencyContacts: [
    {
      id: '1',
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '(415) 555-0124',
      isICE: true
    }
  ],
  familyMembers: [
    {
      id: '1',
      name: 'Emily Smith',
      relationship: 'Daughter',
      dateOfBirth: '2015-03-20',
      bloodType: 'A+',
      allergies: ['None'],
      conditions: []
    }
  ],
  preferredDoctors: ['1', '2'],
  insuranceInfo: {
    provider: 'Blue Cross',
    policyNumber: 'BC123456789',
    groupNumber: 'G987654321',
    expiryDate: '2024-12-31'
  }
};
