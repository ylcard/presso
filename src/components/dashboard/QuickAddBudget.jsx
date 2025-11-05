
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import AmountInput from "../ui/AmountInput";
import DatePicker from "../ui/DatePicker";

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1'
];

export default function QuickAddBudget({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting, 
  selectedMonth, 
  selectedYear 
}) {
  const getMonthDates = () => {
    const month = selectedMonth !== undefined ? selectedMonth : new Date().getMonth();
    const year = selectedYear !== undefined ? selectedYear : new Date().getFullYear();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const start = firstDay.toISOString().split('T')[0];
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const end = lastDay.toISOString().split('T')[0];
    
    return { start, end };
  };

  const { start: defaultStart, end: defaultEnd } = getMonthDates();

  const [formData, setFormData] = useState({
    name: '',
    allocatedAmount: '',
    startDate: defaultStart,
    endDate: defaultEnd,
    description: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    const { start, end } = getMonthDates();
    setFormData(prev => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
  }, [selectedMonth, selectedYear]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedAmount = formData.allocatedAmount.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    
    onSubmit({
      ...formData,
      allocatedAmount: parseFloat(normalizedAmount),
      status: 'active'
    });
    
    // Reset form
    setFormData({
      name: '',
      allocatedAmount: '',
      startDate: defaultStart,
      endDate: defaultEnd,
      description: '',
      color: '#3B82F6'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Custom Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Budget Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Manchester Trip"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocatedAmount">Total Budget *</Label>
              <AmountInput
                id="allocatedAmount"
                value={formData.allocatedAmount}
                onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <DatePicker
                id="startDate"
                value={formData.startDate}
                onChange={(value) => setFormData({ ...formData, startDate: value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <DatePicker
                id="endDate"
                value={formData.endDate}
                onChange={(value) => setFormData({ ...formData, endDate: value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.color === color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about this budget..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isSubmitting ? 'Creating...' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
