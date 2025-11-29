import express from 'express';
import {
  getCategoryRules,
  getCategoryRule,
  createCategoryRule,
  updateCategoryRule,
  deleteCategoryRule,
} from '../controllers/categoryRuleController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCategoryRuleSchema,
  updateCategoryRuleSchema,
} from '../validations/schemas.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/', getCategoryRules);
router.get('/:id', getCategoryRule);
router.post('/', validate(createCategoryRuleSchema), createCategoryRule);
router.put('/:id', validate(updateCategoryRuleSchema), updateCategoryRule);
router.delete('/:id', deleteCategoryRule);

export default router;
