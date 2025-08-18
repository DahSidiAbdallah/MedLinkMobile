import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { colors, spacing } from '../theme';
import { medications } from '../data';

export default function BarcodeScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    setError(null);
    // Simulate lookup
    setTimeout(() => {
      const med = medications.find(m => m.authenticity_code === data);
      if (med) {
        setResult(med);
        setError(null);
      } else {
        setResult(null);
        setError('No matching medication found. This barcode is unrecognized or suspicious.');
      }
      setLoading(false);
    }, 600);
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {!scanned && !result && !error && (
        <>
          <Text style={styles.text}>Scan the barcode on your medication</Text>
          <View style={styles.scannerBox}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        </>
      )}
      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
      {result && !loading && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>{result.name}</Text>
          <Text style={styles.resultSub}>{result.generic_name}</Text>
          <Image source={{ uri: result.images?.[0] }} style={styles.resultImg} />
          <Text style={styles.resultDesc}>{result.description}</Text>
          <TouchableOpacity style={styles.rescanBtn} onPress={() => { setScanned(false); setResult(null); setError(null); }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      )}
      {error && !loading && (
        <View style={styles.resultBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.rescanBtn} onPress={() => { setScanned(false); setResult(null); setError(null); }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  text: {
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  scannerBox: {
    width: 280,
    height: 280,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: '#000',
    alignSelf: 'center',
  },
  resultBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  resultSub: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 8,
  },
  resultImg: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultDesc: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  rescanBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 12,
  },
});
