import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MonthYearPickerPopover from "./MonthYearPickerPopover";

export default function MonthNavigator({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange,
  // DEPRECATED PROPS (2025-01-12): Keep for backwards compatibility
  currentMonth,
  currentYear
}) {
  // CRITICAL FIX (2025-01-12): Support both prop naming conventions
  // New convention: selectedMonth/selectedYear with onMonthChange/onYearChange
  // Old convention: currentMonth/currentYear with onMonthChange
  const month = selectedMonth ?? currentMonth ?? 0;
  const year = selectedYear ?? currentYear ?? new Date().getFullYear();

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  // CRITICAL FIX (2025-01-12): Handle both callback conventions
  const handleMonthChange = (newMonth, newYear) => {
    if (onMonthChange && onYearChange) {
      // New convention: separate callbacks
      onMonthChange(newMonth);
      onYearChange(newYear);
    } else if (onMonthChange) {
      // Old convention: single callback with two parameters
      onMonthChange(newMonth, newYear);
    }
  };

  const goToPreviousMonth = () => {
    if (month === 0) {
      handleMonthChange(11, year - 1);
    } else {
      handleMonthChange(month - 1, year);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      handleMonthChange(0, year + 1);
    } else {
      handleMonthChange(month + 1, year);
    }
  };

  const goToCurrentMonth = () => {
    handleMonthChange(now.getMonth(), now.getFullYear());
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-8 w-8 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <MonthYearPickerPopover
          currentMonth={month}
          currentYear={year}
          onMonthChange={handleMonthChange}
        >
          <button 
            className="px-4 py-1 min-w-[160px] text-center font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer rounded hover:bg-blue-50"
          >
            {monthNames[month]} {year}
          </button>
        </MonthYearPickerPopover>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <AnimatePresence>
        {!isCurrentMonth && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Current Month
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ENHANCEMENTS (2025-01-12):
// 1. Improved arrow visibility: Added explicit text colors (text-gray-700 hover:text-blue-600) and increased icon size to w-5 h-5
// 2. Made month name clickable: Wrapped in MonthYearPickerPopover with hover effects
// 3. Reusable component: MonthYearPickerPopover can be used elsewhere in the app
//
// CRITICAL FIX (2025-01-12): Backwards compatibility for prop naming
// - Now supports BOTH prop conventions:
//   * New: selectedMonth/selectedYear with separate onMonthChange/onYearChange callbacks
//   * Old: currentMonth/currentYear with single onMonthChange(month, year) callback
// - Added nullish coalescing (??) for safe fallback values
// - Prevents "undefined is not an object" errors