import { z } from 'zod';

// ==================== USER SCHEMAS ====================
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ==================== TRANSACTION SCHEMAS ====================
export const createTransactionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.coerce.date(),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be either income or expense' }),
  }),
  isPaid: z.boolean().default(false),
  paidDate: z.coerce.date().nullable().optional(),
  notes: z.string().optional().nullable(),
  financial_priority: z.enum(['needs', 'wants', 'savings']).optional().nullable(),
  isCashTransaction: z.boolean().default(false),
  categoryId: z.string().optional().nullable(),
  customBudgetId: z.string().optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// ==================== CATEGORY SCHEMAS ====================
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  priority: z.enum(['needs', 'wants', 'savings'], {
    errorMap: () => ({ message: 'Priority must be needs, wants, or savings' }),
  }),
});

export const updateCategorySchema = createCategorySchema.partial();

// ==================== BUDGET GOAL SCHEMAS ====================
export const createBudgetGoalSchema = z.object({
  priority: z.enum(['needs', 'wants', 'savings']),
  target_percentage: z.number().min(0).max(100).optional().nullable(),
  target_amount: z.number().min(0).optional().nullable(),
  is_absolute: z.boolean().default(false),
}).refine(
  (data) => {
    // Either target_percentage or target_amount must be provided
    return (data.target_percentage !== null && data.target_percentage !== undefined) ||
      (data.target_amount !== null && data.target_amount !== undefined);
  },
  {
    message: 'Either target_percentage or target_amount must be provided',
  }
);

export const updateBudgetGoalSchema = z.object({
  target_percentage: z.number().min(0).max(100).optional().nullable(),
  target_amount: z.number().min(0).optional().nullable(),
  is_absolute: z.boolean().optional(),
});

// ==================== SYSTEM BUDGET SCHEMAS ====================
export const createSystemBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  budgetAmount: z.number().min(0, 'Budget amount must be non-negative'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  color: z.string().optional().nullable(),
  systemBudgetType: z.enum(['needs', 'wants', 'savings']),
});

export const updateSystemBudgetSchema = createSystemBudgetSchema.partial();

// ==================== CUSTOM BUDGET SCHEMAS ====================
export const createCustomBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  allocatedAmount: z.number().min(0, 'Allocated amount must be non-negative'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(['active', 'planned', 'completed', 'archived']).default('active'),
});

export const updateCustomBudgetSchema = createCustomBudgetSchema.partial();

// ==================== CUSTOM BUDGET ALLOCATION SCHEMAS ====================
export const createCustomBudgetAllocationSchema = z.object({
  customBudgetId: z.string().min(1, 'Custom budget ID is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  allocatedAmount: z.number().min(0, 'Allocated amount must be non-negative'),
});

export const updateCustomBudgetAllocationSchema = z.object({
  allocatedAmount: z.number().min(0, 'Allocated amount must be non-negative'),
});

// ==================== MINI BUDGET SCHEMAS ====================
export const createMiniBudgetSchema = z.object({
  name: z.string().min(1, 'Mini budget name is required'),
  allocatedAmount: z.number().min(0, 'Allocated amount must be non-negative'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(['active', 'planned', 'completed', 'archived']).default('active'),
});

export const updateMiniBudgetSchema = createMiniBudgetSchema.partial();

// ==================== USER SETTINGS SCHEMAS ====================
export const createUserSettingsSchema = z.object({
  baseCurrency: z.string().default('USD'),
  currencyPosition: z.enum(['before', 'after']).default('before'),
  thousandSeparator: z.string().default(','),
  decimalSeparator: z.string().default('.'),
  decimalPlaces: z.number().int().min(0).max(4).default(2),
  hideTrailingZeros: z.boolean().default(false),
  dateFormat: z.string().default('MMM dd, yyyy'),
  budgetViewMode: z.enum(['bars', 'cards']).default('bars'),
  fixedLifestyleMode: z.boolean().default(false),
  goalMode: z.boolean().default(true),
});

export const updateUserSettingsSchema = createUserSettingsSchema.partial();

// ==================== EXCHANGE RATE SCHEMAS ====================
export const createExchangeRateSchema = z.object({
  fromCurrency: z.string().length(3, 'Currency code must be 3 characters'),
  toCurrency: z.string().length(3, 'Currency code must be 3 characters'),
  rate: z.number().positive('Rate must be positive'),
});

export const updateExchangeRateSchema = z.object({
  rate: z.number().positive('Rate must be positive'),
});

// ==================== CASH WALLET SCHEMAS ====================
export const updateCashWalletSchema = z.object({
  amount: z.number().min(0, 'Amount must be non-negative'),
});

// ==================== CATEGORY RULE SCHEMAS ====================
export const createCategoryRuleSchema = z.object({
  priority: z.number().int().default(0),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
});

export const updateCategoryRuleSchema = createCategoryRuleSchema.partial();

// ==================== QUERY PARAMETER SCHEMAS ====================
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const transactionFilterSchema = z.object({
  type: z.enum(['income', 'expense', 'all']).optional(),
  categoryId: z.string().optional(),
  paymentStatus: z.enum(['paid', 'unpaid', 'all']).optional(),
  cashStatus: z.enum(['cash_only', 'exclude_cash', 'all']).optional(),
  financialPriority: z.enum(['needs', 'wants', 'savings', 'all']).optional(),
  customBudgetId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
