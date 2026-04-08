// @ts-ignore
declare module 'react-native-web-maps';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Facility } from '../types';
import { colors } from '../theme';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Per-type colors — distinct so filters are visually obvious
const TYPE_COLOR: Record<string, string> = {
  clinic:   '#26C9A8',  // teal  — primary
  hospital: '#F59E0B',  // amber — warn
  pharmacy: '#7C6FE0',  // purple — secondary
};

const TYPE_LABEL: Record<string, string> = {
  clinic: 'Clinic',
  hospital: 'Hospital',
  pharmacy: 'Pharmacy',
};

// SVG pin per type
function createPin(color: string, letter: string) {
  const svg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='36' height='52' viewBox='0 0 36 52'>
      <filter id='shadow' x='-30%' y='-20%' width='160%' height='160%'>
        <feDropShadow dx='0' dy='2' stdDeviation='2' flood-color='rgba(0,0,0,0.22)'/>
      </filter>
      <path d='M18 1C9.163 1 2 8.163 2 17c0 12.046 16 34 16 34S34 29.046 34 17C34 8.163 26.837 1 18 1z'
        fill='${color}' stroke='white' stroke-width='2.5' filter='url(#shadow)'/>
      <text x='18' y='22' text-anchor='middle' dominant-baseline='middle'
        font-family='system-ui,sans-serif' font-size='13' font-weight='700' fill='white'>
        ${letter}
      </text>
    </svg>
  `);
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [36, 52],
    iconAnchor: [18, 52],
    popupAnchor: [0, -52],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
  });
}

// "You are here" blue pin
function createUserPin() {
  const svg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
      <circle cx='16' cy='16' r='14' fill='#26C9A8' stroke='white' stroke-width='3'/>
      <circle cx='16' cy='16' r='5' fill='white'/>
    </svg>
  `);
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

const TYPE_LETTER: Record<string, string> = { clinic: 'C', hospital: 'H', pharmacy: 'Rx' };

// Refit map bounds when filtered list changes
function FitBoundsEffect({ facilities }: { facilities: Facility[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = facilities.filter(f => f.coordinates?.lat && f.coordinates?.lng);
    if (valid.length === 0) return;
    try {
      const bounds = L.latLngBounds(valid.map(f => [f.coordinates.lat, f.coordinates.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
    } catch {
      // bounds may be invalid if single point
      if (valid.length === 1) {
        map.setView([valid[0].coordinates.lat, valid[0].coordinates.lng], 14, { animate: true });
      }
    }
  }, [facilities]);
  return null;
}

// Error boundary
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={errorFallbackStyle}>
          <span style={{ fontSize: 28 }}>🗺️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>Map unavailable</div>
            <div style={{ color: '#6B7280', fontSize: 13 }}>Browse the list below to find facilities.</div>
          </div>
          <button onClick={() => this.setState({ hasError: false })} style={retryBtnStyle}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children as any;
  }
}

interface Props {
  filtered: Facility[];
  handleMap: (lat: number, lng: number, name: string) => void;
  onFacilityPress?: (fac: Facility) => void;
}

const ClinicsHospitalsPharmaciesMap: React.FC<Props> = ({ filtered, handleMap, onFacilityPress }) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raf = window.requestAnimationFrame(() => setCanRender(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  if (typeof window === 'undefined') return null;

  const valid = filtered.filter(f => f.coordinates?.lat && f.coordinates?.lng);

  const center: [number, number] = userLocation
    ? userLocation
    : valid.length > 0
    ? [valid[0].coordinates.lat, valid[0].coordinates.lng]
    : [18.08, -15.98];

  if (!canRender) {
    return <div style={loadingStyle}>Loading map…</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden' }}>
      <MapErrorBoundary>
        <MapContainer
          center={center}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Refit whenever filtered changes */}
          <FitBoundsEffect facilities={valid} />

          {/* User location */}
          {userLocation && (
            <Marker position={userLocation} icon={createUserPin()}>
              <Popup>
                <div style={popupStyle}>
                  <strong style={{ color: colors.primary }}>📍 You are here</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Facility markers */}
          {valid.map(fac => {
            const col = TYPE_COLOR[fac.type] || TYPE_COLOR.clinic;
            const letter = TYPE_LETTER[fac.type] || 'C';
            return (
              <Marker
                key={fac.id}
                position={[fac.coordinates.lat, fac.coordinates.lng]}
                icon={createPin(col, letter)}
                eventHandlers={{
                  click: () => {
                    handleMap(fac.coordinates.lat, fac.coordinates.lng, fac.name);
                    onFacilityPress?.(fac);
                  },
                }}
              >
                <Popup>
                  <div style={popupStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fac.name}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                      {TYPE_LABEL[fac.type] || fac.type}{fac.specialty ? ` · ${fac.specialty}` : ''}
                    </div>
                    {fac.distance && (
                      <div style={{ fontSize: 12, color: col, fontWeight: 600, marginBottom: 6 }}>
                        📍 {fac.distance}
                      </div>
                    )}
                    {fac.isOpen !== undefined && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: fac.isOpen ? '#DCFCE7' : '#FEE2E2',
                        color: fac.isOpen ? '#16A34A' : '#DC2626',
                        borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3,
                          backgroundColor: fac.isOpen ? '#16A34A' : '#DC2626',
                          display: 'inline-block' }} />
                        {fac.isOpen ? 'Open' : 'Closed'}
                      </div>
                    )}
                    <button
                      onClick={() => onFacilityPress?.(fac)}
                      style={viewDetailsBtnStyle(col)}
                    >
                      View details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend overlay */}
        <div style={legendStyle}>
          {(['clinic', 'hospital', 'pharmacy'] as const).map(type => (
            <div key={type} style={legendItemStyle}>
              <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: TYPE_COLOR[type], flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#4B5563' }}>
                {TYPE_LABEL[type]}
              </span>
            </div>
          ))}
        </div>
      </MapErrorBoundary>
    </div>
  );
};

export default ClinicsHospitalsPharmaciesMap;

// ── Inline styles ────────────────────────────────────────────────────────────

const popupStyle: React.CSSProperties = {
  minWidth: 180,
  maxWidth: 240,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: 4,
};

const viewDetailsBtnStyle = (color: string): React.CSSProperties => ({
  display: 'block',
  width: '100%',
  padding: '7px 0',
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  textAlign: 'center',
});

const loadingStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F5F7F9',
  borderRadius: 20,
  color: '#9CA3AF',
  fontSize: 14,
};

const errorFallbackStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  background: '#fff',
  borderRadius: 20,
  padding: 20,
  flexDirection: 'column',
  textAlign: 'center',
};

const retryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1.5px solid #EAECF0',
  background: '#fff',
  color: '#111827',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
};

const legendStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: 12,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'rgba(255,255,255,0.95)',
  borderRadius: 99,
  padding: '5px 12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(8px)',
};

const legendItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
};
