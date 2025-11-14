/**
 * @fileoverview AmountInput component for currency input with localization and financial precision.
 * Handles display, synchronization, and parsing of localized currency strings based on user settings.
 */

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useSettings } from "../utils/SettingsContext";
import { formatCurrency, unformatCurrency } from "../utils/currencyUtils";

/**
 * Custom input component designed for monetary amounts.
 * It handles formatting and parsing based on user's defined separators and currency position.
 * @param {object} props
 * @param {number|null|undefined} props.value - The external numeric amount (e.g., 1234.56).
 * @param {function(number|null)} props.onChange - Handler to update the external numeric value. Receives the rounded number or null.
 * @param {string} [props.placeholder="0.00"] - Placeholder text for the input.
 * @param {string} [props.className=""] - Additional class names for the Input component.
 * @param {string|null} [props.currencySymbol=null] - Optional symbol to override the user's base currency symbol.
 * @param {object} props.... - Remaining props passed directly to the underlying Input component.
 * @returns {JSX.Element} The styled amount input with currency symbol.
 */
export default function AmountInput({
    value,
    onChange,
    placeholder = "0.00",
    className = "",
    currencySymbol = null, // New prop to override default symbol
    ...props
}) {
    const { settings } = useSettings();

    // Use provided currencySymbol or fall back to user's base currency
    const displaySymbol = currencySymbol || settings.currencySymbol;

    /**
     * @type {[string, function(string)]} Internal state for the formatted string visible in the input field.
     */
    const [displayValue, setDisplayValue] = useState(
        // UPDATED 17-Jan-2025: Use empty string instead of formatted "0" for zero/null values
        value !== null && value !== undefined && !isNaN(value) && value !== 0 
            ? formatCurrency(value, settings) 
            : ''
    );

    /**
     * Synchronizes the internal display state when the external `value` prop changes (e.g., parent form reset).
     * Compares the external numeric value to the number represented by the current display string to avoid infinite loops.
     * @effect
     */
    useEffect(() => {
        // Check if external 'value' (number) differs from the number represented by our display string
        const currentNumericValue = parseFloat(unformatCurrency(displayValue || '', settings));

        if (value === null || value === undefined || isNaN(value) || value === 0) {
            // UPDATED 17-Jan-2025: Set to empty string to show placeholder instead of "0"
            if (displayValue !== '') setDisplayValue('');
        } else if (value !== currentNumericValue) {
            setDisplayValue(formatCurrency(value, settings));
        }
    }, [value, settings, displayValue]);

    /**
     * Handles raw user input, updates internal display, validates, parses, rounds, and notifies the parent.
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handleChange = (e) => {
        const rawInput = e.target.value;

        // 1. Update the internal display state immediately
        setDisplayValue(rawInput);

        // 2. Unformat the string to get a standard numeric string ('1000.50')
        const numericString = unformatCurrency(rawInput, settings);

        // 3. Basic validation: allow empty string, or a string that looks like a standard number
        const numericRegex = /^-?\d*\.?\d*$/;

        if (numericString === '') {
            // UPDATED 17-Jan-2025: Set displayValue to empty string to show placeholder
            setDisplayValue('');
            onChange(null);
        } else if (numericRegex.test(numericString)) {
            // Parse and enforce precision before sending to parent
            const parsedValue = parseFloat(numericString);

            // CRITICAL: Round result to 2 decimal places to fix floating-point math
            const roundedValue = Math.round(parsedValue * 100) / 100;

            onChange(roundedValue);
        }
    };

    return (
        <div className="relative">
            {settings.currencyPosition === 'before' && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">
                        {displaySymbol}
                    </span>
                </div>
            )}
            <Input
                type="text"
                inputMode="decimal"
                // UPDATED 17-Jan-2025: Empty string when displayValue is empty to show placeholder "0"
                value={displayValue}
                onChange={handleChange}
                // UPDATED 17-Jan-2025: Always show placeholder when input is empty
                placeholder={placeholder}
                className={`${settings.currencyPosition === 'before' ? 'pl-8' : 'pr-8'} ${className}`}
                // ADDED 17-Jan-2025: Disable browser autocomplete for amount fields
                autoComplete="off"
                {...props}
            />
            {settings.currencyPosition === 'after' && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">
                        {displaySymbol}
                    </span>
                </div>
            )}
        </div>
    );
}

// UPDATED 17-Jan-2025: Fixed zero/null value handling to show placeholder instead of "0" text
// - When value is 0, null, or undefined, displayValue is now set to empty string ''
// - This allows the placeholder="0" to be visible without interfering with user input
// - Users no longer need to delete "0" before entering their own amount
// - The external onChange handler still receives null when the field is empty

// ADDED 17-Jan-2025: Disabled browser autocomplete
// - Added autoComplete="off" to prevent browser from showing history of previous amounts
// - This addresses the unwanted "history" popup showing previously entered values like "69.24"
// - Users will no longer see suggestions from previous entries when typing amounts