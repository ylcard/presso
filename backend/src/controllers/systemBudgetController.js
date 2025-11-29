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
      where.AND.push({
        endDate: {
          gte: new Date(startDate),
        },
      });
    }
    if (endDate) {
      where.AND.push({
        startDate: {
          lte: new Date(endDate),
        },
      });
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
    throw new ApiError(404, 'System budget not found');
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
  const data = {
    ...req.body,
    userId: req.user.id,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
  };

  const budget = await prisma.systemBudget.create({
    data,
  });

  res.status(201).json({
    success: true,
    message: 'System budget created successfully',
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
    throw new ApiError(404, 'System budget not found');
  }

  const updateData = { ...req.body };
  if (req.body.startDate) {
    updateData.startDate = new Date(req.body.startDate);
  }
  if (req.body.endDate) {
    updateData.endDate = new Date(req.body.endDate);
  }

  const budget = await prisma.systemBudget.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'System budget updated successfully',
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
    throw new ApiError(404, 'System budget not found');
  }

  await prisma.systemBudget.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'System budget deleted successfully',
  });
});
