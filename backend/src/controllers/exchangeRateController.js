import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * @route   GET /api/exchange-rates
 * @desc    Get all exchange rates
 * @access  Private
 */
export const getExchangeRates = asyncHandler(async (req, res) => {
  const { fromCurrency, toCurrency } = req.query;

  const where = {};

  if (fromCurrency) {
    where.fromCurrency = fromCurrency;
  }

  if (toCurrency) {
    where.toCurrency = toCurrency;
  }

  const rates = await prisma.exchangeRate.findMany({
    where,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: rates,
  });
});

/**
 * @route   GET /api/exchange-rates/:id
 * @desc    Get single exchange rate
 * @access  Private
 */
export const getExchangeRate = asyncHandler(async (req, res) => {
  const rate = await prisma.exchangeRate.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!rate) {
    throw new ApiError(404, 'Exchange rate not found');
  }

  res.json({
    success: true,
    data: rate,
  });
});

/**
 * @route   POST /api/exchange-rates
 * @desc    Create new exchange rate
 * @access  Private
 */
export const createExchangeRate = asyncHandler(async (req, res) => {
  const rate = await prisma.exchangeRate.create({
    data: req.body,
  });

  res.status(201).json({
    success: true,
    message: 'Exchange rate created successfully',
    data: rate,
  });
});

/**
 * @route   PUT /api/exchange-rates/:id
 * @desc    Update exchange rate
 * @access  Private
 */
export const updateExchangeRate = asyncHandler(async (req, res) => {
  const existingRate = await prisma.exchangeRate.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!existingRate) {
    throw new ApiError(404, 'Exchange rate not found');
  }

  const rate = await prisma.exchangeRate.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({
    success: true,
    message: 'Exchange rate updated successfully',
    data: rate,
  });
});

/**
 * @route   DELETE /api/exchange-rates/:id
 * @desc    Delete exchange rate
 * @access  Private
 */
export const deleteExchangeRate = asyncHandler(async (req, res) => {
  const rate = await prisma.exchangeRate.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!rate) {
    throw new ApiError(404, 'Exchange rate not found');
  }

  await prisma.exchangeRate.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Exchange rate deleted successfully',
  });
});
