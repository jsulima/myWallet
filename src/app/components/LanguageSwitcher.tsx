import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { useApp } from '../context/AppContext';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { updateLanguage } = useApp();

  const toggleLanguage = () => {
    const isUk = i18n.language?.startsWith('uk');
    const newLang = isUk ? 'en' : 'uk';
    updateLanguage(newLang);
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} className="w-12">
      {i18n.language?.startsWith('uk') ? 'UK' : 'EN'}
    </Button>
  );
}
