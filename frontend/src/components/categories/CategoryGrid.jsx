import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui/CustomButton";
import { Plus } from "lucide-react";
import CategoryCard from "./CategoryCard";
import CategoryForm from "./CategoryForm";
import { useTranslation } from "../../hooks/useTranslation";

export default function CategoryGrid({ categories, onAddCategory, onEditCategory, onDeleteCategory, isSubmitting }) {
    const { t } = useTranslation();
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateSubmit = async (formData) => {
        await onAddCategory(formData);
        setIsCreating(false);
    };

    // Sort categories: Needs first, then Wants, then Savings
    const priorityOrder = { needs: 1, wants: 2, savings: 3 };
    const sortedCategories = [...categories].sort((a, b) => {
        return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">{t('categories.grid.title')}</h2>
                <CustomButton onClick={() => setIsCreating(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> {t('categories.add')}
                </CustomButton>
            </div>

            {sortedCategories.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 rounded-full bg-gray-100 mb-4">
                            <Plus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{t('categories.grid.empty')}</h3>
                        <CustomButton
                            variant="link"
                            onClick={() => setIsCreating(true)}
                            className="mt-2 text-blue-600"
                        >
                            {t('categories.add')}
                        </CustomButton>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedCategories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            onEdit={onEditCategory}
                            onDelete={onDeleteCategory}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreating && (
                <CategoryForm
                    onSubmit={handleCreateSubmit}
                    onCancel={() => setIsCreating(false)}
                    isSubmitting={isSubmitting}
                />
            )}

            <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-medium text-gray-500 mb-4">
                    {t('categories.grid.allTitle', { count: sortedCategories.length })}
                </h3>
            </div>
        </div>
    );
}
