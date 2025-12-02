import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomButton } from "@/components/ui/CustomButton";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import AmountInput from "../ui/AmountInput";
import DateRangePicker from "../ui/DateRangePicker";
import { PRESET_COLORS } from "../utils/constants";
import { normalizeAmount } from "../utils/generalUtils";
import { usePeriod } from "../hooks/usePeriod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

export default function CustomBudgetForm({
    budget,
    onSubmit,
    onCancel,
    isSubmitting
}) {
    const { t } = useTranslation();
    const { monthStart, monthEnd } = usePeriod();

    const [formData, setFormData] = useState({
        name: '',
        allocatedAmount: null,
        startDate: monthStart,
        endDate: monthEnd,
        description: '',
        color: '#3B82F6'
    });

    const [validationError, setValidationError] = useState(null);

    useEffect(() => {
        if (budget) {
            setFormData({
                name: budget.name || '',
                allocatedAmount: budget.allocatedAmount?.toString() || null,
                startDate: budget.startDate || monthStart,
                endDate: budget.endDate || monthEnd,
                description: budget.description || '',
                color: budget.color || '#3B82F6'
            });
        } else {
            setFormData(prev => ({
                ...prev,
                startDate: monthStart,
                endDate: monthEnd
            }));
        }
    }, [budget, monthStart, monthEnd]);

    const handleDateRangeChange = (start, end) => {
        setFormData(prev => ({
            ...prev,
            startDate: start,
            endDate: end
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setValidationError(null);

        const normalizedAmount = normalizeAmount(formData.allocatedAmount);

        return onSubmit({
            ...formData,
            allocatedAmount: parseFloat(normalizedAmount),
            status: budget?.status || 'active'
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {validationError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-2 gap-3 items-start">
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="name">{t('budget_name')}</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('budget_name_placeholder')}
                        required
                        autoFocus
                        autoComplete="off"
                    />
                </div>

                <div className="flex flex-col space-y-2">
                    <Label>{t('date_range')}</Label>
                    <DateRangePicker
                        startDate={formData.startDate}
                        endDate={formData.endDate}
                        onRangeChange={handleDateRangeChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 items-end">
                <div className="space-y-2">
                    <Label htmlFor="allocatedAmount">{t('budget_limit')}</Label>
                    <AmountInput
                        id="allocatedAmount"
                        value={formData.allocatedAmount}
                        onChange={(value) => setFormData({ ...formData, allocatedAmount: value })}
                        placeholder="0.00"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm">{t('color')}</Label>
                <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${formData.color === color ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-900' : 'border-transparent'
                                }`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">{t('description_optional')}</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('description_placeholder')}
                    rows={2}
                    className="resize-none"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <CustomButton type="button" variant="outline" onClick={onCancel}>
                    {t('cancel')}
                </CustomButton>
                <CustomButton
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                >
                    {isSubmitting ? t('saving') : budget ? t('update_budget') : t('create_budget')}
                </CustomButton>
            </div>
        </form>
    );
}
