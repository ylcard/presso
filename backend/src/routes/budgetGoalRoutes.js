import express from 'express';
import {
  getBudgetGoals,
  getBudgetGoalByPriority,
  createBudgetGoal,
  updateBudgetGoal,
  deleteBudgetGoal,
} from '../controllers/budgetGoalController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createBudgetGoalSchema,
  updateBudgetGoalSchema,
} from '../validations/schemas.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/', getBudgetGoals);
router.get('/:priority', getBudgetGoalByPriority);
router.post('/', validate(createBudgetGoalSchema), createBudgetGoal);
router.put('/:id', validate(updateBudgetGoalSchema), updateBudgetGoal);
router.delete('/:id', deleteBudgetGoal);

export default router;
