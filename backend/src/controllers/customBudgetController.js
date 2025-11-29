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
    throw new ApiError(404, 'Custom budget not found');
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
  const data = {
    ...req.body,
    userId: req.user.id,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
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
    message: 'Custom budget created successfully',
    data: budget,
  });
});

/**
 * @route   PUT /api/custom-budgets/:id
 * @desc    Update custom budget
 * @access  Private
 */
export const updateCustomBudget = asyncHandler(async (req, res) => {
  // Check if budget exists and belongs to user
  const existingBudget = await prisma.customBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existingBudget) {
    throw new ApiError(404, 'Custom budget not found');
  }

  const updateData = { ...req.body };
  if (req.body.startDate) {
    updateData.startDate = new Date(req.body.startDate);
  }
  if (req.body.endDate) {
    updateData.endDate = new Date(req.body.endDate);
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
    message: 'Custom budget updated successfully',
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
    throw new ApiError(404, 'Custom budget not found');
  }

  // Delete will cascade to allocations
  await prisma.customBudget.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Custom budget deleted successfully',
  });
});

/**
 * @route   GET /api/custom-budgets/:id/allocations
 * @desc    Get all allocations for a custom budget
 * @access  Private
 */
export const getCustomBudgetAllocations = asyncHandler(async (req, res) => {
  // Verify budget belongs to user
  const budget = await prisma.customBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'Custom budget not found');
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

  // Verify budget belongs to user
  const budget = await prisma.customBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'Custom budget not found');
  }

  // Verify category belongs to user
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId: req.user.id,
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const allocation = await prisma.customBudgetAllocation.create({
    data: {
      customBudgetId: req.params.id,
      categoryId,
      allocatedAmount,
    },
    include: {
      category: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Allocation added successfully',
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

  // Verify budget belongs to user
  const budget = await prisma.customBudget.findFirst({
    where: {
      id: budgetId,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'Custom budget not found');
  }

  // Verify allocation exists for this budget
  const existingAllocation = await prisma.customBudgetAllocation.findFirst({
    where: {
      id: allocationId,
      customBudgetId: budgetId,
    },
  });

  if (!existingAllocation) {
    throw new ApiError(404, 'Allocation not found');
  }

  const allocation = await prisma.customBudgetAllocation.update({
    where: { id: allocationId },
    data: req.body,
    include: {
      category: true,
    },
  });

  res.json({
    success: true,
    message: 'Allocation updated successfully',
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

  // Verify budget belongs to user
  const budget = await prisma.customBudget.findFirst({
    where: {
      id: budgetId,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'Custom budget not found');
  }

  // Verify allocation exists for this budget
  const allocation = await prisma.customBudgetAllocation.findFirst({
    where: {
      id: allocationId,
      customBudgetId: budgetId,
    },
  });

  if (!allocation) {
    throw new ApiError(404, 'Allocation not found');
  }

  await prisma.customBudgetAllocation.delete({
    where: { id: allocationId },
  });

  res.json({
    success: true,
    message: 'Allocation deleted successfully',
  });
});
