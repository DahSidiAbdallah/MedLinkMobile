

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, setDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC_WM7fG6nIvv-7PQimBZbNgPgdnIsv_ww",
  authDomain: "medrim-z5rzzt.firebaseapp.com",
  projectId: "medrim-z5rzzt",
  storageBucket: "medrim-z5rzzt.firebasestorage.app",
  messagingSenderId: "760537272144",
  appId: "1:760537272144:web:cd01a3d21e9bdd98156655"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const facilities = [
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

async function uploadFacilities() {
  try {
    const facilitiesCollection = collection(db, 'facilities');
    for (const facility of facilities) {
      // Use the facility id as the document id
      await setDoc(doc(facilitiesCollection, facility.id), facility);
      console.log(`Uploaded facility: ${facility.name}`);
    }
    console.log('All facilities uploaded successfully.');
  } catch (error) {
    console.error('Error uploading facilities:', error);
  }
}

uploadFacilities();
