import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import fr from './locales/fr';
import ar from './locales/ar';

i18n
  .use({
    type: 'languageDetector',
    async: true,
    detect: async (cb: any) => {
      try {
        const lng = await AsyncStorage.getItem('i18nextLng');
        cb(lng || 'en');
      } catch {
        cb('en');
      }
    },
    init: () => {},
    cacheUserLanguage: async (lng: string) => {
      try {
        await AsyncStorage.setItem('i18nextLng', lng);
      } catch {}
    },
  })
  .use(initReactI18next)
  .init({
    resources: {
      en,
      fr,
      ar,
    },
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

// Handle RTL languages
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;