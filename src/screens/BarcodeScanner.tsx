import { saveMedication } from '../utils/myMedications';

import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserProfile, Profile } from '../core/userProfile';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ensureFocus } from '../utils/cameraHelper';
import { colors, spacing } from '../theme';
import { verifyScannedCode, VerificationResult } from '../utils/verification';
import { parseGs1DataMatrix } from '../utils/gs1';
import { normalizeBarcode, parseGs1AIs, validateEAN13CheckDigit, getGtinFromAIs } from '../core/barcode';
import { getTelemetryService, makeScanTelemetryEvent } from '../core/telemetryService';
import { hapticSuccess } from '../utils/haptics';
import { summarizeText, safeJoinArrayField } from '../utils/textHelpers';
import LabelInfoView from '../components/LabelInfoView';

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
  userMessage: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors.card,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  historyItem: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  historyType: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
  historyData: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  historyMsg: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
  },
});

type ScanHistoryItem = {
  timestamp: number;
  data: string;
  type: string;
  verification: VerificationResult | null;
  error: string | null;
  risk?: string | null;
};

const getUserMessage = (verification: VerificationResult | null, error: string | null): string => {
  if (error) return 'Scan failed. Please try again.';
  if (!verification) return '';
  if (verification.verified) return 'This product is authentic and safe.';
  if (verification.expired) return 'Warning: This product is expired. Do not use.';
  if (verification.recall) return 'Recall alert: This product has been recalled.';
  return 'No authenticity or recall data found. Please exercise caution.';
};

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

const HISTORY_KEY = 'scan_history_v1';


const BarcodeScanner: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<any>(null)
  const lastFrameTs = React.useRef<number | null>(null)
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState<any>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [riskWarning, setRiskWarning] = useState<string | null>(null);
  const [lastRisk, setLastRisk] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'successful' | 'unsuccessful' | 'risk'>('all');
  const [showScanEffect, setShowScanEffect] = useState(false);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [pulse, setPulse] = useState(true);
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeout = useRef<NodeJS.Timeout | null>(null);
  // Pulse animation for scan box
  useEffect(() => {
    if (!scanned && !scanData) {
      setPulse(true);
      const animate = () => {
        setPulse(p => !p);
        pulseTimeout.current = setTimeout(animate, 700);
      };
      animate();
      return () => { if (pulseTimeout.current) clearTimeout(pulseTimeout.current); };
    } else {
      setPulse(false);
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    }
  }, [scanned, scanData]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    // Load user profile for cross-checking
    async function loadProfile() {
      const userProfile = await fetchUserProfile();
      setProfile(userProfile);
    }
    // Load scan history from AsyncStorage
    async function loadHistory() {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) {
          setHistory(JSON.parse(raw));
        }
      } catch {}
    }
    loadProfile();
    loadHistory();
  // ensure focus when camera is available
  ensureFocus(cameraRef).catch(() => {})
  }, [permission]);

  // Only allow one scan at a time
  const handleBarCodeScanned = async ({ data, type }: { data: string; type: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanData({ data, type });
    setLoading(true);
    setError(null);
    setVerification(null);
    setRiskWarning(null);
    setLastRisk(null);
    setShowScanEffect(true);
    let result: VerificationResult | null = null;
    let err: string | null = null;
    let risk = '';
    const telemetryStart = Date.now();
    let telemetry: any = { scanType: type };
    try {
      // Normalization step
      const norm = normalizeBarcode(data);
      if (norm.gtin) telemetry.gtin = norm.gtin;
      telemetry.normalizedType = norm.type;

      // If EAN, validate check digit
      if (norm.type === 'EAN' && norm.gtin) {
        telemetry.eanCheck = validateEAN13CheckDigit(norm.gtin);
      }

      // If DataMatrix-like, parse GS1 AIs
      if (norm.type === 'DATAMATRIX') {
        const ais = parseGs1AIs(data);
        telemetry.gs1 = { ais };
        const extractedGtin = getGtinFromAIs(ais);
        if (extractedGtin) telemetry.gtin = extractedGtin;
      }

      result = await verifyScannedCode(data, type);
      setVerification(result);
      // Haptic feedback on positive findings
      if (result && (result.verified || result.recall)) {
        try { await hapticSuccess() } catch {}
      }
      telemetry.lookupSuccess = !!result;
      // Cross-check with user profile for risks
      if (profile && result && result.label) {
        const medName = (result.label.brand_name || result.label.generic_name || '').toLowerCase();
        // Check allergies
        if (profile.allergies && profile.allergies.length > 0) {
          for (const allergy of profile.allergies) {
            if (medName.includes(allergy.toLowerCase())) {
              risk += `Allergy risk: ${allergy}.\n`;
            }
          }
        }
        // Check medical conditions (simple keyword match)
        if (profile.medical_conditions && profile.medical_conditions.length > 0) {
          for (const cond of profile.medical_conditions) {
            if (result.label.contraindications && result.label.contraindications.toLowerCase().includes(cond.toLowerCase())) {
              risk += `Condition risk: ${cond}.\n`;
            }
          }
        }
        // Check current medications (simple keyword match)
        if (profile.medications && profile.medications.length > 0) {
          for (const med of profile.medications) {
            if (result.label.drug_interactions && result.label.drug_interactions.toLowerCase().includes(med.toLowerCase())) {
              risk += `Interaction risk: ${med}.\n`;
            }
          }
        }
        if (risk) {
          setRiskWarning(risk.trim());
          setLastRisk(risk.trim());
        }
      }
    } catch (e) {
      err = 'Verification failed.';
      setError(err);
  telemetry.errorCodes = ['verification_failed']
    } finally {
      telemetry.decodeTimeMs = Date.now() - telemetryStart;
      const event = makeScanTelemetryEvent({
        scanType: telemetry.normalizedType || telemetry.scanType,
        decodeTimeMs: telemetry.decodeTimeMs,
        verificationTelemetry: telemetry,
        cacheHit: telemetry.cacheHit || false,
        sourceBadges: [],
        errorCodes: telemetry.errorCodes || [],
      })
  const svc = getTelemetryService()
  svc?.record(event as any)
      setLoading(false);
      setTimeout(() => setShowScanEffect(false), 600);
      const newItem = {
        timestamp: Date.now(),
        data,
        type,
        verification: result,
        error: err,
        risk: risk.trim() || null,
      };
      setHistory(prev => {
        const updated = [newItem, ...prev];
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    }
  };

  // Advanced camera guidance: show dynamic messages
  useEffect(() => {
    if (!scanned && !scanData) {
      setGuidance(null);
      setBarcodeDetected(false);
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      // After 3s, suggest to center barcode
      scanTimeout.current = setTimeout(() => {
        setGuidance('Center the barcode in the box.');
      }, 3000);
      // After 6s, suggest to move closer or improve lighting
      setTimeout(() => {
        setGuidance('Move closer, hold steady, or improve lighting.');
      }, 6000);
      // After 10s, suggest to clean camera or try another code
      setTimeout(() => {
        setGuidance('Try cleaning your camera or another barcode.');
      }, 10000);
    } else {
      setGuidance(null);
      setBarcodeDetected(false);
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    }
    return () => {
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    };
  }, [scanned, scanData]);

  if (!permission?.granted) {
    return <View style={styles.container}><ActivityIndicator color={colors.primary} /></View>;
  }

  // Filter history
  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'successful') return item.verification && (item.verification.verified || item.verification.recall || item.verification.expired);
    if (filter === 'unsuccessful') return !item.verification || (!item.verification.verified && !item.verification.recall && !item.verification.expired);
    if (filter === 'risk') return item.risk && item.risk.length > 0;
    return true;
  });

  return (
    <View style={styles.container}>
      {!scanned && !scanData && (
        <>
          <Text style={styles.text}>Scan any barcode or data matrix on a medication package</Text>
          <View style={[styles.scannerBox, { justifyContent: 'center', alignItems: 'center' }]}> 
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              // expo-camera uses 'autofocus' prop name in some typings; provide a best-effort hint
              autofocus={'on' as any}
              onBarcodeScanned={scanned ? undefined : (event: { data: string; type: string }) => {
                // If barcode is detected but not yet scanned, show detected animation
                if (!barcodeDetected) setBarcodeDetected(true);
                handleBarCodeScanned(event);
              }}
            />
            {/* Advanced scan guidance overlay */}
            <View style={{
              position: 'absolute',
              borderWidth: pulse ? 3 : 1,
              borderColor: showScanEffect ? colors.accent : (barcodeDetected ? colors.accent : '#fff'),
              borderRadius: 14,
              width: 220,
              height: 80,
              top: 100,
              left: 30,
              backgroundColor: showScanEffect ? 'rgba(34,197,94,0.08)' : (barcodeDetected ? 'rgba(34,197,94,0.04)' : 'transparent'),
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              shadowColor: barcodeDetected ? colors.accent : undefined,
              shadowOpacity: barcodeDetected ? 0.3 : 0,
              shadowRadius: barcodeDetected ? 8 : 0,
              shadowOffset: { width: 0, height: 0 },
            }}>
              <Text style={{ color: showScanEffect ? colors.accent : (barcodeDetected ? colors.accent : '#fff'), fontWeight: 'bold', fontSize: 16 }}>
                {showScanEffect ? 'Scan Complete!' : barcodeDetected ? 'Barcode Detected!' : 'Align barcode here'}
              </Text>
            </View>
          </View>
          {guidance && (
            <Text style={{ color: colors.warn, marginTop: 10, fontWeight: 'bold', textAlign: 'center' }}>{guidance}</Text>
          )}
          {history.length > 0 && (
            <View style={{ marginTop: 32, width: '100%' }}>
              <Text style={styles.resultTitle}>Scan History</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
                <TouchableOpacity onPress={() => setFilter('all')} style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}><Text style={styles.filterBtnText}>All</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('successful')} style={[styles.filterBtn, filter === 'successful' && styles.filterBtnActive]}><Text style={styles.filterBtnText}>Successful</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('unsuccessful')} style={[styles.filterBtn, filter === 'unsuccessful' && styles.filterBtnActive]}><Text style={styles.filterBtnText}>Unsuccessful</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('risk')} style={[styles.filterBtn, filter === 'risk' && styles.filterBtnActive]}><Text style={styles.filterBtnText}>Risk Matched</Text></TouchableOpacity>
              </View>
              <FlatList
                data={filteredHistory}
                keyExtractor={(item, idx) => `${item.timestamp}_${item.data}_${idx}`}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <Text style={styles.historyType}>{item.type}</Text>
                    <Text style={styles.historyData}>{item.data}</Text>
                    <Text style={styles.historyMsg}>{getUserMessage(item.verification, item.error)}</Text>
                    {item.risk && item.risk.length > 0 && (
                      <Text style={{ color: '#b45309', fontSize: 13, marginTop: 2 }}>⚠️ {item.risk}</Text>
                    )}
                    <Text style={styles.historyTime}>{new Date(item.timestamp).toLocaleString()}</Text>
                  </View>
                )}
                style={{ maxHeight: 220 }}
              />
            </View>
          )}
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
          <Text style={styles.userMessage}>{getUserMessage(verification, error)}</Text>
          {riskWarning && (
            <View style={{ marginTop: 16, alignSelf: 'stretch', backgroundColor: '#fffbe6', borderColor: '#f59e42', borderWidth: 1, borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#b45309', fontWeight: 'bold' }}>⚠️ Medication Risk</Text>
              <Text style={{ color: '#b45309', marginTop: 4 }}>{riskWarning}</Text>
            </View>
          )}
          {verification && (
            <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
              {verification.verified && <Text style={{ color: 'green' }}>Authenticity verified!</Text>}
              {verification.expired && <Text style={{ color: 'red' }}>Expired: do not use.</Text>}
              {verification.recall && (
                <View>
                  <Text style={{ color: 'red' }}>Recall Alert:</Text>
                  <Text>{verification.recall.reason_for_recall}</Text>
                  <Text>Status: {verification.recall.status}</Text>
                </View>
              )}
              {(verification.labelInfo || verification.label) && (
                <LabelInfoView labelInfo={verification.labelInfo} label={verification.label} />
              )}
              {/* Show openFDA info if available, else webscraper info, or both if both exist */}
              {(verification.labelInfo || verification.webscraperInfo) && (
                <View style={{ marginTop: 12, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10 }}>
                  {/* openFDA info */}
                  {verification.labelInfo && (
                    <>
                      <Text style={{ fontWeight: 'bold', color: colors.primary }}>Indications & Usage (openFDA)</Text>
                      <Text style={{ color: colors.text }}>{verification.labelInfo.indications || 'N/A'}</Text>
                      <Text style={{ fontWeight: 'bold', color: colors.primary, marginTop: 6 }}>Dosage & Administration (openFDA)</Text>
                      <Text style={{ color: colors.text }}>{verification.labelInfo.dosage || 'N/A'}</Text>
                      <Text style={{ fontWeight: 'bold', color: colors.primary, marginTop: 6 }}>Adverse Reactions (openFDA)</Text>
                      <Text style={{ color: colors.text }}>{verification.labelInfo.sideEffects || 'N/A'}</Text>
                    </>
                  )}
                  {/* webscraper info (show if openFDA missing or to supplement) */}
                  {verification.webscraperInfo && (
                    <View style={{ marginTop: verification.labelInfo ? 16 : 0 }}>
                      <Text style={{ fontWeight: 'bold', color: colors.accent }}>Drug Info (Webscraper)</Text>
                      {verification.webscraperInfo.indications && (
                        <>
                          <Text style={{ fontWeight: 'bold', color: colors.primary }}>Indications & Usage</Text>
                          <Text style={{ color: colors.text }}>{verification.webscraperInfo.indications}</Text>
                        </>
                      )}
                      {verification.webscraperInfo.dosage && (
                        <>
                          <Text style={{ fontWeight: 'bold', color: colors.primary, marginTop: 6 }}>Dosage & Administration</Text>
                          <Text style={{ color: colors.text }}>{verification.webscraperInfo.dosage}</Text>
                        </>
                      )}
                      {verification.webscraperInfo.sideEffects && (
                        <>
                          <Text style={{ fontWeight: 'bold', color: colors.primary, marginTop: 6 }}>Adverse Reactions</Text>
                          <Text style={{ color: colors.text }}>{verification.webscraperInfo.sideEffects}</Text>
                        </>
                      )}
                      {/* Fallback: show all fields if no standard keys */}
                      {!verification.webscraperInfo.indications && !verification.webscraperInfo.dosage && !verification.webscraperInfo.sideEffects && (
                        <Text style={{ color: colors.muted }}>No standard drug info fields found from webscraper. Raw data:</Text>
                      )}
                      {!verification.webscraperInfo.indications && !verification.webscraperInfo.dosage && !verification.webscraperInfo.sideEffects && (
                        <Text style={{ color: colors.text, fontSize: 13 }}>{JSON.stringify(verification.webscraperInfo, null, 2)}</Text>
                      )}
                    </View>
                  )}
                  {/* If neither source yields info, show fallback */}
                  {!verification.labelInfo && !verification.webscraperInfo && (
                    <Text style={{ color: colors.muted }}>No drug information found from openFDA or webscraper.</Text>
                  )}
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
          <TouchableOpacity
            style={[styles.rescanBtn, { backgroundColor: colors.primary, marginBottom: 10 }]}
            onPress={() => {
              setScanned(false); setScanData(null); setVerification(null); setError(null); setLoading(false);
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Scan Another</Text>
          </TouchableOpacity>
          {verification && (
            <TouchableOpacity
              style={[styles.rescanBtn, { backgroundColor: colors.accent }]}
              onPress={async () => {
                await saveMedication({
                  code: scanData.data,
                  type: scanData.type,
                  labelInfo: verification.labelInfo,
                  recall: verification.recall,
                  timestamp: Date.now(),
                });
                // Optionally show a confirmation
                setError('Saved to My Medications!');
                setTimeout(() => setError(null), 1500);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save to My Medications</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default BarcodeScanner;
   
