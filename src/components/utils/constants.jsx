
// Priority order for sorting (lower number = higher priority in display)
export const PRIORITY_ORDER = {
  needs: 0,
  wants: 1,
  savings: 2
};

// Complete priority configuration with labels, colors, and order
export const PRIORITY_CONFIG = {
  needs: { 
    label: "Needs", 
    color: "#EF4444", 
    bg: "bg-red-50",
    order: 0 
  },
  wants: { 
    label: "Wants", 
    color: "#F59E0B", 
    bg: "bg-orange-50",
    order: 1 
  },
  savings: { 
    label: "Savings", 
    color: "#10B981", 
    bg: "bg-green-50",
    order: 2 
  }
};

// Preset color palette for budgets and visual elements
export const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1'
];
