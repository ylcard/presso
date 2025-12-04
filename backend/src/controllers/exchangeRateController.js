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

  // OPTIMIZATION: Ensure uppercase for consistency
  if (fromCurrency) {
    where.fromCurrency = fromCurrency.toUpperCase();
  }

  if (toCurrency) {
    where.toCurrency = toCurrency.toUpperCase();
  }

  const rates = await prisma.exchangeRate.findMany({
    where,
    orderBy: {
      date: 'desc', // Changed from updatedAt to date (business logic standard)
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
    throw new ApiError(404, 'EXCHANGE_RATE_NOT_FOUND');
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
  const { fromCurrency, toCurrency, rate, date } = req.body;

  // SAFETY: Validate required fields and types
  if (!fromCurrency || !toCurrency || rate === undefined) {
    throw new ApiError(400, 'MISSING_REQUIRED_FIELDS');
  }

  const numericRate = Number(rate);
  if (isNaN(numericRate)) {
    throw new ApiError(400, 'INVALID_RATE_FORMAT');
  }

  const rateDate = date ? new Date(date) : new Date();
  if (isNaN(rateDate.getTime())) {
    throw new ApiError(400, 'INVALID_DATE_FORMAT');
  }

  const newRate = await prisma.exchangeRate.create({
    data: {
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      rate: numericRate,
      date: rateDate,
    },
  });

  res.status(201).json({
    success: true,
    message: 'EXCHANGE_RATE_CREATED',
    data: newRate,
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
    throw new ApiError(404, 'EXCHANGE_RATE_NOT_FOUND');
  }

  // SECURITY: Prevent Mass Assignment by whitelisting fields
  const updateData = {};
  
  if (req.body.rate !== undefined) {
    const numericRate = Number(req.body.rate);
    if (isNaN(numericRate)) throw new ApiError(400, 'INVALID_RATE_FORMAT');
    updateData.rate = numericRate;
  }
  
  if (req.body.date) {
    const newDate = new Date(req.body.date);
    if (isNaN(newDate.getTime())) throw new ApiError(400, 'INVALID_DATE_FORMAT');
    updateData.date = newDate;
  }

  // Note: Usually we don't allow changing currency pairs (from/to) on an existing record, 
  // better to delete and create new to maintain historical integrity.

  const rate = await prisma.exchangeRate.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'EXCHANGE_RATE_UPDATED',
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
    throw new ApiError(404, 'EXCHANGE_RATE_NOT_FOUND');
  }

  await prisma.exchangeRate.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'EXCHANGE_RATE_DELETED',
  });
});

/**
 * @route   POST /api/exchange-rates/bulk
 * @desc    Bulk create or update exchange rates
 * @access  Private
 */
export const bulkUpsertExchangeRates = asyncHandler(async (req, res) => {
  const { rates } = req.body;

  if (!rates || !Array.isArray(rates) || rates.length === 0) {
    throw new ApiError(400, 'EMPTY_BULK_REQUEST');
  }

  // OPTIMIZATION: Use transaction for data integrity
  const operations = rates.map((r) => {
    const validRate = Number(r.rate);
    const validDate = r.date ? new Date(r.date) : new Date();
    
    // We assume the combination of from/to/date should be unique.
    // However, since we might not have a composite unique key in Prisma Schema 
    // strictly defined for upsert, we will use createMany or Promise.all.
    // Here we strictly format the data.
    return prisma.exchangeRate.create({
      data: {
        fromCurrency: r.fromCurrency.toUpperCase(),
        toCurrency: r.toCurrency.toUpperCase(),
        rate: validRate,
        date: validDate,
      },
    });
  });

  const results = await prisma.$transaction(operations);

  res.status(201).json({
    success: true,
    message: 'EXCHANGE_RATES_BULK_PROCESSED',
    data: { count: results.length },
  });
});
