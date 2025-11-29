import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/cash-wallet
 * @desc    Get user's cash wallet
 * @access  Private
 */
export const getCashWallet = asyncHandler(async (req, res) => {
  let wallet = await prisma.cashWallet.findUnique({
    where: {
      userId: req.user.id,
    },
  });

  // Create wallet if it doesn't exist
  if (!wallet) {
    wallet = await prisma.cashWallet.create({
      data: {
        userId: req.user.id,
        amount: 0,
      },
    });
  }

  res.json({
    success: true,
    data: wallet,
  });
});

/**
 * @route   PUT /api/cash-wallet
 * @desc    Update cash wallet amount
 * @access  Private
 */
export const updateCashWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (amount < 0) {
    throw new ApiError(400, 'Cash wallet amount cannot be negative');
  }

  let wallet = await prisma.cashWallet.findUnique({
    where: {
      userId: req.user.id,
    },
  });

  if (!wallet) {
    // Create wallet if it doesn't exist
    wallet = await prisma.cashWallet.create({
      data: {
        userId: req.user.id,
        amount,
      },
    });
  } else {
    // Update existing wallet
    wallet = await prisma.cashWallet.update({
      where: {
        userId: req.user.id,
      },
      data: {
        amount,
      },
    });
  }

  res.json({
    success: true,
    message: 'Cash wallet updated successfully',
    data: wallet,
  });
});

/**
 * @route   POST /api/cash-wallet/deposit
 * @desc    Deposit money to cash wallet
 * @access  Private
 */
export const depositToCashWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Deposit amount must be positive');
  }

  let wallet = await prisma.cashWallet.findUnique({
    where: {
      userId: req.user.id,
    },
  });

  if (!wallet) {
    wallet = await prisma.cashWallet.create({
      data: {
        userId: req.user.id,
        amount,
      },
    });
  } else {
    wallet = await prisma.cashWallet.update({
      where: {
        userId: req.user.id,
      },
      data: {
        amount: {
          increment: amount,
        },
      },
    });
  }

  res.json({
    success: true,
    message: `Successfully deposited ${amount} to cash wallet`,
    data: wallet,
  });
});

/**
 * @route   POST /api/cash-wallet/withdraw
 * @desc    Withdraw money from cash wallet
 * @access  Private
 */
export const withdrawFromCashWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Withdrawal amount must be positive');
  }

  const wallet = await prisma.cashWallet.findUnique({
    where: {
      userId: req.user.id,
    },
  });

  if (!wallet) {
    throw new ApiError(404, 'Cash wallet not found');
  }

  if (wallet.amount < amount) {
    throw new ApiError(400, 'Insufficient cash wallet balance');
  }

  const updatedWallet = await prisma.cashWallet.update({
    where: {
      userId: req.user.id,
    },
    data: {
      amount: {
        decrement: amount,
      },
    },
  });

  res.json({
    success: true,
    message: `Successfully withdrew ${amount} from cash wallet`,
    data: updatedWallet,
  });
});
