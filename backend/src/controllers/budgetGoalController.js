import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/budget-goals
 * @desc    Get all budget goals for authenticated user
 * @access  Private
 */
export const getBudgetGoals = asyncHandler(async (req, res) => {
  const goals = await prisma.budgetGoal.findMany({
    where: {
      userId: req.user.id,
    },
    orderBy: {
      priority: 'asc',
    },
  });

  res.json({
    success: true,
    data: goals,
  });
});

/**
 * @route   GET /api/budget-goals/:priority
 * @desc    Get budget goal by priority
 * @access  Private
 */
export const getBudgetGoalByPriority = asyncHandler(async (req, res) => {
  const { priority } = req.params;

  if (!['needs', 'wants', 'savings'].includes(priority)) {
    throw new ApiError(400, 'Invalid priority. Must be needs, wants, or savings');
  }

  const goal = await prisma.budgetGoal.findFirst({
    where: {
      userId: req.user.id,
      priority,
    },
  });

  if (!goal) {
    throw new ApiError(404, 'Budget goal not found');
  }

  res.json({
    success: true,
    data: goal,
  });
});

/**
 * @route   POST /api/budget-goals
 * @desc    Create new budget goal
 * @access  Private
 */
export const createBudgetGoal = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    userId: req.user.id,
  };

  const goal = await prisma.budgetGoal.create({
    data,
  });

  res.status(201).json({
    success: true,
    message: 'Budget goal created successfully',
    data: goal,
  });
});

/**
 * @route   PUT /api/budget-goals/:id
 * @desc    Update budget goal
 * @access  Private
 */
export const updateBudgetGoal = asyncHandler(async (req, res) => {
  // Check if goal exists and belongs to user
  const existingGoal = await prisma.budgetGoal.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existingGoal) {
    throw new ApiError(404, 'Budget goal not found');
  }

  const goal = await prisma.budgetGoal.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({
    success: true,
    message: 'Budget goal updated successfully',
    data: goal,
  });
});

/**
 * @route   DELETE /api/budget-goals/:id
 * @desc    Delete budget goal
 * @access  Private
 */
export const deleteBudgetGoal = asyncHandler(async (req, res) => {
  const goal = await prisma.budgetGoal.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!goal) {
    throw new ApiError(404, 'Budget goal not found');
  }

  await prisma.budgetGoal.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Budget goal deleted successfully',
  });
});
