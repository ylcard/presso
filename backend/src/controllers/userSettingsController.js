import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/settings
 * @desc    Get user settings
 * @access  Private
 */
export const getUserSettings = asyncHandler(async (req, res) => {
  let settings = await prisma.userSettings.findUnique({
    where: {
      userId: req.user.id,
    },
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId: req.user.id,
      },
    });
  }

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
  // Check if settings exist
  let settings = await prisma.userSettings.findUnique({
    where: {
      userId: req.user.id,
    },
  });

  if (!settings) {
    // Create settings if they don't exist
    settings = await prisma.userSettings.create({
      data: {
        ...req.body,
        userId: req.user.id,
      },
    });
  } else {
    // Update existing settings
    settings = await prisma.userSettings.update({
      where: {
        userId: req.user.id,
      },
      data: req.body,
    });
  }

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: settings,
  });
});
