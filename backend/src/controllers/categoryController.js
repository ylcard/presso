import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/categories
 * @desc    Get all categories for authenticated user
 * @access  Private
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: {
      userId: req.user.id,
    },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: categories,
  });
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category
 * @access  Private
 */
export const getCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.json({
    success: true,
    data: category,
  });
});

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private
 */
export const createCategory = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    userId: req.user.id,
  };

  const category = await prisma.category.create({
    data,
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private
 */
export const updateCategory = asyncHandler(async (req, res) => {
  // Check if category exists and belongs to user
  const existingCategory = await prisma.category.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existingCategory) {
    throw new ApiError(404, 'Category not found');
  }

  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Check if category has transactions
  if (category._count.transactions > 0) {
    throw new ApiError(400, `Cannot delete category with ${category._count.transactions} associated transactions. Please reassign or delete the transactions first.`);
  }

  await prisma.category.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});

/**
 * @route   GET /api/categories/:id/transactions
 * @desc    Get all transactions for a specific category
 * @access  Private
 */
export const getCategoryTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Verify category belongs to user
  const category = await prisma.category.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const where = {
    categoryId: req.params.id,
    userId: req.user.id,
  };

  const total = await prisma.transaction.count({ where });

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: {
      date: 'desc',
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
