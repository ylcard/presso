import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MonthNavigator({ currentMonth, currentYear, onMonthChange }) {
  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  const goToCurrentMonth = () => {
    onMonthChange(now.getMonth(), now.getFullYear());
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
          className="h-8 w-8 hover:bg-blue-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="px-4 py-1 min-w-[160px] text-center">
          <p className="font-bold text-gray-900">{monthNames[currentMonth]} {currentYear}</p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8 hover:bg-blue-50"
        >
          <ChevronRight className="w-4 h-4" />
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