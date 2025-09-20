import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// AsyncStorage may not be available at module-eval time in some Hermes/native setups
// so require it lazily and fall back to a simple sync detector.
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Not available — we'll fall back to a sync language detector below
}
// Lazy-load locale bundles to avoid module-eval failures on some runtimes (Hermes/native).
let en: any = null;
let fr: any = null;
let ar: any = null;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  en = require('./locales/en').default;
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Failed to load en locale:', e);
}
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  fr = require('./locales/fr').default;
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Failed to load fr locale:', e);
}
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  ar = require('./locales/ar').default;
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Failed to load ar locale:', e);
}

// Detect language using AsyncStorage when available; otherwise fall back to a simple
// synchronous detector that inspects the navigator (web) or defaults to 'en'.
const languageDetector: any = (function createDetector() {
  if (AsyncStorage) {
    return {
      type: 'languageDetector',
      async: true,
      detect: async (cb: any) => {
        try {
          const lng = await AsyncStorage.getItem('i18nextLng');
          cb(lng || 'en');
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('i18n AsyncStorage detector failed, falling back to defaults:', e);
          cb('en');
        }
      },
      init: () => {},
      cacheUserLanguage: async (lng: string) => {
        try {
          await AsyncStorage.setItem('i18nextLng', lng);
        } catch {}
      },
    };
  }

  // Synchronous detector for environments without AsyncStorage
  return {
    type: 'languageDetector',
    async: false,
    detect: (cb: any) => {
      try {
        if (typeof navigator !== 'undefined') {
          const nav = (navigator as any).language || (navigator as any).userLanguage;
          if (nav) return cb(nav.split('-')[0]);
        }
      } catch (e) {
        // ignore
      }
      return cb('en');
    },
    init: () => {},
    cacheUserLanguage: () => {},
  };
})();

try {
  i18n.use(languageDetector).use(initReactI18next);
  const resources: any = {};
  if (en) resources.en = en;
  if (fr) resources.fr = fr;
  if (ar) resources.ar = ar;

  i18n.init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
    returnEmptyString: false,
    returnObjects: true,
    saveMissing: true,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation key: ${key} for language: ${lng} in namespace: ${ns}`);
    },
  });
} catch (e) {
  // Don't let i18n initialization crash the app in dev/native environments.
  // eslint-disable-next-line no-console
  console.warn('i18n.init failed, translations disabled for this session:', e);
}

// Handle RTL languages for both web and React Native
if (typeof document !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  });
} else {
  // React Native RTL support
  try {
    const { I18nManager } = require('react-native');
    i18n.on('languageChanged', (lng: string) => {
      const isRTL = lng === 'ar';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
      }
    });
  } catch {}
}
export default i18n;