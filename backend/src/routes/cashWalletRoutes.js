import express from 'express';
import {
  getCashWallet,
  updateCashWallet,
  depositToCashWallet,
  withdrawFromCashWallet,
} from '../controllers/cashWalletController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateCashWalletSchema } from '../validations/schemas.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/', getCashWallet);
router.put('/', validate(updateCashWalletSchema), updateCashWallet);
router.post('/deposit', validate(updateCashWalletSchema), depositToCashWallet);
router.post('/withdraw', validate(updateCashWalletSchema), withdrawFromCashWallet);

export default router;
