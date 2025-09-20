
import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { colors, radius } from '../theme';
import { Dimensions, StyleSheet } from 'react-native';
import Card from '../components/Card';

interface Facility {
  id: string;
  name: string;
  type: string;
  specialty?: string;
  address?: string;
  location: string;
  coordinates: { lat: number; lng: number };
}

interface Props {
  filtered: Facility[];
  handleMap: (lat: number, lng: number, name: string) => void;
}

const ClinicsHospitalsPharmaciesMap: React.FC<Props> = ({ filtered, handleMap }) => {
  // Fallback region if no facilities are available
  const fallbackRegion = {
    latitude: 18.08,
    longitude: -15.98,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };
  const region = filtered.length > 0
    ? {
        latitude: filtered[0].coordinates.lat,
        longitude: filtered[0].coordinates.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : fallbackRegion;

  return (
    <Card style={styles.card}>
      <MapView
        style={styles.map}
        initialRegion={region}
      >
        {filtered.map(fac => (
          <Marker
            key={fac.id}
            coordinate={{ latitude: fac.coordinates.lat, longitude: fac.coordinates.lng }}
            title={fac.name}
            description={fac.specialty || fac.address || fac.location}
            pinColor={fac.type === 'pharmacy' ? colors.accent : colors.primary}
            onCalloutPress={() => handleMap(fac.coordinates.lat, fac.coordinates.lng, fac.name)}
          />
        ))}
      </MapView>
    </Card>
  );
};

export default ClinicsHospitalsPharmaciesMap;

const styles = StyleSheet.create({
  card: {
    padding: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: Dimensions.get('window').height * 0.6,
  },
  map: {
    flex: 1,
  },
});
