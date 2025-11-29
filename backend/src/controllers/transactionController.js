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
    throw new ApiError(404, 'Transaction not found');
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
  const data = {
    ...req.body,
    userId: req.user.id,
    date: new Date(req.body.date),
    paidDate: req.body.paidDate ? new Date(req.body.paidDate) : null,
  };

  // If it's a cash transaction, update cash wallet
  if (data.isCashTransaction && data.type === 'expense' && data.isPaid) {
    const cashWallet = await prisma.cashWallet.findUnique({
      where: { userId: req.user.id },
    });

    if (cashWallet && cashWallet.amount < data.amount) {
      throw new ApiError(400, 'Insufficient cash wallet balance');
    }

    await prisma.cashWallet.update({
      where: { userId: req.user.id },
      data: {
        amount: {
          decrement: data.amount,
        },
      },
    });
  }

  const transaction = await prisma.transaction.create({
    data,
    include: {
      category: true,
      customBudget: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
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
    throw new ApiError(404, 'Transaction not found');
  }

  // Handle cash wallet updates if transaction involves cash
  const wasCashPaid = existingTransaction.isCashTransaction && existingTransaction.isPaid && existingTransaction.type === 'expense';
  const willBeCashPaid = (req.body.isCashTransaction ?? existingTransaction.isCashTransaction) &&
                         (req.body.isPaid ?? existingTransaction.isPaid) &&
                         (req.body.type ?? existingTransaction.type) === 'expense';

  if (wasCashPaid && !willBeCashPaid) {
    // Reverting a cash payment - add money back to wallet
    await prisma.cashWallet.update({
      where: { userId: req.user.id },
      data: {
        amount: {
          increment: existingTransaction.amount,
        },
      },
    });
  } else if (!wasCashPaid && willBeCashPaid) {
    // New cash payment - deduct from wallet
    const newAmount = req.body.amount ?? existingTransaction.amount;
    const cashWallet = await prisma.cashWallet.findUnique({
      where: { userId: req.user.id },
    });

    if (cashWallet && cashWallet.amount < newAmount) {
      throw new ApiError(400, 'Insufficient cash wallet balance');
    }

    await prisma.cashWallet.update({
      where: { userId: req.user.id },
      data: {
        amount: {
          decrement: newAmount,
        },
      },
    });
  } else if (wasCashPaid && willBeCashPaid) {
    // Amount changed on existing cash payment
    if (req.body.amount && req.body.amount !== existingTransaction.amount) {
      const difference = req.body.amount - existingTransaction.amount;
      const cashWallet = await prisma.cashWallet.findUnique({
        where: { userId: req.user.id },
      });

      if (difference > 0 && cashWallet && cashWallet.amount < difference) {
        throw new ApiError(400, 'Insufficient cash wallet balance');
      }

      await prisma.cashWallet.update({
        where: { userId: req.user.id },
        data: {
          amount: {
            decrement: difference,
          },
        },
      });
    }
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
    message: 'Transaction updated successfully',
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
    throw new ApiError(404, 'Transaction not found');
  }

  // If it was a paid cash expense, refund to wallet
  if (transaction.isCashTransaction && transaction.isPaid && transaction.type === 'expense') {
    await prisma.cashWallet.update({
      where: { userId: req.user.id },
      data: {
        amount: {
          increment: transaction.amount,
        },
      },
    });
  }

  await prisma.transaction.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Transaction deleted successfully',
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
