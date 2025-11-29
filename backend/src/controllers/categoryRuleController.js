import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/category-rules
 * @desc    Get all category rules for authenticated user
 * @access  Private
 */
export const getCategoryRules = asyncHandler(async (req, res) => {
  const rules = await prisma.categoryRule.findMany({
    where: {
      userId: req.user.id,
    },
    include: {
      category: true,
    },
    orderBy: {
      priority: 'asc',
    },
  });

  res.json({
    success: true,
    data: rules,
  });
});

/**
 * @route   GET /api/category-rules/:id
 * @desc    Get single category rule
 * @access  Private
 */
export const getCategoryRule = asyncHandler(async (req, res) => {
  const rule = await prisma.categoryRule.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: {
      category: true,
    },
  });

  if (!rule) {
    throw new ApiError(404, 'Category rule not found');
  }

  res.json({
    success: true,
    data: rule,
  });
});

/**
 * @route   POST /api/category-rules
 * @desc    Create new category rule
 * @access  Private
 */
export const createCategoryRule = asyncHandler(async (req, res) => {
  const { categoryId, keywords, priority } = req.body;

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

  const rule = await prisma.categoryRule.create({
    data: {
      userId: req.user.id,
      categoryId,
      keywords,
      priority: priority || 0,
    },
    include: {
      category: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Category rule created successfully',
    data: rule,
  });
});

/**
 * @route   PUT /api/category-rules/:id
 * @desc    Update category rule
 * @access  Private
 */
export const updateCategoryRule = asyncHandler(async (req, res) => {
  // Check if rule exists and belongs to user
  const existingRule = await prisma.categoryRule.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existingRule) {
    throw new ApiError(404, 'Category rule not found');
  }

  // If updating categoryId, verify new category belongs to user
  if (req.body.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: req.body.categoryId,
        userId: req.user.id,
      },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
  }

  const rule = await prisma.categoryRule.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      category: true,
    },
  });

  res.json({
    success: true,
    message: 'Category rule updated successfully',
    data: rule,
  });
});

/**
 * @route   DELETE /api/category-rules/:id
 * @desc    Delete category rule
 * @access  Private
 */
export const deleteCategoryRule = asyncHandler(async (req, res) => {
  const rule = await prisma.categoryRule.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!rule) {
    throw new ApiError(404, 'Category rule not found');
  }

  await prisma.categoryRule.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Category rule deleted successfully',
  });
});
