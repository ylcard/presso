import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/mini-budgets
 * @desc    Get all mini budgets for authenticated user
 * @access  Private
 */
export const getMiniBudgets = asyncHandler(async (req, res) => {
  const { status, sortBy = 'createdAt' } = req.query;

  const where = {
    userId: req.user.id,
  };

  if (status && status !== 'all') {
    where.status = status;
  }

  const budgets = await prisma.miniBudget.findMany({
    where,
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
 * @route   GET /api/mini-budgets/:id
 * @desc    Get single mini budget
 * @access  Private
 */
export const getMiniBudget = asyncHandler(async (req, res) => {
  const budget = await prisma.miniBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'Mini budget not found');
  }

  res.json({
    success: true,
    data: budget,
  });
});

/**
 * @route   POST /api/mini-budgets
 * @desc    Create new mini budget
 * @access  Private
 */
export const createMiniBudget = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    userId: req.user.id,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
  };

  const budget = await prisma.miniBudget.create({
    data,
  });

  res.status(201).json({
    success: true,
    message: 'Mini budget created successfully',
    data: budget,
  });
});

/**
 * @route   PUT /api/mini-budgets/:id
 * @desc    Update mini budget
 * @access  Private
 */
export const updateMiniBudget = asyncHandler(async (req, res) => {
  // Check if budget exists and belongs to user
  const existingBudget = await prisma.miniBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existingBudget) {
    throw new ApiError(404, 'Mini budget not found');
  }

  const updateData = { ...req.body };
  if (req.body.startDate) {
    updateData.startDate = new Date(req.body.startDate);
  }
  if (req.body.endDate) {
    updateData.endDate = new Date(req.body.endDate);
  }

  const budget = await prisma.miniBudget.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'Mini budget updated successfully',
    data: budget,
  });
});

/**
 * @route   DELETE /api/mini-budgets/:id
 * @desc    Delete mini budget
 * @access  Private
 */
export const deleteMiniBudget = asyncHandler(async (req, res) => {
  const budget = await prisma.miniBudget.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!budget) {
    throw new ApiError(404, 'Mini budget not found');
  }

  await prisma.miniBudget.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Mini budget deleted successfully',
  });
});
