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
  
  // Flatten all nested objects
  const flattenObject = (obj, prefix = '') => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], prefix ? `${prefix}.${key}` : key);
      } else {
        const flatKey = prefix ? `${prefix}.${key}` : key;
        translation[flatKey] = obj[key];
      }
    });
  };
  
  // Create a copy to avoid modifying during iteration
  const originalTranslation = { ...translation };
  
  // Flatten all nested structures
  Object.keys(originalTranslation).forEach(key => {
    if (typeof originalTranslation[key] === 'object' && originalTranslation[key] !== null && !Array.isArray(originalTranslation[key])) {
      flattenObject(originalTranslation[key], key);
      // Also add direct access without prefix for backward compatibility
      Object.assign(translation, originalTranslation[key]);
    }
  });
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