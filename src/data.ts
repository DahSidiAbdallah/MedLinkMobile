

import { Facility, Reminder, UserProfile, Doctor, Pharmacy } from './types';

export const facilities: Facility[] = [
  // Hospitals & Clinics (previously doctors)
  {
    id: '1',
    name: 'Hôpital National de Nouakchott',
    type: 'hospital',
    specialty: 'Cardiologist',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.8,
    location: 'Hôpital National de Nouakchott',
    availableSlots: ['9:00', '10:30', '14:30', '16:00'],
    experience: 15,
    languages: ['Arabic', 'French', 'Hassaniya'],
    acceptedInsurance: ['CNAM', 'CNSS', 'Saham Assurance'],
    education: ['Faculté de Médecine de Nouakchott', 'CHU Ibn Sina Rabat'],
    coordinates: { lat: 18.0792, lng: -15.9758 }
  },
  {
    id: '2',
    name: 'Centre Hospitalier Mère-Enfant',
    type: 'hospital',
    specialty: 'Pediatrician',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.9,
    location: 'Centre Hospitalier Mère-Enfant',
    availableSlots: ['8:30', '11:00', '13:30', '15:00'],
    experience: 12,
    languages: ['Arabic', 'French', 'Pulaar'],
    acceptedInsurance: ['CNAM', 'CNSS', 'MACSF'],
    education: ['Université de Tunis El Manar', 'CHU de Dakar'],
    coordinates: { lat: 18.0887, lng: -15.9794 }
  },
  {
    id: '3',
    name: 'Clinique El Wafa',
    type: 'clinic',
    specialty: 'Dermatologist',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.7,
    location: 'Clinique El Wafa',
    availableSlots: ['9:30', '11:30', '14:00', '16:30'],
    experience: 10,
    languages: ['Arabic', 'French', 'Wolof'],
    acceptedInsurance: ['CNAM', 'Allianz', 'MACSF'],
    education: ['Université Cheikh Anta Diop', 'Hôpital Avicenne Paris'],
    coordinates: { lat: 18.0845, lng: -15.9685 }
  },
  {
    id: '4',
    name: 'Centre de Santé de Tevragh Zeina',
    type: 'clinic',
    specialty: 'General Practitioner',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.6,
    location: 'Centre de Santé de Tevragh Zeina',
    availableSlots: ['8:00', '10:00', '12:00', '15:00'],
    experience: 8,
    languages: ['Arabic', 'French', 'Soninke'],
    acceptedInsurance: ['CNAM', 'CNSS', 'AGM'],
    education: ['Faculté de Médecine de Nouakchott', "Stage à l'Hôpital Principal de Dakar"],
    coordinates: { lat: 18.1031, lng: -15.9951 }
  },
  {
    id: '5',
    name: 'Hôpital Cheikh Zayed',
    type: 'hospital',
    specialty: 'Orthopedic Surgeon',
    image: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=300&h=300',
    rating: 4.9,
    location: 'Hôpital Cheikh Zayed',
    availableSlots: ['9:00', '11:30', '14:00', '16:30'],
    experience: 18,
    languages: ['Arabic', 'French', 'English'],
    acceptedInsurance: ['CNAM', 'CNSS', 'Nema Assurance'],
    education: ['Université Mohammed V', 'CHU Casablanca', 'Fellowship in France'],
    coordinates: { lat: 18.0682, lng: -15.9785 }
  },
  // Pharmacies
  {
    id: '6',
    name: 'Pharmacie Centrale',
    type: 'pharmacy',
    address: 'Avenue Gamal Abdel Nasser, Nouakchott',
    location: 'Avenue Gamal Abdel Nasser, Nouakchott',
    hours: '8:00 - 23:00',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=300&h=300',
    distance: '0.5 km',
    coordinates: { lat: 18.0778, lng: -15.9750 },
    hasDelivery: true,
    isOpen: true,
    phoneNumber: '+222 45 25 55 55',
    services: ['Prescription Filling', 'Vaccinations', 'Health Consultations']
  },
  {
    id: '7',
    name: 'Pharmacie El Kheir',
    type: 'pharmacy',
    address: 'Rue 42-154, Tevragh Zeina, Nouakchott',
    location: 'Rue 42-154, Tevragh Zeina, Nouakchott',
    hours: '24/7',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=300&h=300',
    distance: '1.2 km',
    coordinates: { lat: 18.1020, lng: -15.9947 },
    hasDelivery: true,
    isOpen: true,
    phoneNumber: '+222 45 24 16 16',
    services: ['24/7 Service', 'Home Delivery', 'Medical Equipment']
  },
  {
    id: '8',
    name: 'Pharmacie Ibn Sina',
    type: 'pharmacy',
    address: 'Avenue Moctar Ould Daddah, Ksar, Nouakchott',
    location: 'Avenue Moctar Ould Daddah, Ksar, Nouakchott',
    hours: '8:00 - 22:00',
    image: 'https://images.unsplash.com/photo-1573883431205-98b5f10aaedb?auto=format&fit=crop&q=80&w=300&h=300',
    distance: '0.8 km',
    coordinates: { lat: 18.0901, lng: -15.9810 },
    hasDelivery: false,
    isOpen: true,
    phoneNumber: '+222 45 29 20 20',
    services: ['Prescription Filling', 'Health Products', 'Blood Pressure Monitoring']
  },
  {
    id: '9',
    name: 'Pharmacie El Baraka',
    type: 'pharmacy',
    address: 'Carrefour BMD, El Mina, Nouakchott',
    location: 'Carrefour BMD, El Mina, Nouakchott',
    hours: '8:00 - 21:00',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=300&h=300',
    distance: '3.5 km',
    coordinates: { lat: 18.0552, lng: -15.9515 },
    hasDelivery: true,
    isOpen: true,
    phoneNumber: '+222 45 27 42 42',
    services: ['Prescription Filling', 'Baby Products', 'Cosmetics']
  }
];

// Legacy exports for compatibility
export const doctors: Doctor[] = facilities.filter(f => f.type === 'clinic' || f.type === 'hospital') as Doctor[];
export const pharmacies: Pharmacy[] = facilities.filter(f => f.type === 'pharmacy') as Pharmacy[];

export const medications = [
  {
    id: '1',
    name: 'Tensopril',
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
    manufacturer: 'PharmaPro Inc.',
    authenticity_code: 'TEN5789PRO',
    batch_number: 'LIS20250412',
    expiration_date: '2027-04-12',
    similar_drugs: ['Enalapril', 'Ramipril', 'Captopril']
  },
  {
    id: '2',
    name: 'Glucophage',
    generic_name: 'Metformine',
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
    manufacturer: 'MediLabs SA',
    authenticity_code: 'GLU8321MED',
    batch_number: 'MET20250301',
    expiration_date: '2026-03-01',
    similar_drugs: ['Glipizide', 'Glyburide', 'Pioglitazone']
  },
  {
    id: '3',
    name: 'Zoloft',
    generic_name: 'Sertraline',
    description: 'Antidepressant in the SSRI class used to treat depression, anxiety, and other mental health conditions',
    images: [
      'https://images.unsplash.com/photo-1626716493137-b67fe9501e67?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&q=80&w=400'
    ],
    side_effects: [
      'Nausea',
      'Diarrhea',
      'Insomnia',
      'Sexual problems',
      'Headache',
      'Dry mouth'
    ],
    interactions: [
      'MAO inhibitors',
      'Pimozide',
      'Other SSRIs or SNRIs',
      'NSAIDs or blood thinners'
    ],
    warnings: [
      'May increase risk of suicidal thoughts in young adults',
      'Can cause serotonin syndrome when combined with other medications',
      'Do not stop taking abruptly'
    ],
    dosage_forms: [
      'Tablet 25mg',
      'Tablet 50mg',
      'Tablet 100mg',
      'Oral solution'
    ],
    similar_drugs: ['Fluoxetine', 'Paroxetine', 'Citalopram']
  },
  {
    id: '4',
    name: 'Amoxil',
    generic_name: 'Amoxicilline',
    description: 'Antibiotic used to treat various bacterial infections',
    images: [
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=400'
    ],
    side_effects: [
      'Diarrhea',
      'Rash',
      'Nausea',
      'Vomiting',
      'Yeast infection'
    ],
    interactions: [
      'Birth control pills',
      'Other antibiotics',
      'Probenecid'
    ],
    warnings: [
      'May cause allergic reactions',
      'Complete full course of treatment',
      'Take with food if stomach upset occurs'
    ],
    dosage_forms: [
      'Capsule 250mg',
      'Capsule 500mg',
      'Tablet 875mg',
      'Oral suspension'
    ],
    similar_drugs: ['Penicillin', 'Cephalexin', 'Azithromycin']
  },
  {
    id: '5',
    name: 'Mopral',
    generic_name: 'Oméprazole',
    description: 'Proton pump inhibitor used to treat acid reflux and ulcers',
    images: [
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=400'
    ],
    side_effects: [
      'Headache',
      'Stomach pain',
      'Nausea',
      'Diarrhea',
      'Vitamin B12 deficiency'
    ],
    interactions: [
      'Clopidogrel',
      'Iron supplements',
      'Certain HIV medications'
    ],
    warnings: [
      'Long-term use may increase risk of bone fractures',
      'May increase risk of kidney problems',
      'Tell doctor if pregnant or planning pregnancy'
    ],
    dosage_forms: [
      'Capsule 10mg',
      'Capsule 20mg',
      'Capsule 40mg',
      'Powder for suspension'
    ],
    similar_drugs: ['Esomeprazole', 'Lansoprazole', 'Pantoprazole']
  },
  {
    id: '6',
    name: 'Artemisia',
    generic_name: 'Artemisia annua',
    description: 'Traditional medicinal herb used to treat malaria and fever',
    images: [
      'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1565126773351-64cc9763ee0b?auto=format&fit=crop&q=80&w=400'
    ],
    side_effects: [
      'Stomach upset',
      'Dizziness',
      'Skin rash',
      'Allergic reactions'
    ],
    interactions: [
      'May interact with anticoagulants',
      'May reduce effectiveness of certain medications',
      'Consult healthcare provider before use'
    ],
    warnings: [
      'Not recommended during pregnancy',
      'Not a replacement for conventional antimalarial treatments',
      'Use only under healthcare provider supervision'
    ],
    dosage_forms: [
      'Dried herb',
      'Tea',
      'Capsules',
      'Tincture'
    ],
    similar_drugs: ['Quinine', 'Chloroquine', 'Artesunate']
  },
  {
    id: '7',
    name: 'Acacia Nilotica',
    generic_name: 'Acacia nilotica',
    description: 'Traditional medicinal plant used for digestive issues, oral health, and wound healing',
    images: [
      'https://images.unsplash.com/photo-1610409407548-81576e48d05d?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1533991310801-cbd305308e5f?auto=format&fit=crop&q=80&w=400'
    ],
    side_effects: [
      'Stomach upset',
      'Constipation',
      'Allergic reactions'
    ],
    interactions: [
      'May increase effects of diabetes medications',
      'May interfere with iron absorption',
      'Consult healthcare provider before use'
    ],
    warnings: [
      'Not recommended during pregnancy',
      'May lower blood glucose levels',
      'Use with caution if you have digestive disorders'
    ],
    dosage_forms: [
      'Bark powder',
      'Leaf extract',
      'Gum',
      'Topical paste'
    ],
    similar_drugs: ['Tannins', 'Other astringent herbs']
  }
];

export const reminders: Reminder[] = [
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

export const mockUserProfile: UserProfile = {
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
  preferredFacilities: ['1', '2'],
  insuranceInfo: {
    provider: 'Blue Cross',
    policyNumber: 'BC123456789',
    groupNumber: 'G987654321',
    expiryDate: '2024-12-31'
  }
};