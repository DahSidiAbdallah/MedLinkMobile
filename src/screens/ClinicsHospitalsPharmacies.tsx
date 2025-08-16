
import React, { useState, useEffect } from 'react';
import type { Facility } from '../types';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFacilities } from '../hooks/useDoctorsAndPharmacies';
import { colors, spacing, radius } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { SegmentedControl } from '../components/SegmentedControl';



import ClinicsHospitalsPharmaciesMap from './ClinicsHospitalsPharmaciesMap';
import LocationSplash from '../components/LocationSplash';


export default function ClinicsHospitalsPharmacies() {
	const { facilities, loading, error } = useFacilities();
	const [search, setSearch] = useState('');
	const [type, setType] = useState<'all' | 'clinic' | 'hospital' | 'pharmacy'>('all');
	const [openNow, setOpenNow] = useState(false);
	const [hasDelivery, setHasDelivery] = useState(false);
	const [view, setView] = useState<'list' | 'map'>('list');
	const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
	const [locationLoading, setLocationLoading] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);
		const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

	// Filtering logic
	const filtered = facilities.filter(fac => {
		if (type !== 'all' && fac.type !== type) return false;
		if (openNow && fac.isOpen !== true) return false;
		if (hasDelivery && fac.hasDelivery !== true) return false;
		if (search && !fac.name.toLowerCase().includes(search.toLowerCase())) return false;
		return true;
	});

	// Call facility
	const handleCall = (phoneNumber?: string) => {
		if (!phoneNumber) return;
		const url = `tel:${phoneNumber}`;
		Linking.openURL(url);
	};
	// Open in maps
	const handleMap = (lat: number, lng: number, name: string) => {
		const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
		const latLng = `${lat},${lng}`;
		const label = encodeURIComponent(name);
		const url = Platform.OS === 'ios'
			? `${scheme}${label}@${latLng}`
			: `${scheme}${latLng}(${label})`;
		Linking.openURL(url);
	};

	// Splash logic for location
	const requestLocation = () => {
		setLocationLoading(true);
		setLocationError(null);
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				() => {
					setLocationGranted(true);
					setLocationLoading(false);
				},
				err => {
					setLocationGranted(false);
					setLocationLoading(false);
					setLocationError('Location permission denied. Please enable location to see nearby facilities.');
				},
				{ enableHighAccuracy: true, timeout: 5000 }
			);
		} else {
			setLocationGranted(false);
			setLocationLoading(false);
			setLocationError('Geolocation is not supported by your browser.');
		}
	};

	useEffect(() => {
		// Try to auto-request on mount
		if (locationGranted === null) {
			requestLocation();
		}
		// eslint-disable-next-line
	}, []);

	if (locationGranted === false) {
		return <LocationSplash onRequest={requestLocation} loading={locationLoading} error={locationError} />;
	}

	return (
		<View style={{ flex: 1, backgroundColor: colors.bg }}>
			<View style={styles.top}>
				<View style={styles.searchBar}>
					<Ionicons name="search" size={20} color={colors.muted} />
					<TextInput
						style={{ flex: 1, marginLeft: spacing.sm }}
						placeholder="Search facilities"
						value={search}
						onChangeText={setSearch}
					/>
				</View>
				<View style={{ marginTop: spacing.md }}>
					<SegmentedControl
						options={["All", "Clinic", "Hospital", "Pharmacy"]}
						value={type.charAt(0).toUpperCase() + type.slice(1)}
						onChange={v => setType(v.toLowerCase() as any)}
					/>
				</View>
				<View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
					<Pressable style={[styles.filterBtn, openNow && styles.filterBtnActive]} onPress={() => setOpenNow(v => !v)}>
						<Ionicons name="time" size={16} color={openNow ? colors.primary : colors.muted} />
						<Text style={[styles.filterText, openNow && styles.filterTextActive]}>Open Now</Text>
					</Pressable>
					<Pressable style={[styles.filterBtn, hasDelivery && styles.filterBtnActive]} onPress={() => setHasDelivery(v => !v)}>
						<Ionicons name="bicycle" size={16} color={hasDelivery ? colors.primary : colors.muted} />
						<Text style={[styles.filterText, hasDelivery && styles.filterTextActive]}>Has Delivery</Text>
					</Pressable>
				</View>
				<View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md }}>
					<Pressable style={styles.toggleBtn} onPress={() => setView(view === 'list' ? 'map' : 'list')}>
						<Ionicons name={view === 'list' ? 'map' : 'list'} size={18} color={colors.primary} />
						<Text style={styles.toggleText}>{view === 'list' ? 'Map View' : 'List View'}</Text>
					</Pressable>
				</View>
			</View>
					{view === 'map' ? (
						<>
										<ClinicsHospitalsPharmaciesMap
											filtered={filtered}
											handleMap={(lat: number, lng: number, name: string) => {
												// Find facility by lat/lng/name
												const fac = filtered.find(f => f.coordinates.lat === lat && f.coordinates.lng === lng && f.name === name);
												setSelectedFacility(fac || null);
											}}
										/>
							{selectedFacility && (
								<Card style={{ margin: 24, marginTop: 0 }}>
									<ListRow
										title={selectedFacility.name}
										subtitle={selectedFacility.specialty || selectedFacility.address || selectedFacility.location}
										leftIcon={<Ionicons name={selectedFacility.type === 'pharmacy' ? 'business' : 'medkit'} size={24} color={selectedFacility.type === 'pharmacy' ? colors.accent : colors.primary} />}
										right={
											<View style={{ flexDirection: 'row', gap: spacing.sm }}>
												{selectedFacility.phoneNumber && (
													<Pressable style={styles.outlineBtn} onPress={() => handleCall(selectedFacility.phoneNumber)}>
														<Ionicons name="call" size={16} color={colors.primary} />
														<Text style={styles.outlineText}>Call</Text>
													</Pressable>
												)}
												<Pressable style={styles.outlineBtn} onPress={() => handleMap(selectedFacility.coordinates.lat, selectedFacility.coordinates.lng, selectedFacility.name)}>
													<Ionicons name="map" size={16} color={colors.primary} />
													<Text style={styles.outlineText}>Map</Text>
												</Pressable>
											</View>
										}
									/>
									{/* Add more details if desired */}
									{selectedFacility.address && <Text style={{ color: colors.muted, marginTop: 8 }}>{selectedFacility.address}</Text>}
									{selectedFacility.hours && <Text style={{ color: colors.muted }}>Hours: {selectedFacility.hours}</Text>}
									{selectedFacility.hasDelivery && <Text style={{ color: colors.muted }}>Delivery Available</Text>}
								</Card>
							)}
						</>
					) : (
						<ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
							{filtered.map(fac => (
								<Card key={fac.id}>
									<ListRow
										title={fac.name}
										subtitle={fac.specialty || fac.address || fac.location}
										leftIcon={<Ionicons name={fac.type === 'pharmacy' ? 'business' : 'medkit'} size={24} color={fac.type === 'pharmacy' ? colors.accent : colors.primary} />}
										right={
											<View style={{ flexDirection: 'row', gap: spacing.sm }}>
												{fac.phoneNumber && (
													<Pressable style={styles.outlineBtn} onPress={() => handleCall(fac.phoneNumber)}>
														<Ionicons name="call" size={16} color={colors.primary} />
														<Text style={styles.outlineText}>Call</Text>
													</Pressable>
												)}
												<Pressable style={styles.outlineBtn} onPress={() => handleMap(fac.coordinates.lat, fac.coordinates.lng, fac.name)}>
													<Ionicons name="map" size={16} color={colors.primary} />
													<Text style={styles.outlineText}>Map</Text>
												</Pressable>
											</View>
										}
									/>
								</Card>
							))}
							{loading && <Text style={{ textAlign: 'center' }}>Loading...</Text>}
							{error && <Text style={{ color: colors.danger }}>{error}</Text>}
							{filtered.length === 0 && !loading && <Text style={{ textAlign: 'center', color: colors.muted }}>No facilities found.</Text>}
						</ScrollView>
					)}
		</View>
	);
}

	const styles = StyleSheet.create({
	   top: { padding: spacing.xl, paddingBottom: 0 },
	   searchBar: {
		   flexDirection: 'row',
		   alignItems: 'center',
		   backgroundColor: colors.card,
		   borderRadius: radius.lg,
		   paddingHorizontal: spacing.lg,
		   paddingVertical: spacing.sm,
	   },
	   outlineBtn: {
		   flexDirection: 'row',
		   alignItems: 'center',
		   gap: 4,
		   paddingHorizontal: spacing.md,
		   paddingVertical: spacing.xs,
		   borderRadius: radius.md,
		   borderWidth: 1,
		   borderColor: colors.primary,
		   backgroundColor: colors.bg,
	   },
	   outlineText: { color: colors.primary, fontWeight: '600', marginLeft: 2 },
	   filterBtn: {
		   flexDirection: 'row',
		   alignItems: 'center',
		   gap: 4,
		   paddingHorizontal: spacing.md,
		   paddingVertical: spacing.xs,
		   borderRadius: radius.md,
		   borderWidth: 1,
		   borderColor: colors.line,
		   backgroundColor: colors.card,
	   },
	   filterBtnActive: {
		   borderColor: colors.primary,
		   backgroundColor: '#E8F0FF',
	   },
	   filterText: { color: colors.muted, fontWeight: '600' },
	   filterTextActive: { color: colors.primary },
	   toggleBtn: {
		   flexDirection: 'row',
		   alignItems: 'center',
		   gap: 4,
		   paddingHorizontal: spacing.md,
		   paddingVertical: spacing.xs,
		   borderRadius: radius.md,
		   borderWidth: 1,
		   borderColor: colors.primary,
		   backgroundColor: colors.bg,
	   },
	   toggleText: { color: colors.primary, fontWeight: '600', marginLeft: 2 },
	});
