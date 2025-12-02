import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomButton } from "@/components/ui/CustomButton";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/components/utils/currencyUtils";
import { useSettings } from "@/components/utils/SettingsContext";
import { useTranslation } from "react-i18next";

export default function ImportReview({ data, onDeleteRow }) {
    const { settings } = useSettings();
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{t('import.reviewTransactions')}</span>
                    <Badge variant="outline">{data.length} {t('import.recordsFound')}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-auto max-h-[500px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('import.fields.date')}</TableHead>
                                <TableHead>{t('import.fields.title')}</TableHead>
                                <TableHead>{t('import.fields.category')}</TableHead>
                                <TableHead className="text-right">{t('import.fields.amount')}</TableHead>
                                <TableHead>{t('import.fields.type')}</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell>{row.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{row.category || t('uncategorized')}</Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${row.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(Math.abs(row.amount), settings)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={row.type === 'expense' ? 'destructive' : 'default'}>
                                            {row.type === 'expense' ? t('expense') : t('income')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <CustomButton
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteRow(index)}
                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </CustomButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
