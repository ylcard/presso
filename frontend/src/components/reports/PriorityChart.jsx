import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { usePriorityChartData } from "../hooks/useDerivedData";
import { useTranslation } from 'react-i18next';

export default function PriorityChart({ transactions, categories, goals, monthlyIncome, isLoading, settings }) {
    const { t } = useTranslation();
    // Use the extracted hook for calculations
    const chartData = usePriorityChartData(transactions, categories, goals, monthlyIncome, settings);

    if (isLoading) {
        return (
            <Card className="border-none shadow-lg h-full">
                <CardHeader>
                    <CardTitle>{t('reports.charts.priority')}</CardTitle>
                </CardHeader>
                <CardContent className="h-full pb-6">
                    <Skeleton className="h-full w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-lg h-full flex flex-col">
            <CardHeader>
                <CardTitle>{t('reports.charts.priority')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-6">
                {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <p>{t('reports.charts.noExpenses')}</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                tickFormatter={(value) => t(`settings.goals.priorities.${value.toLowerCase()}`, { defaultValue: value })}
                            />
                            <YAxis label={{ value: t('reports.charts.percentIncome'), angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                formatter={(value) => `${value.toFixed(1)}%`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="actual" name={t('reports.charts.actual')} radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                            <Bar dataKey="target" name={t('reports.charts.target')} radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        fillOpacity={0.2}
                                        stroke={entry.color}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
