import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions for authenticated user
 * @access  Private
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'date',
    order = 'desc',
    type,
    categoryId,
    paymentStatus,
    cashStatus,
    financialPriority,
    customBudgetId,
    startDate,
    endDate,
    search,
  } = req.query;

  const skip = (page - 1) * limit;

  // Build filter conditions
  const where = {
    userId: req.user.id,
  };

  if (type && type !== 'all') {
    where.type = type;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (paymentStatus && paymentStatus !== 'all') {
    where.isPaid = paymentStatus === 'paid';
  }

  if (cashStatus && cashStatus !== 'all') {
    if (cashStatus === 'cash_only') {
      where.isCashTransaction = true;
    } else if (cashStatus === 'exclude_cash') {
      where.isCashTransaction = false;
    }
  }

  if (financialPriority && financialPriority !== 'all') {
    where.financial_priority = financialPriority;
  }

  if (customBudgetId && customBudgetId !== 'all') {
    where.customBudgetId = customBudgetId;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  if (search) {
    where.title = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Get total count for pagination
  const total = await prisma.transaction.count({ where });

  // Get transactions
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: true,
      customBudget: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      [sortBy]: order,
    },
    skip: parseInt(skip),
    take: parseInt(limit),
  });

  res.json({
    success: true,
    data: transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction
 * @access  Private
 */
export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: {
      category: true,
      customBudget: true,
    },
  });

  if (!transaction) {
    throw new ApiError(404, 'TRANSACTION_NOT_FOUND');
  }

  res.json({
    success: true,
    data: transaction,
  });
});

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private
 */
export const createTransaction = asyncHandler(async (req, res) => {
  // SAFETY: Explicitly cast amount to Number to prevent data integrity issues
  const data = {
    ...req.body,
    userId: req.user.id,
    date: new Date(req.body.date),
    paidDate: req.body.paidDate ? new Date(req.body.paidDate) : null,
    amount: Number(req.body.amount), 
  };

  // NOTE: Cash Wallet logic removed as feature is deprecated.
  // We still allow 'isCashTransaction' to be saved for record-keeping if provided.

  const transaction = await prisma.transaction.create({
    data,
    include: {
      category: true,
      customBudget: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'TRANSACTION_CREATED',
    data: transaction,
  });
});

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
export const updateTransaction = asyncHandler(async (req, res) => {
  // Check if transaction exists and belongs to user
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existingTransaction) {
    throw new ApiError(404, 'TRANSACTION_NOT_FOUND');
  }

  const updateData = {
    ...req.body,
  };

  if (req.body.date) {
    updateData.date = new Date(req.body.date);
  }

  if (req.body.paidDate) {
    updateData.paidDate = new Date(req.body.paidDate);
  }

  // SAFETY: Ensure amount is stored as number if it's being updated
  if (req.body.amount !== undefined) {
    updateData.amount = Number(req.body.amount);
  }

  // NOTE: Cash Wallet refunds/deductions logic removed.

  const transaction = await prisma.transaction.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      category: true,
      customBudget: true,
    },
  });

  res.json({
    success: true,
    message: 'TRANSACTION_UPDATED',
    data: transaction,
  });
});

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!transaction) {
    throw new ApiError(404, 'TRANSACTION_NOT_FOUND');
  }

  // NOTE: Cash Wallet refund logic removed.

  await prisma.transaction.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'TRANSACTION_DELETED',
  });
});

/**
 * @route   GET /api/transactions/stats/summary
 * @desc    Get transaction summary statistics
 * @access  Private
 */
export const getTransactionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {
    userId: req.user.id,
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  // Get income
  const income = await prisma.transaction.aggregate({
    where: {
      ...where,
      type: 'income',
    },
    _sum: {
      amount: true,
    },
  });

  // Get total expenses
  const totalExpenses = await prisma.transaction.aggregate({
    where: {
      ...where,
      type: 'expense',
    },
    _sum: {
      amount: true,
    },
  });

  // Get paid expenses
  const paidExpenses = await prisma.transaction.aggregate({
    where: {
      ...where,
      type: 'expense',
      isPaid: true,
    },
    _sum: {
      amount: true,
    },
  });

  // Get unpaid expenses
  const unpaidExpenses = await prisma.transaction.aggregate({
    where: {
      ...where,
      type: 'expense',
      isPaid: false,
    },
    _sum: {
      amount: true,
    },
  });

  // Get expenses by priority
  const expensesByPriority = await prisma.transaction.groupBy({
    by: ['financial_priority'],
    where: {
      ...where,
      type: 'expense',
      isPaid: true,
    },
    _sum: {
      amount: true,
    },
  });

  const priorityBreakdown = {
    needs: 0,
    wants: 0,
    savings: 0,
  };

  expensesByPriority.forEach(item => {
    if (item.financial_priority && priorityBreakdown.hasOwnProperty(item.financial_priority)) {
      priorityBreakdown[item.financial_priority] = item._sum.amount || 0;
    }
  });

  res.json({
    success: true,
    data: {
      income: income._sum.amount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      paidExpenses: paidExpenses._sum.amount || 0,
      unpaidExpenses: unpaidExpenses._sum.amount || 0,
      remaining: (income._sum.amount || 0) - (totalExpenses._sum.amount || 0),
      priorityBreakdown,
    },
  });
});

/**
 * @route   POST /api/transactions/bulk
 * @desc    Bulk create transactions
 * @access  Private
 */
export const bulkCreateTransactions = asyncHandler(async (req, res) => {
  const { transactions } = req.body; // Expects an array of transaction objects

  // GUARD: Prevent crash if transactions is null or not an array
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  // Format data to ensure strict type compliance
  const formattedTransactions = transactions.map(t => ({
    ...t,
    userId: req.user.id,
    date: new Date(t.date),
    paidDate: t.paidDate ? new Date(t.paidDate) : null,
    amount: Number(t.amount),
    // Cash wallet logic ignored
  }));

  const result = await prisma.transaction.createMany({
    data: formattedTransactions,
    skipDuplicates: true,
  });

  res.status(201).json({
    success: true,
    message: 'TRANSACTIONS_CREATED_BULK',
    data: { count: result.count },
  });
});

/**
 * @route   POST /api/transactions/bulk-delete
 * @desc    Bulk delete transactions
 * @access  Private
 */
export const bulkDeleteTransactions = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  // GUARD: Prevent crash if ids is null or not an array
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  const result = await prisma.transaction.deleteMany({
    where: {
      id: { in: ids },
      userId: req.user.id,
    },
  });

  res.json({
    success: true,
    message: 'TRANSACTIONS_DELETED_BULK',
    data: { count: result.count },
  });
});
