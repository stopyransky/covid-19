import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// all language files loaded on page load? no no.
import en from './locale/en';
import pl from './locale/pl';

i18n
  .use(detector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: { en, pl, },
    // lng: "en",
    // fallbackLng: 'en',
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
