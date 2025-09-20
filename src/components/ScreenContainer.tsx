import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
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
};

const basePadding: ViewStyle = {
  paddingHorizontal: spacing.xl,
  paddingTop: spacing.xl,
  paddingBottom: spacing.xl,
};

export default function ScreenContainer({
  children,
  scrollable,
  contentContainerStyle,
  style,
  edges,
  withPadding = true,
  header,
}: Readonly<ScreenContainerProps>) {
  const ContainerComponent = scrollable ? ScrollView : View;
  const defaultEdges: Edges = edges ?? ['top', 'left', 'right'];
  const paddingStyle = withPadding ? basePadding : undefined;

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
        <ContainerComponent
          {...(scrollable
            ? {
                contentContainerStyle: [
                  paddingStyle,
                  { paddingBottom: spacing.xxl + 12 },
                  contentContainerStyle,
                ] as ViewStyle[],
                showsVerticalScrollIndicator: false,
                keyboardShouldPersistTaps: 'handled' as const,
              }
            : {
                style: [
                  { flex: 1 },
                  paddingStyle,
                  style,
                ] as ViewStyle[],
              })}
        >
          {header}
          {children}
        </ContainerComponent>
      </SafeAreaView>
    </LinearGradient>
  );
}
