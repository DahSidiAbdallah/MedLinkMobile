import { Platform } from 'react-native';

// Metro will normally prefer the platform specific extension automatically, but
// we still keep this shim so TypeScript consumers can import the module without
// having to reach for the native/web filenames directly. The previous
// implementation always re-exported the web bundle which caused the DOM-based
// Leaflet map to load on native Hermes builds and crash before the app could
// register.

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const Impl = Platform.OS === 'web'
  // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require
  ? require('./ClinicsHospitalsPharmaciesMap.web').default
  // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require
  : require('./ClinicsHospitalsPharmaciesMap.native').default;

export default Impl;
