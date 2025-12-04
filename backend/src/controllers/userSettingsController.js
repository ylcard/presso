import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/settings
 * @desc    Get user settings (Lazy creates if missing)
 * @access  Private
 */
export const getUserSettings = asyncHandler(async (req, res) => {
  // ATOMIC: Find the settings, or create them if they don't exist.
  // This prevents race conditions where two requests might try to create settings at once.
  const settings = await prisma.userSettings.upsert({
    where: {
      userId: req.user.id,
    },
    update: {}, // No changes if found
    create: {
      userId: req.user.id,
    },
  });

  res.json({
    success: true,
    data: settings,
  });
});

/**
 * @route   PUT /api/settings
 * @desc    Update user settings
 * @access  Private
 */
export const updateUserSettings = asyncHandler(async (req, res) => {
  const {
    baseCurrency,
    currencyPosition,
    thousandSeparator,
    decimalSeparator,
    decimalPlaces,
    hideTrailingZeros,
    dateFormat,
    budgetViewMode,
    fixedLifestyleMode,
    goalMode,
  } = req.body;

  // SECURITY: Whitelist fields to prevent Mass Assignment attacks.
  // We only put fields into this object that we explicitly want to allow updating.
  const cleanData = {};

  if (baseCurrency !== undefined) cleanData.baseCurrency = baseCurrency;
  if (currencyPosition !== undefined) cleanData.currencyPosition = currencyPosition;
  if (thousandSeparator !== undefined) cleanData.thousandSeparator = thousandSeparator;
  if (decimalSeparator !== undefined) cleanData.decimalSeparator = decimalSeparator;
  if (decimalPlaces !== undefined) cleanData.decimalPlaces = Number(decimalPlaces);
  if (hideTrailingZeros !== undefined) cleanData.hideTrailingZeros = Boolean(hideTrailingZeros);
  if (dateFormat !== undefined) cleanData.dateFormat = dateFormat;
  if (budgetViewMode !== undefined) cleanData.budgetViewMode = budgetViewMode;
  if (fixedLifestyleMode !== undefined) cleanData.fixedLifestyleMode = Boolean(fixedLifestyleMode);
  if (goalMode !== undefined) cleanData.goalMode = Boolean(goalMode);

  // ATOMIC: Update or Create in one go
  const settings = await prisma.userSettings.upsert({
    where: {
      userId: req.user.id,
    },
    update: cleanData,
    create: {
      userId: req.user.id,
      ...cleanData,
    },
  });

  res.json({
    success: true,
    message: 'SETTINGS_UPDATED',
    data: settings,
  });
});
