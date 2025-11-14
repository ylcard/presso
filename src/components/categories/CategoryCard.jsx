import React from "react";
// UPDATED 15-Jan-2025: Changed Button import to CustomButton
import { CustomButton } from "@/components/ui/CustomButton";
import { Pencil, Trash2, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { iconMap } from "../utils/iconMapConfig";

export default function CategoryCard({ category, onEdit, onDelete }) {
  const IconComponent = category.icon && iconMap[category.icon] ? iconMap[category.icon] : Circle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="relative p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-all group"
      style={{ backgroundColor: `${category.color}05` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <IconComponent className="w-7 h-7" style={{ color: category.color }} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">{category.name}</h3>
          <p className="text-sm text-gray-500 mt-1 capitalize">{category.priority}</p>
        </div>

        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* UPDATED 15-Jan-2025: Changed to CustomButton with modify variant */}
          <CustomButton
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(category)}
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            <Pencil className="w-4 h-4" />
          </CustomButton>
          {/* UPDATED 15-Jan-2025: Changed to CustomButton with ghost variant (destructive handled by hover) */}
          <CustomButton
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(category.id)}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </CustomButton>
        </div>
      </div>
    </motion.div>
  );
}

// UPDATED 15-Jan-2025: Replaced Button with CustomButton
// - Edit button uses ghost variant with blue hover
// - Delete button uses ghost variant with red hover
// - Both use icon-sm size for compact display