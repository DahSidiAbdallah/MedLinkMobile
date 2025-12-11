import React from 'react';
import { ScrollView, View, ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme';

type ScreenContainerProps = {
  children: React.ReactNode;
  /** Set true to wrap children in a ScrollView */
  scrollable?: boolean;
  /** Optional padding override for the inner content */
  contentContainerStyle?: ViewStyle | ViewStyle[];
  /** Style applied to the non-scrollable container */
  style?: ViewStyle | ViewStyle[];
  /** Safe-area edges to include. Defaults to top/left/right */
  edges?: Edges;
  /** Whether to add default horizontal padding */
  withPadding?: boolean;
  /** Optional component rendered above the content (e.g. hero headers) */
  header?: React.ReactNode;
  /** Enable pull-to-refresh */
  refreshing?: boolean;
  /** Callback when user pulls to refresh */
  onRefresh?: () => void;
};

const basePadding: ViewStyle = {
  paddingHorizontal: spacing.xl,
  paddingTop: spacing.xl,
  paddingBottom: spacing.xl,
};

// Extra bottom padding to account for floating tab bar (64px height + 16px margin + safe area)
const TAB_BAR_OFFSET = 100;

export default function ScreenContainer({
  children,
  scrollable,
  contentContainerStyle,
  style,
  edges,
  withPadding = true,
  header,
  refreshing,
  onRefresh,
}: Readonly<ScreenContainerProps>) {
  const ContainerComponent = scrollable ? ScrollView : View;
  const defaultEdges: Edges = edges ?? ['top', 'left', 'right'];
  const paddingStyle = withPadding ? basePadding : undefined;

  const refreshControl = scrollable && onRefresh ? (
    <RefreshControl
      refreshing={refreshing ?? false}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  ) : undefined;

  return (
    <LinearGradient
      colors={[colors.bg, colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView
        edges={defaultEdges}
        style={{ flex: 1 }}
      >
        {header}
        <ContainerComponent
          {...(scrollable
            ? {
                contentContainerStyle: [
                  paddingStyle,
                  { paddingBottom: TAB_BAR_OFFSET },
                  contentContainerStyle,
                ] as ViewStyle[],
                showsVerticalScrollIndicator: false,
                keyboardShouldPersistTaps: 'handled' as const,
                refreshControl,
              }
            : {
                style: [
                  { flex: 1 },
                  paddingStyle,
                  { paddingBottom: TAB_BAR_OFFSET },
                  style,
                ] as ViewStyle[],
              })}
        >
          {children}
        </ContainerComponent>
      </SafeAreaView>
    </LinearGradient>
  );
}
