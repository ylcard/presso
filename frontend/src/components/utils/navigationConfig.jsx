
import { LayoutDashboard, Receipt, FolderOpen, BarChart3, Calendar, Settings } from "lucide-react";
import { createPageUrl } from "@/utils";

export const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    url: createPageUrl("Transactions"),
    icon: Receipt,
  },
  {
    title: "Budgets",
    url: createPageUrl("Budgets"),
    icon: Calendar,
  },
  {
    title: "Categories",
    url: createPageUrl("Categories"),
    icon: FolderOpen,
  },
  {
    title: "Reports",
    url: createPageUrl("Reports"),
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];
