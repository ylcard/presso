import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "../utils/currencyCalculations";

export default function CurrencySelect({ value, onValueChange, placeholder = "Select currency" }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} {currency.name} ({currency.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}