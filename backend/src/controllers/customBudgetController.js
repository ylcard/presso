import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/custom-budgets
 * @desc    Get all custom budgets for authenticated user
 * @access  Private
 */
export const getCustomBudgets = asyncHandler(async (req, res) => {
  const { status, sortBy = 'createdAt' } = req.query;

  const where = {
    userId: req.user.id,
  };

  if (status && status !== 'all') {
    where.status = status;
  }

  const budgets = await prisma.customBudget.findMany({
    where,
    include: {
      allocations: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: {
      [sortBy]: 'desc',
    },
  });

  res.json({
    success: true,
    data: budgets,
  });
});

/**
 * @route   GET /api/custom-budgets/:id
 * @desc    Get single custom budget
 * @access  Private
 */
export const getCustomBudget = asyncHandler(async (req, res) => {
  const budget = await prisma.customBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: {
      allocations: {
        include: {
          category: true,
        },
      },
      transactions: {
        include: {
          category: true,
        },
        orderBy: {
          date: 'desc',
        },
      },
    },
  });

  if (!budget) {
    throw new ApiError(404, 'CUSTOM_BUDGET_NOT_FOUND');
  }

  res.json({
    success: true,
    data: budget,
  });
});

/**
 * @route   POST /api/custom-budgets
 * @desc    Create new custom budget
 * @access  Private
 */
export const createCustomBudget = asyncHandler(async (req, res) => {
  // SAFETY: Validate dates
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
    allocatedAmount: Number(req.body.allocatedAmount), // Safety Cast
  };

  const budget = await prisma.customBudget.create({
    data,
    include: {
      allocations: {
        include: {
          category: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'CUSTOM_BUDGET_CREATED',
    data: budget,
  });
});

/**
 * @route   PUT /api/custom-budgets/:id
 * @desc    Update custom budget
 * @access  Private
 */
export const updateCustomBudget = asyncHandler(async (req, res) => {
  const existingBudget = await prisma.customBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existingBudget) {
    throw new ApiError(404, 'CUSTOM_BUDGET_NOT_FOUND');
  }

  const updateData = { ...req.body };
  
  // SAFETY: Validate inputs if they exist
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
  if (req.body.allocatedAmount !== undefined) {
    updateData.allocatedAmount = Number(req.body.allocatedAmount);
  }

  const budget = await prisma.customBudget.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      allocations: {
        include: {
          category: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: 'CUSTOM_BUDGET_UPDATED',
    data: budget,
  });
});

/**
 * @route   DELETE /api/custom-budgets/:id
 * @desc    Delete custom budget
 * @access  Private
 */
export const deleteCustomBudget = asyncHandler(async (req, res) => {
  const budget = await prisma.customBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'CUSTOM_BUDGET_NOT_FOUND');
  }

  await prisma.customBudget.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'CUSTOM_BUDGET_DELETED',
  });
});

/**
 * @route   GET /api/custom-budgets/:id/allocations
 * @desc    Get all allocations for a custom budget
 * @access  Private
 */
export const getCustomBudgetAllocations = asyncHandler(async (req, res) => {
  const budget = await prisma.customBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'CUSTOM_BUDGET_NOT_FOUND');
  }

  const allocations = await prisma.customBudgetAllocation.findMany({
    where: {
      customBudgetId: req.params.id,
    },
    include: {
      category: true,
    },
  });

  res.json({
    success: true,
    data: allocations,
  });
});

/**
 * @route   POST /api/custom-budgets/:id/allocations
 * @desc    Add allocation to custom budget
 * @access  Private
 */
export const addCustomBudgetAllocation = asyncHandler(async (req, res) => {
  const { categoryId, allocatedAmount } = req.body;

  const budget = await prisma.customBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'CUSTOM_BUDGET_NOT_FOUND');
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId: req.user.id,
    },
  });

  if (!category) {
    throw new ApiError(404, 'CATEGORY_NOT_FOUND');
  }

  const allocation = await prisma.customBudgetAllocation.create({
    data: {
      customBudgetId: req.params.id,
      categoryId,
      allocatedAmount: Number(allocatedAmount), // Safety Cast
    },
    include: {
      category: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'ALLOCATION_ADDED',
    data: allocation,
  });
});

/**
 * @route   PUT /api/custom-budgets/:budgetId/allocations/:allocationId
 * @desc    Update custom budget allocation
 * @access  Private
 */
export const updateCustomBudgetAllocation = asyncHandler(async (req, res) => {
  const { budgetId, allocationId } = req.params;

  const budget = await prisma.customBudget.findFirst({
    where: {
      id: budgetId,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'CUSTOM_BUDGET_NOT_FOUND');
  }

  const existingAllocation = await prisma.customBudgetAllocation.findFirst({
    where: {
      id: allocationId,
      customBudgetId: budgetId,
    },
  });

  if (!existingAllocation) {
    throw new ApiError(404, 'ALLOCATION_NOT_FOUND');
  }

  const data = { ...req.body };
  if (data.allocatedAmount !== undefined) {
    data.allocatedAmount = Number(data.allocatedAmount);
  }

  const allocation = await prisma.customBudgetAllocation.update({
    where: { id: allocationId },
    data,
    include: {
      category: true,
    },
  });

  res.json({
    success: true,
    message: 'ALLOCATION_UPDATED',
    data: allocation,
  });
});

/**
 * @route   DELETE /api/custom-budgets/:budgetId/allocations/:allocationId
 * @desc    Delete custom budget allocation
 * @access  Private
 */
export const deleteCustomBudgetAllocation = asyncHandler(async (req, res) => {
  const { budgetId, allocationId } = req.params;

  const budget = await prisma.customBudget.findFirst({
    where: {
      id: budgetId,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'CUSTOM_BUDGET_NOT_FOUND');
  }

  const allocation = await prisma.customBudgetAllocation.findFirst({
    where: {
      id: allocationId,
      customBudgetId: budgetId,
    },
  });

  if (!allocation) {
    throw new ApiError(404, 'ALLOCATION_NOT_FOUND');
  }

  await prisma.customBudgetAllocation.delete({
    where: { id: allocationId },
  });

  res.json({
    success: true,
    message: 'ALLOCATION_DELETED',
  });
});

/**
 * @route   POST /api/custom-budgets/bulk
 * @desc    Bulk create custom budgets
 * @access  Private
 */
export const bulkCreateCustomBudgets = asyncHandler(async (req, res) => {
  const { budgets } = req.body;

  // GUARD: Prevent crash
  if (!budgets || !Array.isArray(budgets) || budgets.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  const formattedBudgets = budgets.map(b => ({
    ...b,
    userId: req.user.id,
    startDate: new Date(b.startDate),
    endDate: new Date(b.endDate),
    allocatedAmount: Number(b.allocatedAmount),
  }));

  if (formattedBudgets.some(b => isNaN(b.startDate.getTime()) || isNaN(b.endDate.getTime()))) {
    throw new ApiError(400, 'INVALID_DATE_FORMAT');
  }

  const result = await prisma.customBudget.createMany({
    data: formattedBudgets,
  });

  res.status(201).json({
    success: true,
    message: 'CUSTOM_BUDGETS_CREATED_BULK',
    data: { count: result.count },
  });
});

/**
 * @route   POST /api/custom-budgets/bulk-delete
 * @desc    Bulk delete custom budgets
 * @access  Private
 */
export const bulkDeleteCustomBudgets = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  const result = await prisma.customBudget.deleteMany({
    where: {
      id: { in: ids },
      userId: req.user.id,
    },
  });

  res.json({
    success: true,
    message: 'CUSTOM_BUDGETS_DELETED_BULK',
    data: { count: result.count },
  });
});
