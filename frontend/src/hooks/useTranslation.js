import { useTranslation as useTranslationOriginal } from 'react-i18next';

export const useTranslation = (ns) => {
    return useTranslationOriginal(ns);
};
