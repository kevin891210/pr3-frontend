import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './translations.json';

const resources = {
  en: { translation: translations.en },
  zh: { translation: translations.zh },
  ja: { translation: translations.ja }
};

// Flatten nested objects for backward compatibility
Object.keys(resources).forEach(lang => {
  const translation = resources[lang].translation;
  if (translation.navigation) {
    Object.assign(translation, translation.navigation);
  }
  if (translation.common) {
    Object.assign(translation, translation.common);
  }
  if (translation.agentMonitorV2) {
    Object.assign(translation, translation.agentMonitorV2);
  }
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    keySeparator: '.'
  });

export default i18n;