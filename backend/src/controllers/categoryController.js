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
    throw new ApiError(404, 'CATEGORY_NOT_FOUND');
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
    message: 'CATEGORY_CREATED',
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
    throw new ApiError(404, 'CATEGORY_NOT_FOUND');
  }

  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({
    success: true,
    message: 'CATEGORY_UPDATED',
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
    throw new ApiError(404, 'CATEGORY_NOT_FOUND');
  }

  // Check if category has transactions
  if (category._count.transactions > 0) {
    throw new ApiError(400, 'CATEGORY_HAS_TRANSACTIONS', { names: category.name, count: category._count.transactions });
  }

  await prisma.category.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'CATEGORY_DELETED',
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
    throw new ApiError(404, 'CATEGORY_NOT_FOUND');
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

/**
 * @route   POST /api/categories/bulk
 * @desc    Bulk create categories
 * @access  Private
 */
export const bulkCreateCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }
  
  const formattedCategories = categories.map(c => ({
    ...c,
    userId: req.user.id,
  }));

  const result = await prisma.category.createMany({
    data: formattedCategories,
    skipDuplicates: true,
  });

  res.status(201).json({
    success: true,
    message: 'CATEGORIES_CREATED_BULK',
    data: { count: result.count }
  });
});

/**
 * @route   POST /api/categories/bulk-delete
 * @desc    Bulk delete categories
 * @access  Private
 */
export const bulkDeleteCategories = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }
  
  // 1. Safety Check: Do ANY of these categories have transactions?
  // We cannot trust deleteMany to handle this logic for us
  const categoriesWithTransactions = await prisma.category.findMany({
    where: {
      id: { in: ids },
      userId: req.user.id,
      transactions: { some: {} } // Checks if at least one transaction exists
    },
    select: { name: true }
  });

  if (categoriesWithTransactions.length > 0) {
    const names = categoriesWithTransactions.map(c => c.name).join(', ');
    throw new ApiError(400, 'CATEGORY_HAS_TRANSACTIONS', { names });
  }

  // 2. Safe to delete all
  const result = await prisma.category.deleteMany({
    where: {
      id: { in: ids },
      userId: req.user.id,
    },
  });

  res.json({
    success: true,
    message: 'CATEGORIES_DELETED_BULK',
    data: { count: result.count }
  });
});
