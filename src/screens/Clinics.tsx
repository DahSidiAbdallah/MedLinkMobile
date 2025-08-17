import React from 'react';
import { ScrollView, Text } from 'react-native';
import { colors, spacing } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { Pill } from '../components/Pill';
import { useFacilities } from '../hooks/useDoctorsAndPharmacies';

export default function Clinics({ navigation }: any) {
  const { facilities, loading, error } = useFacilities();
  return (
    <ScrollView style={{ flex:1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      {facilities.map(c => (
        <Card key={c.id} style={{ marginBottom: spacing.lg }}>
          <ListRow
            title={c.name}
            subtitle={c.address}
            right={c.specialty ? <Pill tone="primary">{c.specialty}</Pill> : undefined}
            onPress={()=>navigation.navigate('ClinicDetail',{ id:c.id })}
          />
        </Card>
      ))}
      {loading && <Text style={{ textAlign:'center' }}>Loading...</Text>}
      {error && <Text style={{ color: colors.danger }}>{error}</Text>}
      {facilities.length===0 && !loading && !error && (
        <Text style={{ textAlign:'center', color: colors.muted }}>No clinics found.</Text>
      )}
    </ScrollView>
  );
}
