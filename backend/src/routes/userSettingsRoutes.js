import express from 'express';
import {
  getUserSettings,
  updateUserSettings,
} from '../controllers/userSettingsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateUserSettingsSchema } from '../validations/schemas.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/', getUserSettings);
router.put('/', validate(updateUserSettingsSchema), updateUserSettings);

export default router;
