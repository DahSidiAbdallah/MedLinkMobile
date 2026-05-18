import { saveMedication } from '../utils/myMedications';
import { checkDrugSafety, type SafetyCheck, type InteractionSeverity } from '../utils/drugInteractionChecker';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
// Guard AsyncStorage import to avoid module-eval crashes on some runtimes
let AsyncStorage: any = null;
function getAsyncStorage() {
  if (AsyncStorage) return AsyncStorage;
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
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
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ensureFocus } from '../utils/cameraHelper';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Chip from '../components/Chip';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, shadow, radius } from '../theme';
import { verifyScannedCode, VerificationResult } from '../utils/verification';
import { parseGs1DataMatrix } from '../utils/gs1';
import { normalizeBarcode, parseGs1AIs, validateEAN13CheckDigit, getGtinFromAIs } from '../core/barcode';
import { getTelemetryService, makeScanTelemetryEvent } from '../core/telemetryService';
import { hapticSuccess } from '../utils/haptics';
import LabelInfoView from '../components/LabelInfoView';

// ── Types ────────────────────────────────────────────────────────────────────

type ScanHistoryItem = {
  timestamp: number;
  data: string;
  type: string;
  verification: VerificationResult | null;
  error: string | null;
  risk?: string | null;
};

type RiskItem = {
  type: 'allergy' | 'condition' | 'interaction';
  label: string;
  detail: string;
  severity?: InteractionSeverity;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const getUserMessage = (verification: VerificationResult | null, error: string | null, t: any): string => {
  if (error) return t('scanner.scanFailed', 'Scan failed. Please try again.');
  if (!verification) return '';
  if (verification.verified) return t('scanner.productAuthentic', 'This product is authentic and safe.');
  if (verification.expired) return t('scanner.productExpired', 'Warning: This product is expired. Do not use.');
  if (verification.recall) return t('scanner.productRecalled', 'Recall alert: This product has been recalled.');
  return t('scanner.noRecallData', 'No authenticity data found for this product.');
};

function parseCodeType(data: string, type: string) {
  if (/^\d{14}$/.test(data)) return { codeType: 'GTIN-14', parsed: data };
  if (/^\d{13}$/.test(data)) return { codeType: 'GTIN-13', parsed: data };
  if (/^\d{12}$/.test(data)) return { codeType: 'GTIN-12', parsed: data };
  if (/^\d{8}$/.test(data)) return { codeType: 'GTIN-8', parsed: data };
  if (/^\d{11}$/.test(data)) return { codeType: 'NDC-11', parsed: data };
  if (/^\d{10}$/.test(data)) return { codeType: 'NDC-10', parsed: data };
  if (type === 'datamatrix') {
    const gs1 = parseGs1DataMatrix(data);
    if (gs1) return { codeType: 'GS1 DataMatrix', parsed: gs1.gtin, extra: gs1 };
    return { codeType: 'DataMatrix', parsed: data };
  }
  if (type === 'qr') return { codeType: 'QR Code', parsed: data };
  if (type === 'pdf417') return { codeType: 'PDF417', parsed: data };
  return { codeType: 'Unknown', parsed: data };
}

/** Parse profile risks into a structured list for display.
 *  Handles both the raw openFDA label shape (openfda.brand_name, contraindications array)
 *  and the simplified labelInfo shape. */
function buildRiskItems(profile: Profile, result: VerificationResult, t: any): RiskItem[] {
  const risks: RiskItem[] = [];
  const label = result.label;
  const labelInfo = result.labelInfo;

  // Build searchable text from all available drug data sources
  const brandName = (
    label?.openfda?.brand_name?.[0] ||
    label?.brand_name ||
    labelInfo?.indications ||
    ''
  ).toLowerCase();

  const genericName = (
    label?.openfda?.generic_name?.[0] ||
    label?.generic_name ||
    ''
  ).toLowerCase();

  const medName = `${brandName} ${genericName}`;

  // contraindications is a top-level array in openFDA label response
  const contraindicationsRaw = Array.isArray(label?.contraindications)
    ? label.contraindications.join(' ')
    : (label?.contraindications || '');
  const contraindications = contraindicationsRaw.toLowerCase();

  // drug_interactions is also a top-level array
  const interactionsRaw = Array.isArray(label?.drug_interactions)
    ? label.drug_interactions.join(' ')
    : (label?.drug_interactions || '');
  const interactions = interactionsRaw.toLowerCase();

  // warnings also useful for condition checks
  const warningsRaw = Array.isArray(label?.warnings_and_cautions)
    ? label.warnings_and_cautions.join(' ')
    : (label?.warnings_and_cautions || label?.warnings || '');
  const warnings = warningsRaw.toLowerCase();

  if (!medName.trim() && !contraindications && !interactions) return risks;

  // ── Allergy check ─────────────────────────────────────────────
  if (profile.allergies) {
    for (const allergy of profile.allergies) {
      const a = allergy.toLowerCase();
      if (medName.includes(a) || contraindications.includes(a) || warnings.includes(a)) {
        risks.push({
          type: 'allergy',
          label: t('scanner.allergyRisk', 'Allergy Risk'),
          detail: `${t('scanner.allergyTo', 'Your profile lists an allergy to')} "${allergy}".`,
        });
      }
    }
  }

  // ── Medical condition contraindication check ───────────────────
  if (profile.medical_conditions) {
    for (const cond of profile.medical_conditions) {
      const c = cond.toLowerCase();
      if (contraindications.includes(c) || warnings.includes(c)) {
        risks.push({
          type: 'condition',
          label: t('scanner.conditionRisk', 'Contraindication'),
          detail: `${t('scanner.contraindicatedFor', 'This medication may be contraindicated for your condition:')} "${cond}".`,
        });
      }
    }
  }

  // ── Drug interaction check ─────────────────────────────────────
  if (profile.medications) {
    for (const med of profile.medications) {
      const m = med.toLowerCase();
      if (interactions.includes(m)) {
        risks.push({
          type: 'interaction',
          label: t('scanner.interactionRisk', 'Drug Interaction'),
          detail: `${t('scanner.interactsWith', 'Potential interaction with your current medication:')} "${med}".`,
        });
      }
    }
  }

  return risks;
}

const HISTORY_KEY = 'scan_history_v1';

// ── Status badge config ───────────────────────────────────────────────────────

function getStatusConfig(verification: VerificationResult | null, error: string | null, t: any) {
  if (error) return { icon: 'close-circle' as const, color: colors.danger, bg: colors.dangerLight, label: t('scanner.error', 'Error') };
  if (!verification) return null;
  if (verification.verified) return { icon: 'checkmark-circle' as const, color: colors.success, bg: colors.successLight, label: t('scanner.authentic', 'Authentic') };
  if (verification.expired) return { icon: 'time' as const, color: colors.warn, bg: colors.warnLight, label: t('scanner.expired', 'Expired') };
  if (verification.recall) return { icon: 'warning' as const, color: colors.danger, bg: colors.dangerLight, label: t('scanner.recalled', 'Recalled') };
  return { icon: 'help-circle' as const, color: colors.textTertiary, bg: colors.bgSecondary, label: t('scanner.unknown', 'No Data') };
}

// ── Component ─────────────────────────────────────────────────────────────────

const BarcodeScanner: React.FC = () => {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<any>(null);
  const lastFrameTs = React.useRef<number | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState<any>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheck | null>(null);
  const [filter, setFilter] = useState<'all' | 'successful' | 'risk'>('all');
  const [pulse, setPulse] = useState(true);
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [showScanEffect, setShowScanEffect] = useState(false);
  const [guidance, setGuidance] = useState<string | null>(null);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeout = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation for scan frame
  useEffect(() => {
    if (!scanned && !scanData) {
      const animate = () => {
        setPulse(p => !p);
        pulseTimeout.current = setTimeout(animate, 800);
      };
      animate();
      return () => { if (pulseTimeout.current) clearTimeout(pulseTimeout.current); };
    } else {
      setPulse(false);
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    }
  }, [scanned, scanData]);

  useEffect(() => {
    if (!permission?.granted) requestPermission();

    async function loadProfile() {
      const userProfile = await fetchUserProfile();
      setProfile(userProfile);
    }
    async function loadHistory() {
      try {
        const raw = await getAsyncStorage().getItem(HISTORY_KEY);
        if (raw) setHistory(JSON.parse(raw));
      } catch {}
    }
    loadProfile();
    loadHistory();
    ensureFocus(cameraRef).catch(() => {});
  }, [permission]);

  // Guidance messages while idle
  useEffect(() => {
    if (!scanned && !scanData) {
      setGuidance(null);
      setBarcodeDetected(false);
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      scanTimeout.current = setTimeout(() => {
        setGuidance(t('scanner.centerBarcode', 'Center the barcode in the frame.'));
      }, 3000);
    } else {
      setGuidance(null);
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    }
    return () => { if (scanTimeout.current) clearTimeout(scanTimeout.current); };
  }, [scanned, scanData]);

  const handleBarCodeScanned = async ({ data, type }: { data: string; type: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanData({ data, type });
    setLoading(true);
    setError(null);
    setVerification(null);
    setRisks([]);
    setSafetyCheck(null);
    setShowScanEffect(true);

    let result: VerificationResult | null = null;
    let err: string | null = null;
    let riskItems: RiskItem[] = [];
    const telemetryStart = Date.now();
    let telemetry: any = { scanType: type };

    try {
      const norm = normalizeBarcode(data);
      if (norm.gtin) telemetry.gtin = norm.gtin;
      telemetry.normalizedType = norm.type;

      if (norm.type === 'EAN' && norm.gtin) {
        telemetry.eanCheck = validateEAN13CheckDigit(norm.gtin);
      }
      if (norm.type === 'DATAMATRIX') {
        const ais = parseGs1AIs(data);
        telemetry.gs1 = { ais };
        const extractedGtin = getGtinFromAIs(ais);
        if (extractedGtin) telemetry.gtin = extractedGtin;
      }

      result = await verifyScannedCode(data, type);
      setVerification(result);

      if (result && (result.verified || result.recall)) {
        try { await hapticSuccess(); } catch {}
      }
      telemetry.lookupSuccess = !!result;

      // Cross-examination against user profile — text matching (fast, offline)
      if (profile && result && result.label) {
        riskItems = buildRiskItems(profile, result, t);
        setRisks(riskItems);
      }

      // RxNorm drug-drug interaction check (real clinical data, async)
      if (profile && result) {
        const drugName =
          result.label?.openfda?.brand_name?.[0] ||
          result.label?.openfda?.generic_name?.[0] ||
          result.label?.brand_name ||
          result.label?.generic_name ||
          result.labelInfo?.indications?.split(' ').slice(0, 3).join(' ') ||
          '';
        if (drugName && (profile.medications?.length ?? 0) > 0) {
          try {
            const safety = await checkDrugSafety(drugName, profile.medications ?? []);
            setSafetyCheck(safety);
            // Merge RxNorm interactions into risk items (avoid duplicates)
            if (safety.interactions.length > 0) {
              const rxnormRisks: RiskItem[] = safety.interactions.map(inter => ({
                type: 'interaction' as const,
                label: t('scanner.interactionRisk', 'Drug Interaction'),
                detail: `${t('scanner.interactsWith', 'Potential interaction with your current medication:')} "${inter.medication}". ${inter.description}`,
                severity: inter.severity,
              }));
              setRisks(prev => {
                // Remove simple text-match interactions, replace with richer RxNorm ones
                const nonInteractionRisks = prev.filter(r => r.type !== 'interaction');
                return [...nonInteractionRisks, ...rxnormRisks];
              });
              riskItems = [...riskItems.filter(r => r.type !== 'interaction'), ...rxnormRisks];
            }
          } catch {
            // RxNorm check failed — keep text-match results
          }
        }
      }
    } catch (e: any) {
      err = e?.message || t('scanner.verificationFailed', 'Verification failed. Please try again.');
      setError(err);
      telemetry.errorCodes = ['verification_failed'];
    } finally {
      telemetry.decodeTimeMs = Date.now() - telemetryStart;
      const event = makeScanTelemetryEvent({
        scanType: telemetry.normalizedType || telemetry.scanType,
        decodeTimeMs: telemetry.decodeTimeMs,
        verificationTelemetry: telemetry,
        cacheHit: telemetry.cacheHit || false,
        sourceBadges: [],
        errorCodes: telemetry.errorCodes || [],
      });
      const svc = getTelemetryService();
      svc?.record(event as any);
      setLoading(false);
      setTimeout(() => setShowScanEffect(false), 600);

      const newItem: ScanHistoryItem = {
        timestamp: Date.now(),
        data,
        type,
        verification: result,
        error: err,
        risk: riskItems.length > 0 ? riskItems.map(r => r.detail).join('\n') : null,
      };
      setHistory(prev => {
        const updated = [newItem, ...prev];
        getAsyncStorage().setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    }
  };

  const resetScan = () => {
    setScanned(false);
    setScanData(null);
    setVerification(null);
    setError(null);
    setLoading(false);
    setRisks([]);
    setSafetyCheck(null);
  };

  // ── Permission denied state ───────────────────────────────────────────────

  if (!permission?.granted) {
    return (
      <ScreenContainer>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>{t('scanner.cameraRequired', 'Camera Access Required')}</Text>
          <Text style={styles.permissionSub}>{t('scanner.cameraPermission', 'Allow camera access to scan medication barcodes.')}</Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>{t('scanner.grantPermission', 'Grant Access')}</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ── Filter history ────────────────────────────────────────────────────────

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'successful') return !!(item.verification?.verified || item.verification?.recall || item.verification?.expired);
    if (filter === 'risk') return !!(item.risk && item.risk.length > 0);
    return true;
  });

  const filterOptions: { label: string; value: typeof filter }[] = [
    { label: t('scanner.all', 'All'), value: 'all' },
    { label: t('scanner.successful', 'Verified'), value: 'successful' },
    { label: t('scanner.riskMatched', 'Risk'), value: 'risk' },
  ];

  // ── Idle (camera) view ────────────────────────────────────────────────────

  const renderIdle = () => (
    <>
      {/* Camera card */}
      <View style={styles.cameraCard}>
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
          {/* Dark corners overlay */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.overlayTop} />
            <View style={styles.overlayRow}>
              <View style={styles.overlaySide} />
              {/* Scan frame */}
              <View style={[
                styles.scanFrame,
                barcodeDetected && styles.scanFrameActive,
                showScanEffect && styles.scanFrameSuccess,
              ]}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.cornerTL, barcodeDetected && styles.cornerActive]} />
                <View style={[styles.corner, styles.cornerTR, barcodeDetected && styles.cornerActive]} />
                <View style={[styles.corner, styles.cornerBL, barcodeDetected && styles.cornerActive]} />
                <View style={[styles.corner, styles.cornerBR, barcodeDetected && styles.cornerActive]} />
                {/* Scan line */}
                {!barcodeDetected && (
                  <View style={[styles.scanLine, { opacity: pulse ? 0.7 : 0.3 }]} />
                )}
                {barcodeDetected && (
                  <View style={styles.detectedBadge}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={styles.detectedText}>{t('scanner.barcodeDetected', 'Detected')}</Text>
                  </View>
                )}
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
        </View>

        {/* Guidance / instruction */}
        <View style={styles.cameraFooter}>
          <Ionicons
            name={barcodeDetected ? 'checkmark-circle' : 'scan-outline'}
            size={18}
            color={barcodeDetected ? colors.success : colors.textTertiary}
          />
          <Text style={[styles.cameraGuideText, barcodeDetected && { color: colors.success }]}>
            {showScanEffect
              ? t('scanner.scanComplete', 'Scan complete!')
              : barcodeDetected
              ? t('scanner.barcodeDetected', 'Barcode detected — processing...')
              : guidance || t('scanner.autoDetect', 'Align barcode within the frame')}
          </Text>
        </View>
      </View>

      {/* Profile context */}
      {profile && (
        <Card style={styles.profileContextCard}>
          <View style={styles.profileContextRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={styles.profileContextText}>
              {t('scanner.crossCheckActive', 'Cross-checking against your medical profile')}
            </Text>
          </View>
          <View style={styles.profileTagRow}>
            {(profile.allergies?.length ?? 0) > 0 && (
              <View style={styles.profileTag}>
                <Text style={styles.profileTagText}>{profile.allergies!.length} {t('scanner.allergies', 'allergies')}</Text>
              </View>
            )}
            {(profile.medications?.length ?? 0) > 0 && (
              <View style={styles.profileTag}>
                <Text style={styles.profileTagText}>{profile.medications!.length} {t('scanner.meds', 'medications')}</Text>
              </View>
            )}
            {(profile.medical_conditions?.length ?? 0) > 0 && (
              <View style={styles.profileTag}>
                <Text style={styles.profileTagText}>{profile.medical_conditions!.length} {t('scanner.conditions', 'conditions')}</Text>
              </View>
            )}
          </View>
        </Card>
      )}
    </>
  );

  // ── Result view ───────────────────────────────────────────────────────────

  const renderResult = () => {
    const statusConfig = getStatusConfig(verification, error, t);
    const { codeType } = parseCodeType(scanData?.data ?? '', scanData?.type ?? '');

    return (
      <View style={{ gap: spacing.lg }}>
        {/* Status banner */}
        {statusConfig && (
          <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={28} color={statusConfig.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              <Text style={styles.statusMessage}>{getUserMessage(verification, error, t)}</Text>
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('scanner.verifying', 'Verifying medication...')}</Text>
          </View>
        )}

        {/* Scan metadata */}
        <Card style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t('scanner.format', 'Format')}</Text>
              <Text style={styles.metaValue}>{codeType}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t('scanner.code', 'Code')}</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{scanData?.data ?? '—'}</Text>
            </View>
          </View>
        </Card>

        {/* Risk alerts from profile cross-examination */}
        {risks.length > 0 && (
          <View style={styles.riskContainer}>
            <View style={styles.riskHeader}>
              <Ionicons name="warning" size={18} color={colors.danger} />
              <Text style={styles.riskHeaderText}>{t('scanner.profileRisks', 'Profile Risk Alerts')}</Text>
              <View style={styles.riskCount}>
                <Text style={styles.riskCountText}>{risks.length}</Text>
              </View>
            </View>
            {safetyCheck?.apiAvailable && (
              <View style={styles.rxnormBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color={colors.success} />
                <Text style={styles.rxnormBadgeText}>{t('scanner.rxnormVerified', 'Verified via NIH RxNorm Interaction Database')}</Text>
              </View>
            )}
            {risks.map((risk, idx) => {
              const severityColor =
                risk.severity === 'major' ? colors.danger :
                risk.severity === 'moderate' ? colors.warn :
                risk.severity === 'minor' ? colors.textSecondary :
                undefined;
              return (
                <View key={idx} style={[
                  styles.riskItem,
                  risk.type === 'allergy' && { borderLeftColor: colors.danger },
                  risk.type === 'condition' && { borderLeftColor: colors.warn },
                  risk.type === 'interaction' && { borderLeftColor: severityColor ?? colors.secondary },
                ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[
                      styles.riskTypeBadge,
                      risk.type === 'allergy' && { backgroundColor: colors.dangerLight },
                      risk.type === 'condition' && { backgroundColor: colors.warnLight },
                      risk.type === 'interaction' && { backgroundColor: colors.secondary100 },
                    ]}>
                      <Text style={[
                        styles.riskTypeText,
                        risk.type === 'allergy' && { color: colors.danger },
                        risk.type === 'condition' && { color: colors.warn },
                        risk.type === 'interaction' && { color: colors.secondary },
                      ]}>
                        {risk.label}
                      </Text>
                    </View>
                    {risk.severity && risk.severity !== 'unknown' && (
                      <View style={[
                        styles.severityBadge,
                        { backgroundColor: severityColor ?? colors.textTertiary },
                      ]}>
                        <Text style={styles.severityText}>
                          {risk.severity.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.riskDetail}>{risk.detail}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recall details */}
        {verification?.recall && !loading && (
          <Card style={styles.recallCard}>
            <View style={styles.recallHeader}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.recallTitle}>{t('scanner.recallDetails', 'Recall Details')}</Text>
            </View>
            {verification.recall.reason_for_recall && (
              <Text style={styles.recallText}>{verification.recall.reason_for_recall}</Text>
            )}
            {verification.recall.status && (
              <View style={styles.recallStatusRow}>
                <Text style={styles.recallStatusLabel}>{t('scanner.status', 'Status')}:</Text>
                <Text style={styles.recallStatusValue}>{verification.recall.status}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Drug label info */}
        {!loading && (verification?.labelInfo || verification?.label) && (
          <LabelInfoView labelInfo={verification.labelInfo} label={verification.label} />
        )}

        {/* Drug Profile Card — indications, dosage, side effects */}
        {!loading && (verification?.labelInfo || verification?.webscraperInfo) && (() => {
          const info = verification.labelInfo || verification.webscraperInfo;
          const hasInfo = info?.indications || info?.dosage || info?.sideEffects;
          if (!hasInfo) return null;
          return (
            <Card style={styles.drugProfileCard}>
              <View style={styles.drugProfileHeader}>
                <View style={styles.drugProfileIcon}>
                  <MaterialCommunityIcons name="pill" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drugProfileTitle}>{t('scanner.drugProfile', 'Drug Profile')}</Text>
                  <Text style={styles.drugProfileSub}>
                    {verification?.webscraperInfo
                      ? t('scanner.sourceOpenFdaWeb', 'openFDA + Web data')
                      : t('scanner.sourceOpenFda', 'openFDA drug label')}
                  </Text>
                </View>
              </View>

              {info?.indications && (
                <View style={styles.drugProfileSection}>
                  <View style={styles.drugProfileSectionLabel}>
                    <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
                    <Text style={[styles.infoLabel, { color: colors.success }]}>{t('scanner.indications', 'What it\'s used for')}</Text>
                  </View>
                  <Text style={styles.drugProfileText} numberOfLines={5}>{info.indications}</Text>
                </View>
              )}

              {info?.dosage && (
                <View style={styles.drugProfileSection}>
                  <View style={styles.drugProfileSectionLabel}>
                    <Ionicons name="timer-outline" size={13} color={colors.primary} />
                    <Text style={[styles.infoLabel, { color: colors.primary }]}>{t('scanner.dosage', 'Dosage')}</Text>
                  </View>
                  <Text style={styles.drugProfileText} numberOfLines={5}>{info.dosage}</Text>
                </View>
              )}

              {info?.sideEffects && (
                <View style={[styles.drugProfileSection, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <View style={styles.drugProfileSectionLabel}>
                    <Ionicons name="alert-circle-outline" size={13} color={colors.warn} />
                    <Text style={[styles.infoLabel, { color: colors.warn }]}>{t('scanner.sideEffects', 'Side Effects')}</Text>
                  </View>
                  <Text style={styles.drugProfileText} numberOfLines={5}>{info.sideEffects}</Text>
                </View>
              )}

              {verification?.webscraperInfo && verification?.labelInfo && (
                <View style={[styles.infoSectionHeader, { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }]}>
                  <Ionicons name="globe-outline" size={14} color={colors.accent} />
                  <Text style={[styles.infoSectionTitle, { color: colors.accent, fontSize: 12 }]}>{t('scanner.supplementalData', 'Additional web-sourced data available')}</Text>
                </View>
              )}
            </Card>
          );
        })()}

        {error && !loading && (
          <View style={styles.errorCard}>
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.btnSecondary} onPress={resetScan}>
            <Ionicons name="scan-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.btnSecondaryText}>{t('scanner.scanAgain', 'Scan Again')}</Text>
          </Pressable>
          {verification && !loading && (
            <Pressable
              style={styles.btnPrimary}
              onPress={async () => {
                try {
                  await saveMedication({
                    code: scanData.data,
                    type: scanData.type,
                    labelInfo: verification.labelInfo,
                    recall: verification.recall,
                    timestamp: Date.now(),
                  });
                  setVerification({ ...verification, message: t('scanner.savedToMedications', 'Saved to My Medications') });
                  setTimeout(resetScan, 1500);
                } catch (e) {
                  setError(t('scanner.failedToSave', 'Failed to save medication.'));
                }
              }}
            >
              <Ionicons name="bookmark-outline" size={16} color="#fff" />
              <Text style={styles.btnPrimaryText}>{t('scanner.saveMedication', 'Save Medication')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ── History list ──────────────────────────────────────────────────────────

  const renderHistory = () => {
    if (history.length === 0) return null;
    return (
      <Card style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{t('scanner.recentScans', 'Recent Scans')}</Text>
          <Text style={styles.historyStat}>{history.length} {t('scanner.total', 'total')}</Text>
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
        {filteredHistory.map((item, idx) => {
          const isVerified = !!(item.verification?.verified);
          const hasRecall = !!(item.verification?.recall);
          const hasRisk = !!(item.risk && item.risk.length > 0);
          return (
            <View key={`${item.timestamp}_${idx}`} style={[
              styles.historyItem,
              isVerified && { borderLeftColor: colors.success },
              hasRecall && { borderLeftColor: colors.danger },
              hasRisk && { borderLeftColor: colors.warn },
            ]}>
              <View style={styles.historyItemHeader}>
                <Ionicons
                  name={isVerified ? 'checkmark-circle' : hasRecall ? 'warning' : 'help-circle'}
                  size={14}
                  color={isVerified ? colors.success : hasRecall ? colors.danger : colors.textTertiary}
                />
                <Text style={styles.historyItemType}>{item.type.toUpperCase()}</Text>
                <Text style={styles.historyItemTime}>{new Date(item.timestamp).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.historyItemCode} numberOfLines={1}>{item.data}</Text>
              <Text style={[
                styles.historyItemMsg,
                isVerified && { color: colors.success },
                hasRecall && { color: colors.danger },
              ]} numberOfLines={2}>
                {getUserMessage(item.verification, item.error, t)}
              </Text>
              {hasRisk && (
                <View style={styles.historyItemRiskRow}>
                  <Ionicons name="warning-outline" size={12} color={colors.warn} />
                  <Text style={styles.historyItemRisk} numberOfLines={2}>{item.risk}</Text>
                </View>
              )}
            </View>
          );
        })}
      </Card>
    );
  };

  // ── Page header ───────────────────────────────────────────────────────────

  const pageHeader = (
    <View style={styles.pageHeader}>
      <View>
        <Text style={styles.pageTitle}>{t('scanner.medicationScanner', 'Medication Scanner')}</Text>
        <Text style={styles.pageSub}>{t('scanner.verifyAuthenticity', 'Verify, check safety, cross-examine with your profile')}</Text>
      </View>
      <View style={styles.pageStatRow}>
        {history.length > 0 && (
          <View style={styles.pageStat}>
            <Text style={styles.pageStatValue}>{history.length}</Text>
            <Text style={styles.pageStatLabel}>{t('scanner.scans', 'scans')}</Text>
          </View>
        )}
        {(profile?.allergies?.length ?? 0) > 0 && (
          <View style={[styles.pageStat, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.pageStatValue, { color: colors.danger }]}>{profile!.allergies!.length}</Text>
            <Text style={[styles.pageStatLabel, { color: colors.danger }]}>{t('scanner.allergies', 'allergies')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>
      {pageHeader}
      {!scanned && !scanData ? renderIdle() : renderResult()}
      {renderHistory()}
    </ScreenContainer>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY_DARK = 'rgba(0,0,0,0.55)';

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 110,
    gap: spacing.lg,
    paddingTop: spacing.md,
  },

  // Page header
  pageHeader: {
    gap: spacing.sm,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 28,
  },
  pageSub: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textTertiary,
    lineHeight: 18,
  },
  pageStatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  pageStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary50,
    borderRadius: radius.pill,
  },
  pageStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  pageStatLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.primary,
  },

  // Camera
  cameraCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...shadow.card,
  },
  cameraShell: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  overlayTop: {
    backgroundColor: OVERLAY_DARK,
    height: '20%',
  },
  overlayRow: {
    flexDirection: 'row',
    height: '55%',
  },
  overlaySide: {
    backgroundColor: OVERLAY_DARK,
    flex: 1,
  },
  overlayBottom: {
    backgroundColor: OVERLAY_DARK,
    flex: 1,
  },
  scanFrame: {
    width: '72%',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanFrameActive: {},
  scanFrameSuccess: {},

  // Corner markers
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  cornerActive: { borderColor: colors.success },
  scanLine: {
    position: 'absolute',
    top: '45%',
    left: 6,
    right: 6,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  detectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  cameraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
  },
  cameraGuideText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
    flex: 1,
  },

  // Profile context
  profileContextCard: {
    gap: spacing.sm,
  },
  profileContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileContextText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
    flex: 1,
  },
  profileTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  profileTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.primary100,
    borderRadius: radius.pill,
  },
  profileTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },

  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    height: 44,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xxl,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  statusMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Metadata card
  metaCard: {
    borderRadius: radius.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.line,
    marginHorizontal: spacing.lg,
  },

  // Risks
  riskContainer: {
    borderRadius: radius.xl,
    backgroundColor: colors.dangerLight,
    padding: spacing.lg,
    gap: spacing.md,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  riskHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
    flex: 1,
  },
  riskCount: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  riskItem: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  riskTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerLight,
  },
  riskTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  riskDetail: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  rxnormBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  rxnormBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.success,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Recall card
  recallCard: {
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.xl,
  },
  recallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recallTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
  recallText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  recallStatusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  recallStatusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  recallStatusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },

  // Drug profile card
  drugProfileCard: {
    gap: spacing.md,
  },
  drugProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  drugProfileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drugProfileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  drugProfileSub: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
    marginTop: 1,
  },
  drugProfileSection: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  drugProfileSectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  drugProfileText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },

  // Info sections
  infoCard: {
    gap: spacing.sm,
  },
  infoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  infoRow: {
    gap: 4,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgSecondary,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // History
  historyCard: {
    gap: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  historyStat: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  historyItem: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.line,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyItemType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    flex: 1,
  },
  historyItemTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  historyItemCode: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  historyItemMsg: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  historyItemRiskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  historyItemRisk: {
    flex: 1,
    fontSize: 12,
    color: colors.warn,
    lineHeight: 16,
  },
});

export default BarcodeScanner;
