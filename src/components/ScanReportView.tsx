import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ScanReport } from '../scan';
import type { Severity, Verdict } from '../scan/assess';
import { colors, spacing, radius } from '../theme';

const VERDICT_STYLE: Record<Verdict, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }> = {
  danger: { icon: 'close-circle', color: colors.danger, bg: colors.dangerLight },
  warning: { icon: 'warning', color: colors.warn, bg: colors.warnLight },
  ok: { icon: 'shield-checkmark', color: colors.success, bg: colors.successLight },
  unknown: { icon: 'help-circle', color: colors.textSecondary, bg: colors.bgSecondary },
};

const SEVERITY_STYLE: Record<Severity, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  critical: { icon: 'alert-circle', color: colors.danger },
  high: { icon: 'warning-outline', color: colors.warn },
  medium: { icon: 'information-circle-outline', color: colors.warn },
  info: { icon: 'information-circle-outline', color: colors.textTertiary },
};

export function useCountryName() {
  const { t, i18n } = useTranslation();
  return (iso?: string) => {
    if (!iso) return '';
    const key = `countries.${iso}`;
    const translated = t(key, { defaultValue: '' });
    if (translated) return translated;
    try {
      const DN = (Intl as any).DisplayNames;
      if (DN) return new DN([i18n.language], { type: 'region' }).of(iso) ?? iso;
    } catch {}
    return iso;
  };
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ScanReportView({ report }: { report: ScanReport }) {
  const { t, i18n } = useTranslation();
  const countryName = useCountryName();
  const { assessment, registry, parsed } = report;
  const v = VERDICT_STYLE[assessment.verdict];
  const visibleSignals = assessment.signals.filter(s => s.id !== 'registered');

  const fmtDate = (d?: Date) => {
    if (!d) return undefined;
    try { return d.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }); }
    catch { return d.toISOString().slice(0, 10); }
  };
  const signalParams = (params?: Record<string, string | number>) => ({
    ...params,
    country: params?.country ? countryName(String(params.country)) : '',
  });

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Verdict */}
      <View style={[styles.verdict, { backgroundColor: v.bg }]}>
        <Ionicons name={v.icon} size={30} color={v.color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.verdictTitle, { color: v.color }]}>{t(`scanner.verdict.${assessment.verdict}.title`)}</Text>
          <Text style={styles.verdictText}>{t(`scanner.verdict.${assessment.verdict}.detail`)}</Text>
        </View>
      </View>

      {/* Product identity */}
      {(report.productName || parsed.gtin) && (
        <View style={styles.card}>
          {report.productName ? <Text style={styles.productName}>{report.productName}</Text> : null}
          <Row label={t('scanner.report.holder')} value={registry?.holder} />
          <Row label={t('scanner.report.substances')} value={registry?.substances.join(', ').toLowerCase()} />
          <Row
            label={t('scanner.report.registeredIn')}
            value={registry ? `${countryName(registry.country)} — ${registry.source.split('—')[0].trim()}` : undefined}
          />
          <Row
            label={t('scanner.report.barcodeIssuedIn')}
            value={parsed.gs1Country && parsed.gs1Country !== 'RESTRICTED' ? countryName(parsed.gs1Country) : undefined}
          />
          <Row label={t('scanner.report.expiry')} value={fmtDate(parsed.expiry)} />
          <Row label={t('scanner.report.lot')} value={parsed.lot} />
          <Row label={t('scanner.report.serial')} value={parsed.serial} />
          {report.clone && report.clone.totalScans > 0 ? (
            <Row label={t('scanner.report.scansOfThisBox')} value={String(report.clone.totalScans)} />
          ) : null}
        </View>
      )}

      {/* Findings */}
      {visibleSignals.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('scanner.report.findings')}</Text>
          {visibleSignals.map((s, i) => {
            const st = SEVERITY_STYLE[s.severity];
            const params = signalParams(s.params);
            return (
              <View key={`${s.id}-${i}`} style={[styles.signal, i > 0 && styles.signalDivider]}>
                <Ionicons name={st.icon} size={20} color={st.color} style={{ marginTop: 1 }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.signalTitle}>{t(`scanner.signals.${s.id}.title`, params)}</Text>
                  <Text style={styles.signalDetail}>{t(`scanner.signals.${s.id}.detail`, params)}</Text>
                  {s.url ? (
                    <Pressable onPress={() => Linking.openURL(s.url!)} hitSlop={8}>
                      <Text style={styles.link}>{t('scanner.report.viewSource')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.disclaimer}>{t('scanner.report.disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xxl,
  },
  verdictTitle: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
  verdictText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  productName: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 22, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  rowLabel: { width: 118, fontSize: 12, fontWeight: '500', color: colors.textTertiary, lineHeight: 18 },
  rowValue: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signal: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  signalDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  signalTitle: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  signalDetail: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary, marginTop: 4 },
  disclaimer: { fontSize: 12, color: colors.textTertiary, lineHeight: 17, textAlign: 'center', paddingHorizontal: spacing.md },
});
