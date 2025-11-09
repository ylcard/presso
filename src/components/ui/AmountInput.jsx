import React from "react";
import { Input } from "@/components/ui/input";
import { useSettings } from "../utils/SettingsContext";

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
  
  const handleChange = (e) => {
    // Allow numbers, commas, periods, and spaces
    const val = e.target.value;
    const regex = /^[0-9.,\s]*$/;
    
    if (val === '' || regex.test(val)) {
      onChange(e);
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
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${settings.currencyPosition === 'before' ? 'pl-8' : 'pr-8'} ${className}`}
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