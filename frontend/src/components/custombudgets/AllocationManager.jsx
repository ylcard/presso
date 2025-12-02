import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui/CustomButton";
import { Plus } from "lucide-react";
import AllocationFormDialog from "./AllocationFormDialog";
import AllocationCard from "./AllocationCard";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useSettings } from "../utils/SettingsContext";
import { formatCurrency } from "../utils/currencyUtils";
import { useTranslation } from "react-i18next";

export default function AllocationManager({
    customBudget,
    allocations,
    categories,
    allocationStats,
    onCreateAllocation,
    onUpdateAllocation,
    onDeleteAllocation,
    isSubmitting
}) {
    const { settings, user } = useSettings();
    const { t } = useTranslation();
    const [showForm, setShowForm] = useState(false);
    const [editingAllocation, setEditingAllocation] = useState(null);
    const [deleteAllocationId, setDeleteAllocationId] = useState(null);

    const handleSubmit = (data) => {
        if (editingAllocation) {
            onUpdateAllocation({ id: editingAllocation.id, data });
        } else {
            onCreateAllocation({
                ...data,
                customBudgetId: customBudget.id
            });
        }
        setShowForm(false);
        setEditingAllocation(null);
    };

    const handleEdit = (allocation) => {
        setEditingAllocation(allocation);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        setDeleteAllocationId(id);
    };

    const confirmDelete = () => {
        if (deleteAllocationId) {
            onDeleteAllocation(deleteAllocationId);
            setDeleteAllocationId(null);
        }
    };

    // Remaining funds = Total Budget - Sum of ALL allocations
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const remainingFunds = customBudget.allocatedAmount - totalAllocated;

    return (
        <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('allocations.title')}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('allocations.description')}
                    </p>
                </div>
                <CustomButton
                    onClick={() => setShowForm(true)}
                    size="sm"
                    variant="create"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('allocations.allocateFunds')}
                </CustomButton>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="max-w-xs p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-lg text-center font-bold text-gray-600 mb-4">{t('allocations.unallocatedFunds')}</p>

                    <div className="flex flex-col items-center">
                        <p className={`text-3xl font-bold ${remainingFunds < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatCurrency(remainingFunds, settings)}
                        </p>
                    </div>
                </div>

                <AllocationFormDialog
                    open={showForm}
                    onOpenChange={setShowForm}
                    allocation={editingAllocation}
                    customBudget={customBudget}
                    categories={categories}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    settings={settings}
                />

                {/* Allocations List */}
                {allocations.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <p>{t('allocations.emptyState')}</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {allocations.map((allocation) => {
                            const category = categories.find(c => c.id === allocation.categoryId);
                            const stats = allocationStats?.categorySpending?.[allocation.categoryId];

                            return (
                                <AllocationCard
                                    key={allocation.id}
                                    allocation={allocation}
                                    category={category}
                                    stats={stats}
                                    onEdit={() => handleEdit(allocation)}
                                    onDelete={() => handleDelete(allocation.id)}
                                    settings={settings}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Delete confirmation dialog */}
                <ConfirmDialog
                    open={!!deleteAllocationId}
                    onOpenChange={(open) => !open && setDeleteAllocationId(null)}
                    title={t('allocations.deleteConfirm.title')}
                    message={t('allocations.deleteConfirm.message')}
                    onConfirm={confirmDelete}
                    confirmText={t('common.delete')}
                    cancelText={t('common.cancel')}
                    isDestructive={true}
                />
            </CardContent>
        </Card>
    );
}
