/**
 * Currency utility functions
 * Centralized currency symbol mapping, formatting, and conversion helpers
 * Updated: 11-Nov-2025 - Added formatCurrency from formatCurrency.js
 */

/**
 * Get the currency symbol for a given currency code
 * @param {string} currencyCode - The ISO currency code (e.g., 'USD', 'EUR', 'GBP')
 * @returns {string} The currency symbol or the currency code if not found
 */
export const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'CA$',
        'AUD': 'A$',
        'CHF': 'CHF',
        'CNY': '¥',
        'INR': '₹',
        'MXN': 'MX$',
        'BRL': 'R$',
        'ZAR': 'R',
        'KRW': '₩',
        'SGD': 'S$',
        'NZD': 'NZ$',
        'HKD': 'HK$',
        'SEK': 'kr',
        'NOK': 'kr',
        'DKK': 'kr',
        'PLN': 'zł',
        'THB': '฿',
        'MYR': 'RM',
        'IDR': 'Rp',
        'PHP': '₱',
        'CZK': 'Kč',
        'ILS': '₪',
        'CLP': 'CLP$',
        'AED': 'د.إ',
        'SAR': '﷼',
        'TWD': 'NT$',
        'TRY': '₺'
    };
    return currencySymbols[currencyCode] || currencyCode;
};

/**
 * Unformat a currency string back to a standard numeric string (using '.')
 * @param {string} formattedString - The string input by the user (e.g., "1.000,50")
 * @param {Object} settings - User currency settings
 * @returns {string} The cleaned, unformatted numeric string (e.g., "1000.50")
 */
export const unformatCurrency = (formattedString, settings) => {
    if (!formattedString) return '';

    // 1. Remove the currency symbol, regardless of position
    // Use a simple regex to remove known symbols or codes
    let cleanedString = formattedString.replace(new RegExp(`[${settings.currencySymbol}R$£€¥₩$A$S\$NZ\$HK\$zł฿RMIDR₱Kč₪CLP\$د.إ﷼NT\$₺kr]|CA\\$|MX\\$|TWD`, 'gi'), '');

    // 2. Remove the sign (handle sign separately if needed, but for now, just remove it)
    cleanedString = cleanedString.replace(/[\-]/g, '');

    // 3. Remove thousand separators
    const thousandRegex = new RegExp(`\\${settings.thousandSeparator}`, 'g');
    cleanedString = cleanedString.replace(thousandRegex, '');

    // 4. Normalize the user's decimal separator to a standard period '.'
    const decimalRegex = new RegExp(`\\${settings.decimalSeparator}`, 'g');
    cleanedString = cleanedString.replace(decimalRegex, '.');

    // 5. Cleanup extra whitespace (though typically handled by input filters)
    cleanedString = cleanedString.trim();

    return cleanedString;
};

/**
 * Format a number as currency according to user settings
 * @param {number} amount - The amount to format
 * @param {Object} settings - User currency settings
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, settings) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return settings.currencyPosition === 'before'
            ? `${settings.currencySymbol}0${settings.decimalSeparator}00`
            : `0${settings.decimalSeparator}00${settings.currencySymbol}`;
    }

    const decimalPlaces = settings.decimalPlaces || 2;
    const isNegative = amount < 0;

    const fixedAmount = Math.abs(amount).toFixed(decimalPlaces);
    const [integerPart, decimalPart] = fixedAmount.split('.');

    const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        settings.thousandSeparator || ','
    );

    let formattedDecimal = decimalPart || '';

    // Hide trailing zeros if setting is enabled
    if (settings.hideTrailingZeros && formattedDecimal) {
        formattedDecimal = formattedDecimal.replace(/0+$/, '');
    }

    const formattedAmount = formattedDecimal && formattedDecimal.length > 0
        ? `${formattedInteger}${settings.decimalSeparator || '.'}${formattedDecimal}`
        : formattedInteger;

    const sign = isNegative ? '-' : '';

    return settings.currencyPosition === 'before'
        ? `${sign}${settings.currencySymbol}${formattedAmount}`
        : `${sign}${formattedAmount}${settings.currencySymbol}`;
};