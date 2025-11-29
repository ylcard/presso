import express from 'express';
import {
  getMiniBudgets,
  getMiniBudget,
  createMiniBudget,
  updateMiniBudget,
  deleteMiniBudget,
} from '../controllers/miniBudgetController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createMiniBudgetSchema,
  updateMiniBudgetSchema,
} from '../validations/schemas.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/', getMiniBudgets);
router.get('/:id', getMiniBudget);
router.post('/', validate(createMiniBudgetSchema), createMiniBudget);
router.put('/:id', validate(updateMiniBudgetSchema), updateMiniBudget);
router.delete('/:id', deleteMiniBudget);

export default router;
