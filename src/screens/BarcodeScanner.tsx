
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, spacing } from '../theme';
import { verifyScannedCode, VerificationResult } from '../utils/verification';
import { parseGs1DataMatrix } from '../utils/gs1';
async function fetchOpenFdaNdcInfo(ndc: string) {
  // NDC can be 10 or 11 digits. OpenFDA expects 10-digit (with hyphens) or 11-digit (no hyphens)
  // We'll try both formats
  const ndc10 = ndc.length === 10 ? ndc : ndc.replace(/(\d{5})(\d{3})(\d{2})/, '$1-$2-$3');
  const ndc11 = ndc.length === 11 ? ndc : ndc.replace(/-/g, '');
  const url = `https://api.fda.gov/drug/ndc.json?search=product_ndc:${ndc10}+product_ndc:${ndc11}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('OpenFDA API error');
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchOpenFdaRecall(ndc: string) {
  // Try to find recall info for this NDC
  const url = `https://api.fda.gov/drug/enforcement.json?search=openfda.product_ndc:${ndc}&limit=1`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (e) {
    return null;
  }
}
// Helper functions for code type detection
function parseCodeType(data: string, type: string) {
  // GTIN-14: 14 digits, GTIN-13: 13 digits, GTIN-12: 12 digits, GTIN-8: 8 digits
  if (/^\d{14}$/.test(data)) return { codeType: 'GTIN-14', parsed: data };
  if (/^\d{13}$/.test(data)) return { codeType: 'GTIN-13', parsed: data };
  if (/^\d{12}$/.test(data)) return { codeType: 'GTIN-12', parsed: data };
  if (/^\d{8}$/.test(data)) return { codeType: 'GTIN-8', parsed: data };
  // NDC-11: 11 digits, NDC-10: 10 digits
  if (/^\d{11}$/.test(data)) return { codeType: 'NDC-11', parsed: data };
  if (/^\d{10}$/.test(data)) return { codeType: 'NDC-10', parsed: data };
  // DataMatrix: often contains GS1 Application Identifiers (AI)
  if (type === 'datamatrix') {
    const gs1 = parseGs1DataMatrix(data);
    if (gs1) {
      return {
        codeType: 'GS1 DataMatrix',
        parsed: gs1.gtin,
        extra: gs1, // expiry and lot info
      };
    }
    return { codeType: 'DataMatrix', parsed: data };
  }
  // QR, PDF417, etc.
  if (type === 'qr') return { codeType: 'QR Code', parsed: data };
  if (type === 'pdf417') return { codeType: 'PDF417', parsed: data };
  // Fallback
  return { codeType: 'Unknown', parsed: data };
}



export default function BarcodeScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState<any>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data, type }: { data: string; type: string }) => {
    setScanned(true);
    setScanData({ data, type });
    setLoading(true);
    setError(null);
    setVerification(null);
    try {
      const result = await verifyScannedCode(data, type);
      setVerification(result);
    } catch (e) {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!permission?.granted) {
    return <View style={styles.container}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {!scanned && !scanData && (
        <>
          <Text style={styles.text}>Scan any barcode or data matrix on a medication package</Text>
          <View style={styles.scannerBox}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
          </View>
        </>
      )}
      {scanned && scanData && (
        <ScrollView contentContainerStyle={styles.resultBox}>
          <Text style={styles.resultTitle}>Scan Result</Text>
          <Text style={styles.resultLabel}>Barcode Type:</Text>
          <Text style={styles.resultValue}>{scanData.type}</Text>
          <Text style={styles.resultLabel}>Raw Data:</Text>
          <Text style={styles.resultValue}>{scanData.data}</Text>
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
          {verification && (
            <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
              {verification.verified && <Text style={{ color: colors.success }}>Authenticity verified!</Text>}
              {verification.expired && <Text style={{ color: 'red' }}>Expired: do not use.</Text>}
              {verification.recall && (
                <View>
                  <Text style={{ color: 'red' }}>Recall Alert:</Text>
                  <Text>{verification.recall.reason_for_recall}</Text>
                  <Text>Status: {verification.recall.status}</Text>
                </View>
              )}
              {verification.label && (
                <View>
                  <Text>Indications:</Text>
                  <Text>{verification.label.indications_and_usage}</Text>
                  <Text>Dosage:</Text>
                  <Text>{verification.label.dosage_and_administration}</Text>
                  <Text>Side Effects:</Text>
                  <Text>{verification.label.adverse_reactions}</Text>
                </View>
              )}
              {!verification.verified && !verification.recall && !verification.expired && (
                <Text>No authenticity data available. Exercise caution.</Text>
              )}
              <Text style={{ marginTop: 8, color: colors.muted }}>{verification.message}</Text>
            </View>
          )}
          {error && !loading && (
            <Text style={styles.error}>{error}</Text>
          )}
          <TouchableOpacity style={styles.rescanBtn} onPress={() => {
            setScanned(false); setScanData(null); setVerification(null); setError(null); setLoading(false);
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Scan Another</Text>
          </TouchableOpacity>
        </ScrollView>
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
    minWidth: 260,
    maxWidth: 340,
    alignSelf: 'center',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 8,
    marginBottom: 2,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  resultValue: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
    alignSelf: 'flex-start',
    // wordBreak: 'break-all', // Not supported in React Native
  },
  rescanBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 18,
  },
  error: {
    color: colors.danger || 'red',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
