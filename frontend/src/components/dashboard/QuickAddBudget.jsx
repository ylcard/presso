import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CustomBudgetForm from "../custombudgets/CustomBudgetForm";
import { useSettings } from "../utils/SettingsContext";
import { useTranslation } from "../../hooks/useTranslation";

export default function QuickAddBudget({ open, onOpenChange, onSubmit, isSubmitting, baseCurrency }) {
    const { settings } = useSettings();
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('budgets.form.createTitle')}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {t('budgets.form.createTitle')}
                    </DialogDescription>
                </DialogHeader>
                <CustomBudgetForm
                    onSubmit={(data) => {
                        onSubmit(data);
                        onOpenChange(false);
                    }}
                    onCancel={() => onOpenChange(false)}
                    isSubmitting={isSubmitting}
                    baseCurrency={baseCurrency}
                    settings={settings}
                />
            </DialogContent>
        </Dialog>
    );
}
