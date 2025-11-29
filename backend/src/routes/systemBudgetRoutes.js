import express from 'express';
import {
  getSystemBudgets,
  getSystemBudget,
  createSystemBudget,
  updateSystemBudget,
  deleteSystemBudget,
} from '../controllers/systemBudgetController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createSystemBudgetSchema,
  updateSystemBudgetSchema,
  dateRangeSchema,
} from '../validations/schemas.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/', validate(dateRangeSchema, 'query'), getSystemBudgets);
router.get('/:id', getSystemBudget);
router.post('/', validate(createSystemBudgetSchema), createSystemBudget);
router.put('/:id', validate(updateSystemBudgetSchema), updateSystemBudget);
router.delete('/:id', deleteSystemBudget);

export default router;
