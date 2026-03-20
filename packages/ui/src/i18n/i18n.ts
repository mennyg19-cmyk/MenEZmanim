import heTranslations from './he.json';
import enTranslations from './en.json';
import yiTranslations from './yi.json';

export type Language = 'hebrew' | 'english' | 'yiddish';

type TranslationMap = Record<string, unknown>;

const translations: Record<Language, TranslationMap> = {
  hebrew: heTranslations,
  english: enTranslations,
  yiddish: yiTranslations,
};

/**
 * Retrieve a translated string by dotted key path.
 * Returns the key itself when no translation is found.
 */
export function t(key: string, language: Language): string {
  const parts = key.split('.');
  let current: unknown = translations[language];

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : key;
}

export function getDirection(language: Language): 'rtl' | 'ltr' {
  return language === 'english' ? 'ltr' : 'rtl';
}

export function getLocale(language: Language): string {
  switch (language) {
    case 'hebrew':
      return 'he-IL';
    case 'yiddish':
      return 'yi';
    case 'english':
      return 'en-US';
  }
}
