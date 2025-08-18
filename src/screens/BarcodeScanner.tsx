
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { colors, spacing } from '../theme';
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
  if (type === BarCodeScanner.Constants.BarCodeType.datamatrix) {
    // Try to extract (01)GTIN, (10)Batch, (17)Expiry, etc.
    const aiMatch = data.match(/\(01\)(\d{14})/);
    if (aiMatch) return { codeType: 'GS1 DataMatrix (GTIN-14)', parsed: aiMatch[1] };
    return { codeType: 'DataMatrix', parsed: data };
  }
  // QR, PDF417, etc.
  if (type === BarCodeScanner.Constants.BarCodeType.qr) return { codeType: 'QR Code', parsed: data };
  if (type === BarCodeScanner.Constants.BarCodeType.pdf417) return { codeType: 'PDF417', parsed: data };
  // Fallback
  return { codeType: 'Unknown', parsed: data };
}

const SUPPORTED_TYPES = [
  BarCodeScanner.Constants.BarCodeType.qr,
  BarCodeScanner.Constants.BarCodeType.ean13,
  BarCodeScanner.Constants.BarCodeType.ean8,
  BarCodeScanner.Constants.BarCodeType.upc_a,
  BarCodeScanner.Constants.BarCodeType.upc_e,
  BarCodeScanner.Constants.BarCodeType.code39,
  BarCodeScanner.Constants.BarCodeType.code128,
  BarCodeScanner.Constants.BarCodeType.datamatrix,
  BarCodeScanner.Constants.BarCodeType.pdf417,
  BarCodeScanner.Constants.BarCodeType.itf14,
  BarCodeScanner.Constants.BarCodeType.aztec,
];

export default function BarcodeScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState<BarCodeScannerResult | null>(null);
  const [ndcInfo, setNdcInfo] = useState<any>(null);
  const [recallInfo, setRecallInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async (result: BarCodeScannerResult) => {
    setScanned(true);
    setScanData(result);
    setNdcInfo(null);
    setRecallInfo(null);
    setError(null);
    setLoading(false);

    // Try to parse code type
    const { codeType, parsed } = parseCodeType(result.data, result.type);
    if (codeType.startsWith('NDC')) {
      setLoading(true);
      // Fetch OpenFDA info
      const info = await fetchOpenFdaNdcInfo(parsed);
      setNdcInfo(info);
      // Fetch recall info
      const recall = await fetchOpenFdaRecall(parsed);
      setRecallInfo(recall);
      setLoading(false);
      if (!info) setError('No drug info found for this NDC code.');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {!scanned && !scanData && (
        <>
          <Text style={styles.text}>Scan any barcode or data matrix on a medication package</Text>
          <View style={styles.scannerBox}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              barCodeTypes={SUPPORTED_TYPES}
              style={StyleSheet.absoluteFillObject}
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
          {/* Code type identification */}
          {(() => {
            const { codeType, parsed } = parseCodeType(scanData.data, scanData.type);
            return (
              <>
                <Text style={styles.resultLabel}>Detected Code Type:</Text>
                <Text style={styles.resultValue}>{codeType}</Text>
                <Text style={styles.resultLabel}>Parsed Value:</Text>
                <Text style={styles.resultValue}>{parsed}</Text>
                {/* If NDC, show OpenFDA info */}
                {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
                {ndcInfo && !loading && (
                  <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
                    <Text style={[styles.resultLabel, { marginBottom: 2 }]}>Drug Name:</Text>
                    <Text style={styles.resultValue}>{ndcInfo.brand_name} ({ndcInfo.generic_name})</Text>
                    <Text style={styles.resultLabel}>Labeler:</Text>
                    <Text style={styles.resultValue}>{ndcInfo.labeler_name}</Text>
                    <Text style={styles.resultLabel}>Dosage Form:</Text>
                    <Text style={styles.resultValue}>{ndcInfo.dosage_form}</Text>
                    <Text style={styles.resultLabel}>Route:</Text>
                    <Text style={styles.resultValue}>{ndcInfo.route}</Text>
                    <Text style={styles.resultLabel}>Marketing Status:</Text>
                    <Text style={styles.resultValue}>{ndcInfo.marketing_status}</Text>
                    <Text style={styles.resultLabel}>Active Ingredients:</Text>
                    <Text style={styles.resultValue}>{ndcInfo.active_ingredients?.map((a: any) => a.name + ' (' + a.strength + ')').join(', ')}</Text>
                    <Text style={styles.resultLabel}>Purpose:</Text>
                    <Text style={styles.resultValue}>{ndcInfo.purpose}</Text>
                    <Text style={styles.resultLabel}>Side Effects:</Text>
                    <Text style={styles.resultValue}>{ndcInfo.adverse_reactions || 'N/A'}</Text>
                    <Text style={styles.resultLabel}>OpenFDA Link:</Text>
                    <Text style={[styles.resultValue, { color: colors.primary }]} onPress={() => Linking.openURL(`https://open.fda.gov/apis/drug/ndc/`)}>View API</Text>
                  </View>
                )}
                {recallInfo && !loading && (
                  <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
                    <Text style={[styles.resultLabel, { color: colors.danger }]}>Recall Alert:</Text>
                    <Text style={styles.resultValue}>{recallInfo.reason_for_recall}</Text>
                    <Text style={styles.resultLabel}>Recall Status:</Text>
                    <Text style={styles.resultValue}>{recallInfo.status}</Text>
                  </View>
                )}
                {error && !loading && (
                  <Text style={styles.error}>{error}</Text>
                )}
              </>
            );
          })()}
          <TouchableOpacity style={styles.rescanBtn} onPress={() => {
            setScanned(false); setScanData(null); setNdcInfo(null); setRecallInfo(null); setError(null); setLoading(false);
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
