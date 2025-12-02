import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { CustomButton } from "@/components/ui/CustomButton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "../components/utils/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { useSettingsForm, useGoalActions } from "../components/hooks/useActions";
import { useGoals } from "../components/hooks/useBase44Entities";
import { formatCurrency } from "../components/utils/currencyUtils";
import { Settings as SettingsIcon, Target, GripVertical, Lock, Save, AlertCircle } from "lucide-react";
import {
    CURRENCY_OPTIONS,
    FINANCIAL_PRIORITIES,
    SETTINGS_KEYS,
    DEFAULT_SETTINGS
} from "../components/utils/constants";
import AmountInput from "../components/ui/AmountInput";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/use-toast";
import { useTranslation } from "../hooks/useTranslation";

export default function Settings() {
    const { t } = useTranslation();
    const { settings, updateSettings, user, refreshUser } = useSettings();
    const { logout } = useAuth();

    // --- 1. GENERAL SETTINGS LOGIC ---
    const { formData, handleFormChange, resetForm } = useSettingsForm(
        settings,
        updateSettings
    );

    const handleCurrencyChange = (code) => {
        const selectedCurrency = CURRENCY_OPTIONS.find(c => c.code === code);
        if (selectedCurrency) {
            handleFormChange('baseCurrency', code);
            handleFormChange('currencySymbol', selectedCurrency.symbol);
        }
    };

    // --- 2. GOAL SETTINGS LOGIC (Moved from Component) ---
    const { goals, isLoading: loadingGoals } = useGoals(user);
    const { handleGoalUpdate, isSaving: isGoalSaving } = useGoalActions(user, goals);

    // Mode State
    const [localGoalMode, setLocalGoalMode] = useState(settings.goalMode ?? true);
    const isAbsoluteMode = !localGoalMode;

    // Slider State (Percentage)
    const [splits, setSplits] = useState({ split1: 50, split2: 80 });
    const containerRef = useRef(null);
    const [activeThumb, setActiveThumb] = useState(null);

    // Input State (Absolute)
    const [absoluteValues, setAbsoluteValues] = useState({
        needs: '', wants: '', savings: ''
    });

    // Sync local mode when DB settings load
    useEffect(() => {
        setLocalGoalMode(settings.goalMode ?? true);
    }, [settings.goalMode]);

    // Helper to sync local state with DB goals
    const syncLocalGoalsWithDb = () => {
        if (goals.length > 0) {
            // 1. Sync Absolute Values
            setAbsoluteValues({
                needs: goals.find(g => g.priority === 'needs')?.target_amount ?? '',
                wants: goals.find(g => g.priority === 'wants')?.target_amount ?? '',
                savings: goals.find(g => g.priority === 'savings')?.target_amount ?? ''
            });

            // 2. Sync Sliders
            const map = { needs: 0, wants: 0, savings: 0 };
            goals.forEach(goal => { map[goal.priority] = goal.target_percentage; });
            setSplits({
                split1: map.needs || 50,
                split2: (map.needs || 50) + (map.wants || 30)
            });
        }
    };

    // Sync values when Goals load
    useEffect(() => {
        syncLocalGoalsWithDb();
    }, [goals]);

    // Derived Percentages
    const currentValues = {
        needs: splits.split1,
        wants: splits.split2 - splits.split1,
        savings: 100 - splits.split2
    };

    // Slider Handlers
    const handlePointerDown = (e, thumbIndex) => {
        e.preventDefault();
        e.target.setPointerCapture(e.pointerId);
        setActiveThumb(thumbIndex);
    };

    const handlePointerMove = (e) => {
        if (!activeThumb || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const constrained = Math.round(Math.max(0, Math.min(100, rawPercent)));

        setSplits(prev => {
            if (activeThumb === 1) return { ...prev, split1: Math.min(constrained, prev.split2 - 5) };
            else return { ...prev, split2: Math.max(constrained, prev.split1 + 5) };
        });
    };

    const handlePointerUp = (e) => {
        setActiveThumb(null);
        e.target.releasePointerCapture(e.pointerId);
    };

    // --- 3. SMART SAVE LOGIC ---
    // Dirty Check: Compare current state vs DB state
    const hasChanges = useMemo(() => {
        if (!settings) return false;

        // 1. General Settings
        if (SETTINGS_KEYS.some(k => formData[k] !== settings[k])) return true;
        if (localGoalMode !== (settings.goalMode ?? true)) return true;

        // 2. Goals
        const goalsChanged = Object.keys(FINANCIAL_PRIORITIES).some(p => {
            const goal = goals.find(g => g.priority === p);
            if (!localGoalMode) { // Absolute
                return (Number(absoluteValues[p]) || 0) !== (goal?.target_amount || 0);
            } else { // Percentage
                // Allow small float tolerance
                return Math.abs(currentValues[p] - (goal?.target_percentage || 0)) > 0.5;
            }
        });
        if (goalsChanged) return true;

        // 3. Profile Settings
        if (formData.name !== undefined && formData.name !== user?.name) return true;
        if (formData.email !== undefined && formData.email !== user?.email) return true;
        if (formData.password && formData.password.length > 0) return true;

        return false;
    }, [formData, settings, localGoalMode, absoluteValues, currentValues, goals, user]);

    // --- NAVIGATION GUARD (Browser Level) ---
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = ''; // Chrome requires this
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    const [isGlobalSaving, setIsGlobalSaving] = useState(false);

    // --- ACTIONS ---
    const handleDiscard = () => {
        // 1. Reset General Form
        resetForm(settings);
        // 2. Reset Mode
        setLocalGoalMode(settings.goalMode ?? true);
        // 3. Reset Goals
        syncLocalGoalsWithDb();

        showToast({ title: t('settings.toast.changesDiscarded'), description: t('settings.toast.changesDiscardedDesc') });
    };

    const handleResetToDefaults = () => {
        if (!window.confirm(t('settings.confirmReset'))) return;

        // 1. Reset General Form to CONSTANT defaults
        resetForm(DEFAULT_SETTINGS);
        // 2. Reset Mode
        setLocalGoalMode(true); // Default is Percentage
        // 3. Reset Sliders to 50/30/20
        setSplits({ split1: 50, split2: 80 });
        // 4. Clear Absolute Values (since we are switching to percentage default)
        setAbsoluteValues({ needs: '', wants: '', savings: '' });

        showToast({ title: t('settings.toast.resetApplied'), description: t('settings.toast.resetAppliedDesc') });
    };

    const handleGlobalSave = async () => {
        setIsGlobalSaving(true);
        try {
            const promises = [];

            // A. Settings Update (if changed)
            // const settingsKeys = ['baseCurrency', 'currencyPosition', 'budgetViewMode', 'thousandSeparator', 'decimalSeparator', 'decimalPlaces', 'hideTrailingZeros', 'fixedLifestyleMode'];
            // const settingsChanged = settingsKeys.some(k => formData[k] !== settings[k]);
            const settingsChanged = SETTINGS_KEYS.some(k => formData[k] !== settings[k]);
            const modeChanged = localGoalMode !== (settings.goalMode ?? true);

            if (settingsChanged || modeChanged) {
                promises.push(updateSettings({
                    ...formData,
                    goalMode: localGoalMode
                }));
            }

            // A2. Profile Update (if changed)
            if ((formData.name && formData.name !== user?.name) || (formData.email && formData.email !== user?.email) || formData.password) {
                const profileData = {};
                if (formData.name && formData.name !== user?.name) profileData.name = formData.name;
                if (formData.email && formData.email !== user?.email) profileData.email = formData.email;
                if (formData.password) profileData.password = formData.password;

                if (Object.keys(profileData).length > 0) {
                    promises.push(
                        base44.auth.updateProfile(profileData)
                            .then(() => refreshUser())
                    );
                }
            }



            // B. Goal Updates (if changed)
            Object.keys(FINANCIAL_PRIORITIES).forEach((priority) => {
                const existingGoal = goals.find(g => g.priority === priority);
                let payload = {};
                let hasGoalChanged = false;

                if (!localGoalMode) {
                    // ABSOLUTE MODE
                    const newAmt = absoluteValues[priority] === '' ? 0 : Number(absoluteValues[priority]);
                    if (newAmt !== (existingGoal?.target_amount || 0)) {
                        hasGoalChanged = true;
                        payload = {
                            target_amount: newAmt,
                            target_percentage: existingGoal?.target_percentage || 0
                        };
                    }
                } else {
                    // PERCENTAGE MODE
                    const newPct = currentValues[priority];
                    if (Math.abs(newPct - (existingGoal?.target_percentage || 0)) > 0.01) {
                        hasGoalChanged = true;
                        payload = {
                            target_amount: existingGoal?.target_amount || 0,
                            target_percentage: newPct
                        };
                    }
                }
                if (hasGoalChanged) {
                    promises.push(handleGoalUpdate(priority, payload.target_percentage, payload));
                }
            });

            await Promise.all(promises);
            showToast({ title: t('success'), description: t('settings.toast.savedSuccess') });
        } catch (error) {
            console.error('Save error:', error);
            showToast({ title: t('error'), description: t('settings.toast.saveFailed'), variant: "destructive" });
        } finally {
            setIsGlobalSaving(false);
        }
    };


    const previewAmount = 1234567.89;

    return (
        <div className="min-h-screen p-4 md:p-8 pb-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('settings.title')}</h1>
                    <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
                </div>

                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SettingsIcon className="w-5 h-5" />
                            {t('settings.appPreferences.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('settings.appPreferences.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* SECTION 0: PROFILE SETTINGS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">Profile Settings</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={formData.name || user?.name || ''}
                                        onChange={(e) => handleFormChange('name', e.target.value)}
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input
                                        value={formData.email || user?.email || ''}
                                        onChange={(e) => handleFormChange('email', e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password (leave blank to keep current)</Label>
                                    <Input
                                        type="password"
                                        value={formData.password || ''}
                                        onChange={(e) => handleFormChange('password', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 1: CURRENCY & FORMATTING */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">{t('settings.currency.title')}</h3>
                            </div>

                            {/* ... Currency Inputs ... */}
                            <div className="space-y-2">
                                <Label htmlFor="currency">{t('settings.currency.label')}</Label>
                                <Select value={formData.baseCurrency || 'USD'} onValueChange={handleCurrencyChange}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CURRENCY_OPTIONS.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>{c.symbol} - {c.name} ({c.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{t('settings.currency.position')}</Label>
                                    <Select value={formData.currencyPosition} onValueChange={(v) => handleFormChange('currencyPosition', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="before">{t('settings.currency.positionBefore')} ($100)</SelectItem>
                                            <SelectItem value="after">{t('settings.currency.positionAfter')} (100€)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('settings.currency.viewMode')}</Label>
                                    <Select value={formData.budgetViewMode || 'bars'} onValueChange={(v) => handleFormChange('budgetViewMode', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bars">{t('settings.currency.viewModeBars')}</SelectItem>
                                            <SelectItem value="cards">{t('settings.currency.viewModeCards')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* ... Formatting Inputs ... */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{t('settings.currency.thousandSeparator')}</Label>
                                    <Select value={formData.thousandSeparator} onValueChange={(v) => handleFormChange('thousandSeparator', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value=",">{t('settings.currency.separatorComma')} (,)</SelectItem>
                                            <SelectItem value=".">{t('settings.currency.separatorPeriod')} (.)</SelectItem>
                                            <SelectItem value=" ">{t('settings.currency.separatorSpace')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('settings.currency.decimalSeparator')}</Label>
                                    <Select value={formData.decimalSeparator} onValueChange={(v) => handleFormChange('decimalSeparator', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value=".">{t('settings.currency.separatorPeriod')} (.)</SelectItem>
                                            <SelectItem value=",">{t('settings.currency.separatorComma')} (,)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{t('settings.currency.decimalPlaces')}</Label>
                                    <Input type="number" min="0" max="4" value={formData.decimalPlaces} onChange={(e) => handleFormChange('decimalPlaces', parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 pt-8 cursor-pointer">
                                        <input type="checkbox" checked={formData.hideTrailingZeros} onChange={(e) => handleFormChange('hideTrailingZeros', e.target.checked)} className="rounded border-gray-300" />
                                        {t('settings.currency.hideTrailingZeros')}
                                    </Label>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs text-gray-500 mb-1">{t('settings.currency.preview')}</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(previewAmount, formData)}</p>
                            </div>
                        </div>

                        {/* SECTION 2: GOAL ALLOCATION (Merged) */}
                        <div className="space-y-6 pt-6 border-t border-gray-200">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-5 h-5 text-gray-900" />
                                    <h3 className="font-semibold text-gray-900">{t('settings.goals.title')}</h3>
                                </div>
                                <p className="text-sm text-gray-500">{t('settings.goals.description')}</p>
                            </div>

                            {loadingGoals ? (
                                <Skeleton className="h-64 w-full" />
                            ) : (
                                <>
                                    {/* Mode Switcher */}
                                    <div className="flex items-center justify-center p-1 bg-gray-100 rounded-lg">
                                        <button type="button" onClick={() => setLocalGoalMode(true)} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!isAbsoluteMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t('settings.goals.modes.percentage')}</button>
                                        <button type="button" onClick={() => setLocalGoalMode(false)} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${isAbsoluteMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t('settings.goals.modes.absolute')}</button>
                                    </div>

                                    {/* SLIDER VIEW (Percentage) */}
                                    {!isAbsoluteMode ? (
                                        <div className="pt-6 pb-2 px-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div ref={containerRef} className="relative h-6 w-full bg-gray-100 rounded-full select-none touch-none">
                                                {/* Zones */}
                                                <div className="absolute top-0 left-0 h-full rounded-l-full" style={{ width: `${splits.split1}%`, backgroundColor: FINANCIAL_PRIORITIES.needs.color }} />
                                                <div className="absolute top-0 h-full" style={{ left: `${splits.split1}%`, width: `${splits.split2 - splits.split1}%`, backgroundColor: FINANCIAL_PRIORITIES.wants.color }} />
                                                <div className="absolute top-0 h-full rounded-r-full" style={{ left: `${splits.split2}%`, width: `${100 - splits.split2}%`, backgroundColor: FINANCIAL_PRIORITIES.savings.color }} />

                                                {/* Thumb 1 */}
                                                <div onPointerDown={(e) => handlePointerDown(e, 1)} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} className={`absolute top-0 bottom-0 w-4 -ml-2 bg-white shadow-sm rounded-full border flex items-center justify-center z-10 hover:scale-110 transition-transform ${activeThumb === 1 ? 'cursor-grabbing' : 'cursor-grab'}`} style={{ left: `${splits.split1}%` }}>
                                                    <GripVertical className="w-2.5 h-2.5 text-gray-400" />
                                                </div>
                                                {/* Thumb 2 */}
                                                <div onPointerDown={(e) => handlePointerDown(e, 2)} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} className={`absolute top-0 bottom-0 w-4 -ml-2 bg-white shadow-sm rounded-full border flex items-center justify-center z-10 hover:scale-110 transition-transform ${activeThumb === 2 ? 'cursor-grabbing' : 'cursor-grab'}`} style={{ left: `${splits.split2}%` }}>
                                                    <GripVertical className="w-3 h-3 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* INPUT VIEW (Absolute) */
                                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                {Object.entries(FINANCIAL_PRIORITIES)
                                                    // Optional: Sort by order property if you want a specific display order independent of object keys
                                                    .sort(([, a], [, b]) => a.order - b.order)
                                                    .map(([key, config]) => (
                                                        <div key={key} className="space-y-1.5">
                                                            <Label className="text-xs justify-start font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                                                                {t(`settings.goals.priorities.${key}`)}
                                                            </Label>
                                                            <div>
                                                                <AmountInput
                                                                    value={absoluteValues[key]}
                                                                    onChange={(val) => setAbsoluteValues(prev => ({ ...prev, [key]: val }))}
                                                                    placeholder="0.00"
                                                                    className="font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="flex justify-end items-center gap-4 pt-2 border-t border-gray-100">
                                                <span className="text-sm font-medium text-gray-500">{t('settings.goals.totalAllocated')}</span>
                                                <span className="text-lg font-bold text-gray-900">
                                                    {formData.currencySymbol} {Object.values(absoluteValues).reduce((acc, val) => acc + (Number(val) || 0), 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lifestyle Creep Protection (Percentage Mode Only) */}
                                    {!isAbsoluteMode && (
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-1 duration-300 delay-75">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold text-gray-900">{t('settings.goals.inflation.title')}</p>
                                                    <p className="text-xs text-gray-500 max-w-[280px] sm:max-w-md">
                                                        {t('settings.goals.inflation.description')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={formData.fixedLifestyleMode}
                                                // Update local form state, handled by general submit usually, but here we can stick to settings sync
                                                onCheckedChange={(checked) => handleFormChange('fixedLifestyleMode', checked)}
                                            />
                                        </div>
                                    )}

                                    {/* Percentage Legend */}
                                    {!isAbsoluteMode && (
                                        <div className="grid grid-cols-3 gap-4 animate-in fade-in">
                                            {Object.entries(FINANCIAL_PRIORITIES).sort(([, a], [, b]) => a.order - b.order).map(([key, config]) => (
                                                <div key={key} className="text-center space-y-1">
                                                    <div className="flex items-center justify-center gap-2 mb-1">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t(`settings.goals.priorities.${key}`)}</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900">{Math.round(currentValues[key])}%</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
                {/* --- STATIC ACTION BUTTONS --- */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <CustomButton
                        onClick={handleResetToDefaults}
                        variant="outline"
                        className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                        {t('settings.actions.reset')}
                    </CustomButton>

                    <CustomButton
                        onClick={() => logout()}
                        variant="outline"
                        className="w-full sm:w-auto text-gray-600 hover:text-gray-900"
                    >
                        {t('settings.actions.logout')}
                    </CustomButton>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {hasChanges && (
                            <div className="flex items-center gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-right-4 duration-300">
                                <CustomButton
                                    onClick={handleDiscard}
                                    variant="ghost"
                                    className="w-full sm:w-auto"
                                >
                                    {t('settings.actions.discard')}
                                </CustomButton>
                            </div>
                        )}

                        <CustomButton
                            onClick={handleGlobalSave}
                            disabled={isGlobalSaving || !hasChanges}
                            variant="primary"
                            className="w-full sm:w-auto min-w-[140px]"
                        >
                            {isGlobalSaving ? t('common.saving') : <><Save className="w-4 h-4 mr-2" />{t('settings.actions.save')}</>}
                        </CustomButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
