import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { Facility } from '../types';
import { colors, radius, shadow, spacing } from '../theme';

// Per-type visual config
const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  clinic:   { color: colors.primary,   bg: '#E0FBF6', icon: 'medkit-outline' },
  hospital: { color: '#F59E0B',        bg: '#FEF3C7', icon: 'business-outline' },
  pharmacy: { color: '#7C6FE0',        bg: '#EDEBFA', icon: 'flask-outline' },
};

function PinMarker({ type, selected }: { type: string; selected?: boolean }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.clinic;
  return (
    <View style={styles.pinWrap}>
      <View style={[
        styles.pinCircle,
        { backgroundColor: cfg.color, borderColor: '#fff' },
        selected && styles.pinCircleSelected,
      ]}>
        <Ionicons name={cfg.icon} size={16} color="#fff" />
      </View>
      {/* Triangle tail */}
      <View style={[styles.pinTail, { borderTopColor: cfg.color }]} />
    </View>
  );
}

interface Props {
  filtered: Facility[];
  handleMap: (lat: number, lng: number, name: string) => void;
  onFacilityPress?: (fac: Facility) => void;
}

const FALLBACK: Region = { latitude: 18.08, longitude: -15.98, latitudeDelta: 0.12, longitudeDelta: 0.12 };
const EDGE = { top: 80, right: 60, bottom: 80, left: 60 };

export default function ClinicsHospitalsPharmaciesMap({ filtered, handleMap, onFacilityPress }: Props) {
  const mapRef = useRef<MapView>(null);

  // Re-fit bounds whenever filtered list changes
  useEffect(() => {
    if (!mapRef.current) return;
    const valid = filtered.filter(f => f.coordinates?.lat && f.coordinates?.lng);
    if (valid.length === 0) return;
    const coords = valid.map(f => ({ latitude: f.coordinates.lat, longitude: f.coordinates.lng }));
    // Slight delay so the map has mounted/resized
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, { edgePadding: EDGE, animated: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [filtered]);

  const initialRegion: Region = filtered.length > 0 && filtered[0].coordinates
    ? { latitude: filtered[0].coordinates.lat, longitude: filtered[0].coordinates.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : FALLBACK;

  const valid = filtered.filter(f => f.coordinates?.lat && f.coordinates?.lng);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {valid.map(fac => (
          <Marker
            key={fac.id}
            coordinate={{ latitude: fac.coordinates.lat, longitude: fac.coordinates.lng }}
            onCalloutPress={() => {
              handleMap(fac.coordinates.lat, fac.coordinates.lng, fac.name);
              onFacilityPress?.(fac);
            }}
            tracksViewChanges={false}
          >
            <PinMarker type={fac.type} />

            <Callout tooltip onPress={() => onFacilityPress?.(fac)}>
              <View style={styles.callout}>
                <View style={[styles.calloutTypeDot, { backgroundColor: (TYPE_CONFIG[fac.type] || TYPE_CONFIG.clinic).color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.calloutName} numberOfLines={1}>{fac.name}</Text>
                  <Text style={styles.calloutSub} numberOfLines={1}>{fac.specialty || fac.type}</Text>
                  {fac.distance ? <Text style={styles.calloutDist}>{fac.distance}</Text> : null}
                </View>
                <View style={styles.calloutArrow}>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        {(['clinic', 'hospital', 'pharmacy'] as const).map(type => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: TYPE_CONFIG[type].color }]} />
            <Text style={styles.legendLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  map: { flex: 1 },

  // Custom pin
  pinWrap: { alignItems: 'center' },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    ...shadow.card,
  },
  pinCircleSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Callout popup
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    minWidth: 200,
    maxWidth: 260,
    ...shadow.lg,
  },
  calloutTypeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  calloutSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  calloutDist: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  calloutArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Legend
  legend: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.soft,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
});
