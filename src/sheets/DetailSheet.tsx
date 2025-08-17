import React, { useRef, useMemo } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export default function DetailSheet({ children }: { children: React.ReactNode }) {
  const ref = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  return (
    <BottomSheet ref={ref} snapPoints={snapPoints}>
      <BottomSheetView>{children}</BottomSheetView>
    </BottomSheet>
  );
}
