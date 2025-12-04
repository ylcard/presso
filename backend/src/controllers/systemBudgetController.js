import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/system-budgets
 * @desc    Get all system budgets for authenticated user
 * @access  Private
 */
export const getSystemBudgets = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {
    userId: req.user.id,
  };

  // Filter by date range if provided
  if (startDate || endDate) {
    where.AND = [];
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        where.AND.push({
          endDate: {
            gte: start,
          },
        });
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        where.AND.push({
          startDate: {
            lte: end,
          },
        });
      }
    }
  }

  const budgets = await prisma.systemBudget.findMany({
    where,
    orderBy: [
      { startDate: 'desc' },
      { systemBudgetType: 'asc' },
    ],
  });

  res.json({
    success: true,
    data: budgets,
  });
});

/**
 * @route   GET /api/system-budgets/:id
 * @desc    Get single system budget
 * @access  Private
 */
export const getSystemBudget = asyncHandler(async (req, res) => {
  const budget = await prisma.systemBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'SYSTEM_BUDGET_NOT_FOUND');
  }

  res.json({
    success: true,
    data: budget,
  });
});

/**
 * @route   POST /api/system-budgets
 * @desc    Create new system budget
 * @access  Private
 */
export const createSystemBudget = asyncHandler(async (req, res) => {
  // SAFETY: Validate dates before passing to DB to avoid crashes
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ApiError(400, 'INVALID_DATE_FORMAT');
  }

  const data = {
    ...req.body,
    userId: req.user.id,
    startDate,
    endDate,
    // SAFETY: Explicit casting to prevent string-math issues
    budgetAmount: Number(req.body.budgetAmount),
  };

  const budget = await prisma.systemBudget.create({
    data,
  });

  res.status(201).json({
    success: true,
    message: 'SYSTEM_BUDGET_CREATED',
    data: budget,
  });
});

/**
 * @route   PUT /api/system-budgets/:id
 * @desc    Update system budget
 * @access  Private
 */
export const updateSystemBudget = asyncHandler(async (req, res) => {
  // Check if budget exists and belongs to user
  const existingBudget = await prisma.systemBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existingBudget) {
    throw new ApiError(404, 'SYSTEM_BUDGET_NOT_FOUND');
  }

  const updateData = { ...req.body };
  
  // SAFETY: Validate dates if they are being updated
  if (req.body.startDate) {
    const start = new Date(req.body.startDate);
    if (isNaN(start.getTime())) throw new ApiError(400, 'INVALID_DATE_FORMAT');
    updateData.startDate = start;
  }
  
  if (req.body.endDate) {
    const end = new Date(req.body.endDate);
    if (isNaN(end.getTime())) throw new ApiError(400, 'INVALID_DATE_FORMAT');
    updateData.endDate = end;
  }

  // SAFETY: Cast amount
  if (req.body.budgetAmount !== undefined) {
    updateData.budgetAmount = Number(req.body.budgetAmount);
  }

  const budget = await prisma.systemBudget.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'SYSTEM_BUDGET_UPDATED',
    data: budget,
  });
});

/**
 * @route   DELETE /api/system-budgets/:id
 * @desc    Delete system budget
 * @access  Private
 */
export const deleteSystemBudget = asyncHandler(async (req, res) => {
  const budget = await prisma.systemBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'SYSTEM_BUDGET_NOT_FOUND');
  }

  await prisma.systemBudget.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'SYSTEM_BUDGET_DELETED',
  });
});

/**
 * @route   POST /api/system-budgets/bulk
 * @desc    Bulk create system budgets (Idempotent: Skips existing ones)
 * @access  Private
 */
export const bulkCreateSystemBudgets = asyncHandler(async (req, res) => {
  const { budgets } = req.body;

  // GUARD: Prevent crash if budgets is null/undefined
  if (!budgets || !Array.isArray(budgets) || budgets.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  const formattedBudgets = budgets.map(b => ({
    ...b,
    userId: req.user.id,
    startDate: new Date(b.startDate),
    endDate: new Date(b.endDate),
    budgetAmount: Number(b.budgetAmount),
  }));

  // Check for invalid dates in bulk
  if (formattedBudgets.some(b => isNaN(b.startDate.getTime()) || isNaN(b.endDate.getTime()))) {
    throw new ApiError(400, 'INVALID_DATE_FORMAT');
  }

const uniqueStartDates = [...new Set(candidates.map(c => c.startDate.toISOString()))];
  
  const existingBudgets = await prisma.systemBudget.findMany({
    where: {
      userId: req.user.id,
      startDate: { in: uniqueStartDates.map(d => new Date(d)) }
    },
    select: {
      startDate: true,
      systemBudgetType: true
    }
  });

  // Create a "Signature Set" of existing budgets for O(1) lookups
  // Format: "YYYY-MM-DDTHH:mm:ss.sssZ|needs"
  const existingSignatures = new Set(
    existingBudgets.map(b => `${b.startDate.toISOString()}|${b.systemBudgetType}`)
  );

  // 3. Keep only the budgets that DO NOT exist yet
  const newBudgets = candidates.filter(c => 
    !existingSignatures.has(`${c.startDate.toISOString()}|${c.systemBudgetType}`)
  );

  // If everything already exists, return success with 0 count (Idempotent)
  if (newBudgets.length === 0) {
    return res.json({
      success: true,
      message: 'SYSTEM_BUDGETS_UP_TO_DATE',
      data: { count: 0 }
    });
  }
  
  const result = await prisma.systemBudget.createMany({
    data: formattedBudgets,
    skipDuplicates: true,
  });

  res.status(201).json({
    success: true,
    message: 'SYSTEM_BUDGETS_CREATED_BULK',
    data: { count: result.count },
  });
});

/**
 * @route   POST /api/system-budgets/bulk-delete
 * @desc    Bulk delete system budgets
 * @access  Private
 */
export const bulkDeleteSystemBudgets = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  const result = await prisma.systemBudget.deleteMany({
    where: {
      id: { in: ids },
      userId: req.user.id,
    },
  });

  res.json({
    success: true,
    message: 'SYSTEM_BUDGETS_DELETED_BULK',
    data: { count: result.count },
  });
});
