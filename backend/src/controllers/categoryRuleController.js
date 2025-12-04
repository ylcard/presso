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
    throw new ApiError(404, 'CATEGORY_RULE_NOT_FOUND');
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

  // SAFETY: Validate keywords format (must be array of strings)
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    throw new ApiError(400, 'INVALID_KEYWORDS_FORMAT');
  }

  // Verify category belongs to user
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId: req.user.id,
    },
  });

  if (!category) {
    throw new ApiError(404, 'CATEGORY_NOT_FOUND');
  }

  const rule = await prisma.categoryRule.create({
    data: {
      userId: req.user.id,
      categoryId,
      keywords,
      priority: Number(priority) || 0,
    },
    include: {
      category: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'CATEGORY_RULE_CREATED',
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
    throw new ApiError(404, 'CATEGORY_RULE_NOT_FOUND');
  }

  const updateData = {};

  // Validate and assign fields
  if (req.body.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: req.body.categoryId,
        userId: req.user.id,
      },
    });

    if (!category) {
      throw new ApiError(404, 'CATEGORY_NOT_FOUND');
    }
    updateData.categoryId = req.body.categoryId;
  }

  if (req.body.keywords) {
    if (!Array.isArray(req.body.keywords)) {
      throw new ApiError(400, 'INVALID_KEYWORDS_FORMAT');
    }
    updateData.keywords = req.body.keywords;
  }

  if (req.body.priority !== undefined) {
    updateData.priority = Number(req.body.priority);
  }

  const rule = await prisma.categoryRule.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      category: true,
    },
  });

  res.json({
    success: true,
    message: 'CATEGORY_RULE_UPDATED',
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
    throw new ApiError(404, 'CATEGORY_RULE_NOT_FOUND');
  }

  await prisma.categoryRule.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'CATEGORY_RULE_DELETED',
  });
});

/**
 * @route   POST /api/category-rules/bulk
 * @desc    Bulk create category rules
 * @access  Private
 */
export const bulkCreateCategoryRules = asyncHandler(async (req, res) => {
  const { rules } = req.body;

  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  // Format and validate items
  const formattedRules = rules.map(r => {
    if (!r.categoryId || !Array.isArray(r.keywords)) {
      throw new ApiError(400, 'INVALID_RULE_DATA');
    }
    return {
      userId: req.user.id,
      categoryId: r.categoryId,
      keywords: r.keywords,
      priority: Number(r.priority) || 0,
    };
  });

  const result = await prisma.categoryRule.createMany({
    data: formattedRules,
  });

  res.status(201).json({
    success: true,
    message: 'CATEGORY_RULES_CREATED_BULK',
    data: { count: result.count },
  });
});

/**
 * @route   POST /api/category-rules/bulk-delete
 * @desc    Bulk delete category rules
 * @access  Private
 */
export const bulkDeleteCategoryRules = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  const result = await prisma.categoryRule.deleteMany({
    where: {
      id: { in: ids },
      userId: req.user.id,
    },
  });

  res.json({
    success: true,
    message: 'CATEGORY_RULES_DELETED_BULK',
    data: { count: result.count },
  });
});
