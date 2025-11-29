import express from 'express';
import {
  getExchangeRates,
  getExchangeRate,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
} from '../controllers/exchangeRateController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createExchangeRateSchema,
  updateExchangeRateSchema,
} from '../validations/schemas.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/', getExchangeRates);
router.get('/:id', getExchangeRate);
router.post('/', validate(createExchangeRateSchema), createExchangeRate);
router.put('/:id', validate(updateExchangeRateSchema), updateExchangeRate);
router.delete('/:id', deleteExchangeRate);

export default router;
