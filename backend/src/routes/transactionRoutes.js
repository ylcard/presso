import express from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
  dateRangeSchema,
} from '../validations/schemas.js';

const router = express.Router();
console.log('[DEBUG] Loading transactionRoutes...');

// All routes are protected
router.use(authenticate);

// Statistics
router.get('/stats/summary', validate(dateRangeSchema, 'query'), getTransactionStats);

// CRUD operations
router.get('/', validate(transactionFilterSchema, 'query'), getTransactions);
router.get('/:id', getTransaction);
router.post('/', validate(createTransactionSchema), createTransaction);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
