import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';

export const useRTL = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return {
    isRTL,
    textAlign: isRTL ? 'right' : 'left' as 'left' | 'right',
    flexDirection: isRTL ? 'row-reverse' : 'row' as 'row' | 'row-reverse',
    textDirection: isRTL ? 'rtl' : 'ltr' as 'rtl' | 'ltr',
    alignSelf: isRTL ? 'flex-end' : 'flex-start' as 'flex-start' | 'flex-end',
    marginLeft: (value: number) => isRTL ? 0 : value,
    marginRight: (value: number) => isRTL ? value : 0,
    paddingLeft: (value: number) => isRTL ? 0 : value,
    paddingRight: (value: number) => isRTL ? value : 0,
  };
};

export const rtlText = (isRTL: boolean) => ({
  textAlign: isRTL ? 'right' : 'left' as 'left' | 'right',
  writingDirection: isRTL ? 'rtl' : 'ltr' as 'rtl' | 'ltr',
});

export const rtlView = (isRTL: boolean) => ({
  flexDirection: isRTL ? 'row-reverse' : 'row' as 'row' | 'row-reverse',
});

export const rtlStyle = (isRTL: boolean, leftValue: any, rightValue: any) => ({
  [isRTL ? 'right' : 'left']: leftValue,
  [isRTL ? 'left' : 'right']: rightValue,
});