import { saveMedication } from '../utils/myMedications';
// TEMPORARILY DISABLED - Causing module load error
// import { checkDrugSafety, type SafetyCheck } from '../utils/drugInteractionChecker';

import React, { useState, useEffect, useRef } from 'react';
// Guard AsyncStorage import to avoid module-eval crashes on some runtimes
let AsyncStorage: any = null;
function getAsyncStorage() {
  if (AsyncStorage) return AsyncStorage;
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('AsyncStorage not available in BarcodeScanner, using in-memory fallback:', e);
    const store: Record<string, string> = {};
    AsyncStorage = {
      getItem: async (k: string) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: async (k: string, v: string) => { store[k] = v; },
      removeItem: async (k: string) => { delete store[k]; },
    };
  }
  return AsyncStorage;
}
import { fetchUserProfile, Profile } from '../core/userProfile';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ensureFocus } from '../utils/cameraHelper';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Chip from '../components/Chip';
import { colors, spacing, shadow, radius } from '../theme';
import { verifyScannedCode, VerificationResult } from '../utils/verification';
import { parseGs1DataMatrix } from '../utils/gs1';
import { normalizeBarcode, parseGs1AIs, validateEAN13CheckDigit, getGtinFromAIs } from '../core/barcode';
import { getTelemetryService, makeScanTelemetryEvent } from '../core/telemetryService';
import { hapticSuccess } from '../utils/haptics';
import { summarizeText, safeJoinArrayField } from '../utils/textHelpers';
import LabelInfoView from '../components/LabelInfoView';

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    paddingTop: spacing.xxl * 1.2,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    gap: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  statText: {
    color: '#fff',
    fontWeight: '600',
  },
  scanCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scanInstructions: {
    color: colors.muted,
    textAlign: 'center',
  },
  cameraShell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlayFrame: {
    position: 'absolute',
    top: '32%',
    left: '12%',
    width: '76%',
    height: '32%',
    borderRadius: radius.md,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
    fontWeight: '600',
  },
  guidance: {
    color: colors.warn,
    textAlign: 'center',
    fontWeight: '600',
  },
  resultCard: {
    gap: spacing.md,
  },
  userMessage: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  riskCard: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  riskTitle: {
    color: colors.danger,
    fontWeight: '700',
  },
  riskText: {
    color: colors.danger,
    lineHeight: 20,
  },
  positiveText: {
    color: colors.accent,
    fontWeight: '600',
  },
  negativeText: {
    color: colors.danger,
    fontWeight: '600',
  },
  analysisCard: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  resultButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.muted,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.card,
    fontWeight: '700',
  },
  historyCard: {
    gap: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  historyItem: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadow.soft,
  },
  historyType: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
  historyData: {
    fontSize: 15,
    color: colors.text,
  },
  historyMsg: {
    fontSize: 14,
    color: colors.primary,
  },
  historyTime: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Helper: produce an rgba string from accent hex with alpha
const accentRgba = (alpha: number) => {
  try {
    const hex = colors.accent.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch (e) {
    return `rgba(34,197,94,${alpha})`;
  }
};

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
        const raw = await getAsyncStorage().getItem(HISTORY_KEY);
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
      
      // Cross-check with user profile for risks (BASIC VERSION)
      if (profile && result && result.label) {
        const medName = (result.label.brand_name || result.label.generic_name || '').toLowerCase();
        
        // Check allergies
        if (profile.allergies && profile.allergies.length > 0) {
          for (const allergy of profile.allergies) {
            if (medName.includes(allergy.toLowerCase())) {
              risk += `⚠️ Allergy risk: ${allergy}.\n`;
            }
          }
        }
        
        // Check medical conditions (simple keyword match)
        if (profile.medical_conditions && profile.medical_conditions.length > 0) {
          for (const cond of profile.medical_conditions) {
            if (result.label.contraindications && result.label.contraindications.toLowerCase().includes(cond.toLowerCase())) {
              risk += `⚠️ Condition risk: ${cond}.\n`;
            }
          }
        }
        
        // Check current medications (simple keyword match)
        if (profile.medications && profile.medications.length > 0) {
          for (const med of profile.medications) {
            if (result.label.drug_interactions && result.label.drug_interactions.toLowerCase().includes(med.toLowerCase())) {
              risk += `⚠️ Interaction risk: ${med}.\n`;
            }
          }
        }
        
        if (risk) {
          setRiskWarning(risk.trim());
          setLastRisk(risk.trim());
        }
      }
    } catch (e: any) {
      err = e?.message || 'Verification failed. Please try scanning again.';
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
        getAsyncStorage().setItem(HISTORY_KEY, JSON.stringify(updated)).catch((e: any) => {
          // eslint-disable-next-line no-console
          console.warn('Failed to save scan history:', e);
        });
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

  const heroHeader = (
    <LinearGradient colors={colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <Text style={styles.heroTitle}>Medication scanner</Text>
      <Text style={styles.heroSubtitle}>Verify authenticity and surface risks from your medical ID.</Text>
      <View style={styles.heroStats}>
        <View style={styles.statChip}>
          <Text style={styles.statText}>{history.length} total scans</Text>
        </View>
        {(profile?.allergies?.length ?? 0) > 0 ? (
          <View style={styles.statChip}>
            <Text style={styles.statText}>{profile?.allergies?.length} allergies monitored</Text>
          </View>
        ) : null}
        {(profile?.medications?.length ?? 0) > 0 ? (
          <View style={styles.statChip}>
            <Text style={styles.statText}>{profile?.medications?.length} meds tracked</Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );

  if (!permission?.granted) {
    return (
      <ScreenContainer header={heroHeader}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'successful') return item.verification && (item.verification.verified || item.verification.recall || item.verification.expired);
    if (filter === 'unsuccessful') return !item.verification || (!item.verification.verified && !item.verification.recall && !item.verification.expired);
    if (filter === 'risk') return item.risk && item.risk.length > 0;
    return true;
  });

  const filterOptions: { label: string; value: typeof filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Successful', value: 'successful' },
    { label: 'Unsuccessful', value: 'unsuccessful' },
    { label: 'Risk matched', value: 'risk' },
  ];

  const renderIdle = () => (
    <Card style={styles.scanCard}>
      <Text style={styles.sectionTitle}>Align the barcode inside the frame</Text>
      <Text style={styles.scanInstructions}>We automatically detect medication barcodes and GS1 data matrix codes.</Text>
      <View style={styles.cameraShell}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          autofocus={'on' as any}
          onBarcodeScanned={scanned ? undefined : (event: { data: string; type: string }) => {
            if (!barcodeDetected) setBarcodeDetected(true);
            handleBarCodeScanned(event);
          }}
        />
        <View
          style={[
            styles.overlayFrame,
            {
              borderColor: showScanEffect ? colors.accent : barcodeDetected ? colors.accent : 'rgba(255,255,255,0.7)',
              backgroundColor: showScanEffect ? accentRgba(0.12) : barcodeDetected ? accentRgba(0.05) : 'transparent',
              borderStyle: 'dashed',
              borderWidth: pulse ? 3 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.overlayText,
              { color: showScanEffect ? colors.accent : barcodeDetected ? colors.accent : '#fff' },
            ]}
          >
            {showScanEffect ? 'Scan complete!' : barcodeDetected ? 'Barcode detected' : 'Hold steady'}
          </Text>
        </View>
      </View>
      {guidance ? <Text style={styles.guidance}>{guidance}</Text> : null}
    </Card>
  );

  const renderHistory = history.length > 0 ? (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Recent scans</Text>
        <Text style={styles.metaText}>{filteredHistory.length} shown</Text>
      </View>
      <View style={styles.filterRow}>
        {filterOptions.map(opt => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={filter === opt.value}
            onPress={() => setFilter(opt.value)}
          />
        ))}
      </View>
      <FlatList
        data={filteredHistory}
        keyExtractor={(item, idx) => `${item.timestamp}_${item.data}_${idx}`}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyType}>{item.type}</Text>
            <Text style={styles.historyData}>{item.data}</Text>
            <Text style={styles.historyMsg}>{getUserMessage(item.verification, item.error)}</Text>
            {item.risk ? <Text style={styles.riskText}>⚠️ {item.risk}</Text> : null}
            <Text style={styles.historyTime}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
      />
    </Card>
  ) : null;

  const renderResult = () => (
    <Card style={styles.resultCard}>
      <Text style={styles.sectionTitle}>Scan analysis</Text>
      <Text style={styles.metaText}>Type: {scanData?.type ?? 'Unknown'}</Text>
      <Text style={styles.metaText}>Raw data: {scanData?.data ?? '—'}</Text>
      <Text style={styles.userMessage}>{getUserMessage(verification, error)}</Text>
      {riskWarning ? (
        <View style={styles.riskCard}>
          <Text style={styles.riskTitle}>Medication risk</Text>
          <Text style={styles.riskText}>{riskWarning}</Text>
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {verification ? (
            <View style={{ gap: spacing.md }}>
              <View style={styles.analysisCard}>
                {verification.verified ? <Text style={styles.positiveText}>Authenticity verified</Text> : null}
                {verification.expired ? <Text style={styles.negativeText}>Expired — do not use</Text> : null}
                {verification.recall ? (
                  <View>
                    <Text style={styles.negativeText}>Recall alert</Text>
                    <Text style={styles.metaText}>{verification.recall.reason_for_recall}</Text>
                    <Text style={styles.metaText}>Status: {verification.recall.status}</Text>
                  </View>
                ) : null}
                {verification.message ? <Text style={styles.metaText}>{verification.message}</Text> : null}
              </View>
              {(verification.labelInfo || verification.label) ? (
                <LabelInfoView labelInfo={verification.labelInfo} label={verification.label} />
              ) : null}
              {(verification.labelInfo || verification.webscraperInfo) ? (
                <View style={styles.analysisCard}>
                  {verification.labelInfo ? (
                    <>
                      <Text style={styles.sectionTitle}>openFDA insights</Text>
                      <Text style={styles.metaText}>Indications: {verification.labelInfo.indications || 'N/A'}</Text>
                      <Text style={styles.metaText}>Dosage: {verification.labelInfo.dosage || 'N/A'}</Text>
                      <Text style={styles.metaText}>Adverse reactions: {verification.labelInfo.sideEffects || 'N/A'}</Text>
                    </>
                  ) : null}
                  {verification.webscraperInfo ? (
                    <>
                      <Text style={styles.sectionTitle}>Supplemental data</Text>
                      {verification.webscraperInfo.indications ? (
                        <Text style={styles.metaText}>Indications: {verification.webscraperInfo.indications}</Text>
                      ) : null}
                      {verification.webscraperInfo.dosage ? (
                        <Text style={styles.metaText}>Dosage: {verification.webscraperInfo.dosage}</Text>
                      ) : null}
                      {verification.webscraperInfo.sideEffects ? (
                        <Text style={styles.metaText}>Side effects: {verification.webscraperInfo.sideEffects}</Text>
                      ) : null}
                      {!verification.webscraperInfo.indications && !verification.webscraperInfo.dosage && !verification.webscraperInfo.sideEffects ? (
                        <Text style={styles.metaText}>{JSON.stringify(verification.webscraperInfo, null, 2)}</Text>
                      ) : null}
                    </>
                  ) : null}
                </View>
              ) : null}
              {!verification.verified && !verification.recall && !verification.expired ? (
                <Text style={styles.metaText}>No authenticity data available. Please exercise caution.</Text>
              ) : null}
            </View>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </>
      )}
      <View style={styles.resultButtons}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            setScanned(false);
            setScanData(null);
            setVerification(null);
            setError(null);
            setLoading(false);
            setRiskWarning(null);
          }}
        >
          <Text style={styles.secondaryText}>Scan again</Text>
        </Pressable>
        {verification ? (
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              try {
                await saveMedication({
                  code: scanData.data,
                  type: scanData.type,
                  labelInfo: verification.labelInfo,
                  recall: verification.recall,
                  timestamp: Date.now(),
                });
                // Show success feedback in a proper way
                setVerification({ ...verification, message: '✓ Saved to My Medications!' });
                setTimeout(() => {
                  setScanned(false);
                  setScanData(null);
                  setVerification(null);
                }, 1500);
              } catch (e) {
                setError('Failed to save medication. Please try again.');
              }
            }}
          >
            <Text style={styles.primaryText}>Save medication</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.content}
      header={heroHeader}
    >
      {!scanned && !scanData ? renderIdle() : renderResult()}
      {renderHistory}
    </ScreenContainer>
  );
};

export default BarcodeScanner;
   
