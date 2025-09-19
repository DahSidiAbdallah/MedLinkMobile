

// TypeScript module declaration for react-native-web-maps (if missing)
// @ts-ignore
declare module 'react-native-web-maps';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Facility } from '../types';
import { colors } from '../theme';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  filtered: Facility[];
  handleMap: (lat: number, lng: number, name: string) => void;
}

// Lightweight Error Boundary to catch rare Leaflet init errors
class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: String(err?.message || err) };
  }
  componentDidCatch(err: any) {
    // swallow error; optionally log
    // console.warn('Leaflet map failed to initialize', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          borderRadius: 16,
          background: '#fff',
          border: `1px solid ${colors.line}`,
          boxShadow: `0 4px 18px ${colors.overlay}`,
          padding: 16,
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: colors.primary, fontSize: 18 }}>🗺️</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Map unavailable</div>
              <div style={{ color: '#475569', fontSize: 13 }}>We couldn’t load the map. You can still browse the list and details.</div>
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${colors.line}`,
              background: '#fff',
              color: '#0f172a',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children as any;
  }
}


function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  // Haversine formula
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ClinicsHospitalsPharmaciesMap: React.FC<Props> = ({ filtered, handleMap }) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sortedFacilities, setSortedFacilities] = useState<Facility[]>(filtered);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => setUserLocation(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Sort facilities by proximity to user
  useEffect(() => {
    if (userLocation) {
      setSortedFacilities(
        [...filtered].sort((a, b) =>
          getDistance(userLocation[0], userLocation[1], a.coordinates.lat, a.coordinates.lng) -
          getDistance(userLocation[0], userLocation[1], b.coordinates.lat, b.coordinates.lng)
        )
      );
    } else {
      setSortedFacilities(filtered);
    }
  }, [filtered, userLocation]);

  // Filter out facilities with missing coordinates (defensive)
  const valid = sortedFacilities.filter(f => f?.coordinates && typeof f.coordinates.lat === 'number' && typeof f.coordinates.lng === 'number');

  // Center map on user or first valid facility or fallback
  let center: [number, number];
  if (userLocation) {
    center = userLocation;
  } else if (valid.length > 0) {
    center = [valid[0].coordinates.lat, valid[0].coordinates.lng];
  } else {
    center = [18.08, -15.98];
  }

  // Fix: absolutely position the map so the list never affects its height
  // Use colored SVGs for correct marker rendering
  function createColoredIcon(color: string) {
    const svg = encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='32' height='48' viewBox='0 0 32 48' fill='none'>
        <path d='M16 0C7.163 0 0 7.163 0 16c0 11.046 16 32 16 32s16-20.954 16-32C32 7.163 24.837 0 16 0z' fill='${color}'/>
        <circle cx='16' cy='16' r='7' fill='white'/>
      </svg>
    `);
    return L.icon({
      iconUrl: `data:image/svg+xml,${svg}`,
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -40],
      shadowUrl: markerShadow,
      shadowSize: [41, 41],
      shadowAnchor: [13, 41],
    });
  }

  const iconColors: Record<string, string> = {
    pharmacy: colors.accent,
    clinic: colors.primary,
    hospital: colors.warn,
  };

  // Responsive: sticky only on large screens, block on mobile
  const mapContainerStyle: React.CSSProperties = {
    width: '100%',
    height: 420,
    borderRadius: 16,
    overflow: 'hidden',
  background: colors.card,
  boxShadow: `0 4px 24px 0 ${colors.overlay}`,
    margin: '24px 0',
    position: 'relative',
  };

  // Use sticky only if window width is large (desktop)
  if (typeof window !== 'undefined' && window.innerWidth > 900) {
    mapContainerStyle.position = 'sticky';
    mapContainerStyle.top = 0;
    mapContainerStyle.zIndex = 2;
  }

  // If running in a non-DOM environment, avoid rendering the map (safety)
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={mapContainerStyle}>
        <MapErrorBoundary>
        <MapContainer center={center as any} zoom={13} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {userLocation && (
            <Marker position={userLocation} icon={createColoredIcon(colors.primary)}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {valid.map(fac => (
            <Marker
              key={fac.id}
              position={[fac.coordinates.lat, fac.coordinates.lng]}
              icon={createColoredIcon(iconColors[fac.type] || '#00326d')}
              eventHandlers={{
                click: () => handleMap(fac.coordinates.lat, fac.coordinates.lng, fac.name),
              }}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{fac.name}</strong><br />
                  <span>{fac.specialty || fac.address || fac.location}</span>
                  {fac.phoneNumber && (
                    <><br /><span>📞 {fac.phoneNumber}</span></>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        </MapErrorBoundary>
      </div>
    </div>
  );
};

export default ClinicsHospitalsPharmaciesMap;
