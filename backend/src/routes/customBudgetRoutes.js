import express from 'express';
import {
  getCustomBudgets,
  getCustomBudget,
  createCustomBudget,
  updateCustomBudget,
  deleteCustomBudget,
  getCustomBudgetAllocations,
  addCustomBudgetAllocation,
  updateCustomBudgetAllocation,
  deleteCustomBudgetAllocation,
} from '../controllers/customBudgetController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCustomBudgetSchema,
  updateCustomBudgetSchema,
  createCustomBudgetAllocationSchema,
  updateCustomBudgetAllocationSchema,
} from '../validations/schemas.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Budget allocations
router.get('/:id/allocations', getCustomBudgetAllocations);
router.post(
  '/:id/allocations',
  validate(createCustomBudgetAllocationSchema),
  addCustomBudgetAllocation
);
router.put(
  '/:budgetId/allocations/:allocationId',
  validate(updateCustomBudgetAllocationSchema),
  updateCustomBudgetAllocation
);
router.delete('/:budgetId/allocations/:allocationId', deleteCustomBudgetAllocation);

// Budget CRUD
router.get('/', getCustomBudgets);
router.get('/:id', getCustomBudget);
router.post('/', validate(createCustomBudgetSchema), createCustomBudget);
router.put('/:id', validate(updateCustomBudgetSchema), updateCustomBudget);
router.delete('/:id', deleteCustomBudget);

export default router;
